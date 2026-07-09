import { z } from 'zod';

/**
 * No-street-address Location (spec §5.6, all apps):
 * Location { pin, zone, landmark, directions, maskedRelay }
 * There is no street-address field anywhere; navigation is landmark-first.
 */
export const LocationSchema = z
  .object({
    pin: z.object({ lat: z.number(), lng: z.number() }),
    zone: z.string().min(1),
    landmark: z.string().min(1),
    directions: z.string(),
    maskedRelay: z.string(),
  })
  .strict();
export type Location = z.infer<typeof LocationSchema>;
