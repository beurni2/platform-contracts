import { z } from 'zod';

/**
 * Media reference types (spec §5.1). References only — the media pipeline
 * itself (capture, normalization, derivatives) lives in app repos.
 * Originals are private and immutable; processing creates versioned
 * derivatives (B+I-08).
 */
export const MediaRefSchema = z
  .object({
    ref: z.string().min(1),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
    mimeType: z.string().min(1),
  })
  .strict();
export type MediaRef = z.infer<typeof MediaRefSchema>;

/** Voice = recorded audio, never STT (B+I-11). */
export const AudioNoteRefSchema = MediaRefSchema.extend({
  durationSec: z.number().int().nonnegative(),
}).strict();
export type AudioNoteRef = z.infer<typeof AudioNoteRefSchema>;
