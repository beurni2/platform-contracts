import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { SCREEN_CLASSES } from './catalog.js';
import type { LintData } from './lint.js';

const TokenFileSchema = z
  .object({ description: z.string(), tokens: z.array(z.string().min(1)) })
  .strict();

const BudgetFileSchema = z
  .object({
    description: z.string(),
    budgets: z.record(
      z.enum(SCREEN_CLASSES),
      z
        .object({
          maxWordsPerSentence: z.number().int().positive(),
          maxAvgSyllablesPerWord: z.number().positive(),
        })
        .strict(),
    ),
  })
  .strict();

/** Default data dir: the `data/` folder shipped with this package. */
export function defaultDataDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
}

async function loadTokens(dataDir: string, file: string): Promise<readonly string[]> {
  const parsed = TokenFileSchema.parse(JSON.parse(await readFile(join(dataDir, file), 'utf8')));
  return parsed.tokens;
}

export async function loadLintData(dataDir: string = defaultDataDir()): Promise<LintData> {
  const budgetFile = BudgetFileSchema.parse(
    JSON.parse(await readFile(join(dataDir, 'reading-budgets.json'), 'utf8')),
  );
  const budgets = budgetFile.budgets as LintData['readingBudgets'];
  for (const screenClass of SCREEN_CLASSES) {
    if (!(screenClass in budgets)) {
      throw new Error(`reading-budgets.json is missing screen class: ${screenClass}`);
    }
  }
  return {
    bannedRegisterTokens: await loadTokens(dataDir, 'banned-register-tokens.json'),
    marketingUrgencyTokens: await loadTokens(dataDir, 'marketing-urgency-tokens.json'),
    financeJargonTokens: await loadTokens(dataDir, 'finance-jargon-tokens.json'),
    localLanguageTokens: await loadTokens(dataDir, 'local-language-tokens.json'),
    readingBudgets: budgets,
  };
}
