import { z } from 'zod';
import { TrimmedNonEmptyString } from './strings.js';

/**
 * No-street-address Location (spec §5.6, all apps):
 * Location { pin?, zone, landmark, directions, maskedRelay }
 * There is no street-address field anywhere; navigation is landmark-first.
 *
 * FOUNDER RULING (2026-08-08, canon v3.11.0) — THE PIN IS OPTIONAL. The
 * required-pin shape forced every hand-composed task through a paste-from-
 * maps step, while both shells' own display law (SE0.3, landmark-first)
 * never LEADS with the pin and the rider app never reads it at all. No
 * honest client-side default exists — a fabricated coordinate reaching a
 * rider unchallenged is worse than an absence — so absence is now
 * representable. When PRESENT it must still be a real coordinate pair;
 * range bounds stay the door's job (Séra's /ops/task checks the globe).
 */
export const LocationSchema = z
  .object({
    pin: z.object({ lat: z.number(), lng: z.number() }).optional(),
    zone: TrimmedNonEmptyString, // WO-5.14 display string (delivery-route zone) — trimmed non-empty
    landmark: TrimmedNonEmptyString, // WO-5.14 display/name string — trimmed non-empty
    directions: z.string(),
    maskedRelay: z.string(),
  })
  .strict();
export type Location = z.infer<typeof LocationSchema>;
