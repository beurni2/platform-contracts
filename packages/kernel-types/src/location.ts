import { z } from 'zod';
import { TrimmedNonEmptyString } from './strings.js';

/**
 * No-street-address Location (spec §5.6, all apps):
 * Location { pin, zone, landmark, directions, maskedRelay }
 * There is no street-address field anywhere; navigation is landmark-first.
 */
export const LocationSchema = z
  .object({
    pin: z.object({ lat: z.number(), lng: z.number() }),
    zone: TrimmedNonEmptyString, // WO-5.14 display string (delivery-route zone) — trimmed non-empty
    landmark: TrimmedNonEmptyString, // WO-5.14 display/name string — trimmed non-empty
    directions: z.string(),
    maskedRelay: z.string(),
  })
  .strict();
export type Location = z.infer<typeof LocationSchema>;
