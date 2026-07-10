/**
 * Flag / kill-switch service (Execution Contract §7.2 — the E0-harness item
 * landing live at E1 assembly). A real worker with durable storage, remotely
 * togglable over HTTP within the harness:
 *
 *   GET  /flags                  → the current FlagSnapshot (consumed by
 *                                  @shop-plus/flags-client parseSnapshot)
 *   POST /kill/:switch           → body {"on": true|false} — engage or
 *                                  release a §7.2 kill switch
 *
 * State lives in a Durable Object; every change bumps the snapshot version.
 * The snapshot shape is exactly @shop-plus/flags-client's FlagSnapshot.
 */

export interface Env {
  FLAG_STATE: DurableObjectNamespace;
}

const KILL_SWITCHES = ['checkout', 'dispatch', 'payout', 'category'] as const;
type KillSwitch = (typeof KILL_SWITCHES)[number];

interface FlagState {
  revision: number;
  flags: Record<string, boolean>;
  kills: KillSwitch[];
  killedCategories: string[];
}

const INITIAL_STATE: FlagState = { revision: 1, flags: {}, kills: [], killedCategories: [] };

export class FlagStateDO {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const stored = ((await this.state.storage.get('flag-state')) as FlagState | undefined) ?? INITIAL_STATE;

    if (request.method === 'GET' && url.pathname === '/flags') {
      return Response.json({
        version: `assembly-flags-r${stored.revision}`,
        flags: stored.flags,
        kills: stored.kills,
        killedCategories: stored.killedCategories,
      });
    }

    const killMatch = /^\/kill\/([a-z]+)$/.exec(url.pathname);
    if (request.method === 'POST' && killMatch) {
      const name = killMatch[1] as KillSwitch;
      if (!KILL_SWITCHES.includes(name)) {
        return Response.json({ ok: false, reason: 'unknown_kill_switch' }, { status: 400 });
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ ok: false, reason: 'malformed_body' }, { status: 400 });
      }
      const on = (body as Record<string, unknown>)['on'];
      if (typeof on !== 'boolean') {
        return Response.json({ ok: false, reason: 'malformed_body' }, { status: 400 });
      }
      const kills = new Set(stored.kills);
      if (on) kills.add(name);
      else kills.delete(name);
      const next: FlagState = { ...stored, revision: stored.revision + 1, kills: [...kills] };
      await this.state.storage.put('flag-state', next);
      return Response.json({ ok: true, kill: name, on, revision: next.revision });
    }

    return Response.json({ ok: false, reason: 'not_found' }, { status: 404 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.FLAG_STATE.idFromName('global');
    return env.FLAG_STATE.get(id).fetch(request);
  },
};
