import { describe, expect, it } from 'vitest';
import { LocationSchema } from '../src/location.js';
import { isFinalOfflineStatus, PENDING_OFFLINE_STATUSES } from '../src/offline.js';
import { MediaRefSchema } from '../src/media.js';

describe('kernel Location — no street address, ever', () => {
  const valid = {
    pin: { lat: 12.3714, lng: -1.5197 },
    zone: 'Ouaga 2000',
    landmark: 'En face de la pharmacie du Rond-point',
    directions: 'Portail vert, deuxième cour',
    maskedRelay: 'relay_abc',
  };

  it('parses the five-field no-address shape', () => {
    expect(LocationSchema.safeParse(valid).success).toBe(true);
  });

  it('v3.11.0 (founder ruling 2026-08-08): the pin is OPTIONAL — absence is representable, a fake is not required', () => {
    const { pin: _pin, ...sansPin } = valid;
    expect(LocationSchema.safeParse(sansPin).success).toBe(true);
    // When PRESENT it must still be a real coordinate pair.
    expect(LocationSchema.safeParse({ ...valid, pin: { lat: 'douze', lng: -1.5 } }).success).toBe(false);
    expect(LocationSchema.safeParse({ ...valid, pin: { lat: 12.37 } }).success).toBe(false);
  });

  it('rejects a streetAddress field (strict shape)', () => {
    const withStreet = { ...valid, streetAddress: '12 rue de la Paix' };
    expect(LocationSchema.safeParse(withStreet).success).toBe(false);
  });
});

describe('offline semantics — queued = pending, never done', () => {
  it('queued and syncing are never final', () => {
    for (const status of PENDING_OFFLINE_STATUSES) {
      expect(isFinalOfflineStatus(status)).toBe(false);
    }
  });

  it('only server acknowledgement or rejection is final', () => {
    expect(isFinalOfflineStatus('server_acknowledged')).toBe(true);
    expect(isFinalOfflineStatus('rejected')).toBe(true);
  });
});

describe('media refs', () => {
  it('requires a sha256 content hash', () => {
    expect(
      MediaRefSchema.safeParse({ ref: 'r2://x', sha256: 'nope', mimeType: 'image/jpeg' }).success,
    ).toBe(false);
    expect(
      MediaRefSchema.safeParse({ ref: 'r2://x', sha256: 'b'.repeat(64), mimeType: 'image/jpeg' }).success,
    ).toBe(true);
  });
});
