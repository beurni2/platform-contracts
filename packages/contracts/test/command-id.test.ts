import { describe, expect, it } from 'vitest';
import { CommandIdSchema, mintCommandId } from '../src/command-id.js';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('command_id mint rule (founder ruling, Beurni 2026-07-13)', () => {
  it('mintCommandId returns a UUIDv4 that CommandIdSchema accepts', () => {
    const id = mintCommandId();
    expect(id).toMatch(V4);
    expect(CommandIdSchema.safeParse(id).success).toBe(true);
  });

  it('mints DISTINCT ids across calls (CSPRNG entropy — not a constant)', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => mintCommandId()));
    expect(ids.size).toBe(1000);
  });

  it('CommandIdSchema REJECTS non-UUIDv4 forms (readable ids, nil, wrong version)', () => {
    for (const bad of [
      'cmd_1',
      '',
      'not-a-uuid',
      '00000000-0000-0000-0000-000000000000', // nil (version 0)
      '12345678-1234-1234-1234-123456789012', // version 1, variant 1
    ]) {
      expect(CommandIdSchema.safeParse(bad).success, bad).toBe(false);
    }
  });
});
