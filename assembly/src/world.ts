/**
 * The E1 live world: every real service the fifteen steps traverse,
 * instantiated from the pinned app packages, plus the three workerd
 * (Miniflare) workers — boutik stock DO, shop reservation DO, and the
 * assembly's flag/kill-switch service. NO app logic is reimplemented here:
 * this file only constructs and wires the imported classes.
 */
import { existsSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';

import { SupplierRegistry } from '@boutik/supplier-service';
import { ProductCatalog } from '@boutik/catalog-service';
import { OfferBook } from '@boutik/offer-service';
import { FulfillmentBook } from '@boutik/fulfillment-service';
import { MockPaymentProvider } from '@shop-plus/commerce-core';
import { parseSnapshot, type FlagSnapshot } from '@shop-plus/flags-client';
import { AssignmentBook, ReadyQueue, RiderRegistry } from '@sera/logistics-service';
import type { CustodySpine } from '@sera/custody-service';
import type { OrderSpine } from '@shop-plus/commerce-core';

const ASSEMBLY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function packageDir(name: string): string {
  // the app packages export only "." (→ ./dist/index.js); walk up from the
  // resolved entry to the directory that carries package.json.
  let dir = dirname(realpathSync(fileURLToPath(import.meta.resolve(name))));
  while (!existsSync(join(dir, 'package.json'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`package.json not found above ${name} entry`);
    dir = parent;
  }
  return dir;
}

function workerBundle(pkg: string, file: string): string {
  const path = join(packageDir(pkg), 'dist-worker', file);
  if (!existsSync(path)) throw new Error(`missing committed worker bundle: ${path}`);
  return path;
}

export interface LiveWorld {
  // Boutik+ (supply)
  suppliers: SupplierRegistry;
  catalog: ProductCatalog;
  offers: OfferBook;
  fulfillment: FulfillmentBook;
  // Shop+ (demand)
  paymentProvider: MockPaymentProvider;
  // Séra (proof)
  riders: RiderRegistry;
  queue: ReadyQueue;
  assignments: AssignmentBook;
  // cross-step mutable slots the adapters fill as the chain progresses
  slots: {
    supplierId?: string;
    product?: unknown;
    variantId?: string;
    offer?: unknown;
    projection?: unknown;
    listingId?: string;
    resellerId?: string;
    quote?: unknown;
    orderSpine?: OrderSpine;
    custody?: CustodySpine;
    secrets?: { pickupCode: string; sealId: string; dropCode: string };
    payoutEvents?: unknown[];
  };
  // workerd surfaces
  stockDo: (variantId: string, cmd: unknown) => Promise<{ status: number; body: unknown }>;
  reservationDo: (quoteId: string, cmd: unknown) => Promise<{ status: number; body: unknown }>;
  flagSnapshot: () => Promise<FlagSnapshot>;
  setKill: (name: 'checkout' | 'dispatch' | 'payout' | 'category', on: boolean) => Promise<unknown>;
  dispose: () => Promise<void>;
}

export async function createLiveWorld(): Promise<LiveWorld> {
  const stockMf = new Miniflare({
    modules: true,
    scriptPath: workerBundle('@boutik/inventory-service', 'stock-worker.mjs'),
    durableObjects: { STOCK_RESERVATION: 'StockReservationDO' },
  });
  const reservationMf = new Miniflare({
    modules: true,
    scriptPath: workerBundle('@shop-plus/commerce-core', 'reservation-worker.mjs'),
    durableObjects: { QUOTE_RESERVATION: 'QuoteReservationDO' },
  });
  const flagMf = new Miniflare({
    modules: true,
    scriptPath: join(ASSEMBLY_ROOT, 'dist-worker', 'flag-worker.mjs'),
    durableObjects: { FLAG_STATE: 'FlagStateDO' },
  });

  const suppliers = new SupplierRegistry();
  const catalog = new ProductCatalog();
  const offers = new OfferBook();
  const fulfillment = new FulfillmentBook();
  const paymentProvider = new MockPaymentProvider({});
  const riders = new RiderRegistry();

  const world: LiveWorld = {
    suppliers,
    catalog,
    offers,
    fulfillment,
    paymentProvider,
    riders,
    // ReadyQueue's intake projections read the REAL cross-repo state: the
    // funding check inspects the shop OrderSpine's recorded escrow; the
    // readiness check asks the boutik FulfillmentBook. Nothing is invented.
    queue: undefined as unknown as ReadyQueue,
    assignments: undefined as unknown as AssignmentBook,
    slots: {},
    async stockDo(variantId, cmd) {
      const res = await stockMf.dispatchFetch(`http://inventory/stock/${variantId}`, {
        method: 'POST',
        body: JSON.stringify(cmd),
      });
      return { status: res.status, body: await res.json() };
    },
    async reservationDo(quoteId, cmd) {
      const res = await reservationMf.dispatchFetch(`http://commerce-core/reservations/${quoteId}`, {
        method: 'POST',
        body: JSON.stringify(cmd),
      });
      return { status: res.status, body: await res.json() };
    },
    async flagSnapshot() {
      const res = await flagMf.dispatchFetch('http://flags/flags');
      return parseSnapshot(await res.json());
    },
    async setKill(name, on) {
      const res = await flagMf.dispatchFetch(`http://flags/kill/${name}`, {
        method: 'POST',
        body: JSON.stringify({ on }),
      });
      return res.json();
    },
    async dispose() {
      await Promise.all([stockMf.dispose(), reservationMf.dispose(), flagMf.dispose()]);
    },
  };

  const queue = new ReadyQueue({
    funding: {
      check: (orderId: string) => {
        const escrow = world.slots.orderSpine?.ledger.escrowFor(orderId);
        const funded =
          escrow !== undefined &&
          escrow.paymentLegs.some((l) => l.legType === 'checkout' && (l.status === 'held' || l.status === 'captured'));
        return {
          status: funded ? ('funded' as const) : ('unfunded' as const),
          paymentMode: 'FULL_PREPAY',
          asOf: new Date().toISOString(),
          stale: false,
        };
      },
    },
    readiness: {
      check: (orderId: string) => ({
        ready: fulfillment.isPickupEligible(orderId),
        asOf: new Date().toISOString(),
        stale: false,
      }),
    },
  });
  world.queue = queue;
  world.assignments = new AssignmentBook(riders, queue);
  return world;
}
