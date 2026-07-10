import { z } from 'zod';

/**
 * Catalog entry schema (WO-0 §B4 / Execution Contract §10.5): every
 * user-facing string lives in the catalog with a register tag and a screen
 * class — never inline in app code.
 */
export const REGISTERS = ['money', 'selling', 'neutral'] as const;
export const RegisterSchema = z.enum(REGISTERS);
export type Register = z.infer<typeof RegisterSchema>;

/**
 * Screen classes drive the reading-level budget (maintained data, not canon):
 * `instruction` additionally forbids Mooré/Dioula tokens (§10.5 condition d).
 * `label` (D18, founder-signed 2026-07-10) is exempt from reading-level
 * budgets entirely — banned tokens and register checks still apply.
 */
export const SCREEN_CLASSES = ['checkout', 'instruction', 'status', 'selling_surface', 'general', 'label'] as const;
export const ScreenClassSchema = z.enum(SCREEN_CLASSES);
export type ScreenClass = z.infer<typeof ScreenClassSchema>;

export const CatalogEntrySchema = z
  .object({
    key: z.string().min(1),
    fr: z.string().min(1),
    register: RegisterSchema,
    screenClass: ScreenClassSchema,
    moore: z.string().min(1).optional(),
    dioula: z.string().min(1).optional(),
    audioScriptRef: z.string().min(1).optional(),
  })
  .strict();
export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

export const CatalogSchema = z.array(CatalogEntrySchema).superRefine((entries, ctx) => {
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    if (seen.has(entry.key)) {
      ctx.addIssue({ code: 'custom', path: [index, 'key'], message: `duplicate catalog key: ${entry.key}` });
    }
    seen.add(entry.key);
  });
});
export type Catalog = z.infer<typeof CatalogSchema>;
