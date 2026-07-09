import type { Catalog, CatalogEntry, ScreenClass } from './catalog.js';

/**
 * French Voice copy-lint (Execution Contract §10.5, CI-checkable form).
 * Fails on exactly the four conditions:
 *   (a) banned-register token in customer copy
 *   (b) register mismatch — marketing/urgency token in a money string, or
 *       ledger/finance jargon in a selling string
 *   (c) reading-level budget exceeded for the entry's screen class
 *   (d) a Mooré/Dioula token in a `register: money` or `class: instruction`
 *       string (including a moore/dioula variant carried on such an entry)
 * Token lists and budgets are maintained data files, not hardcoded regexes.
 */

export type LintCondition =
  | 'banned_register_token'
  | 'register_mismatch'
  | 'reading_level'
  | 'local_language_in_money_or_instruction';

export interface LintViolation {
  key: string;
  condition: LintCondition;
  message: string;
}

export interface LintReport {
  ok: boolean;
  checkedEntries: number;
  violations: LintViolation[];
}

export interface LintData {
  bannedRegisterTokens: readonly string[];
  marketingUrgencyTokens: readonly string[];
  financeJargonTokens: readonly string[];
  localLanguageTokens: readonly string[];
  readingBudgets: Readonly<Record<ScreenClass, { maxWordsPerSentence: number; maxAvgSyllablesPerWord: number }>>;
}

function tokenPattern(token: string): RegExp {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
}

export function findToken(text: string, tokens: readonly string[]): string | undefined {
  const normalized = text.normalize('NFC');
  return tokens.find((token) => tokenPattern(token.normalize('NFC')).test(normalized));
}

/** Sentence split for the reading heuristic: ., !, ?, … end a sentence. */
export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?…]+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function words(sentence: string): string[] {
  return sentence
    .split(/\s+/u)
    .map((w) => w.trim())
    .filter((w) => /\p{L}/u.test(w));
}

/** Rough French syllable estimate: count vowel groups, minimum one. */
export function estimateSyllables(word: string): number {
  const groups = word
    .normalize('NFC')
    .toLowerCase()
    .match(/[aàâäeéèêëiîïoôöuùûüyœæ]+/gu);
  return Math.max(1, groups?.length ?? 0);
}

function textFields(entry: CatalogEntry): Array<{ field: string; text: string }> {
  const fields: Array<{ field: string; text: string }> = [{ field: 'fr', text: entry.fr }];
  if (entry.moore !== undefined) fields.push({ field: 'moore', text: entry.moore });
  if (entry.dioula !== undefined) fields.push({ field: 'dioula', text: entry.dioula });
  return fields;
}

export function lintCatalog(catalog: Catalog, data: LintData): LintReport {
  const violations: LintViolation[] = [];

  for (const entry of catalog) {
    // (a) banned-register tokens — customer copy is the whole catalog.
    for (const { field, text } of textFields(entry)) {
      const hit = findToken(text, data.bannedRegisterTokens);
      if (hit !== undefined) {
        violations.push({
          key: entry.key,
          condition: 'banned_register_token',
          message: `banned-register token « ${hit} » in ${field}: "${text}"`,
        });
      }
    }

    // (b) register mismatch.
    if (entry.register === 'money') {
      const hit = findToken(entry.fr, data.marketingUrgencyTokens);
      if (hit !== undefined) {
        violations.push({
          key: entry.key,
          condition: 'register_mismatch',
          message: `marketing/urgency token « ${hit} » in a register:money string: "${entry.fr}"`,
        });
      }
    }
    if (entry.register === 'selling') {
      const hit = findToken(entry.fr, data.financeJargonTokens);
      if (hit !== undefined) {
        violations.push({
          key: entry.key,
          condition: 'register_mismatch',
          message: `ledger/finance jargon « ${hit} » in a register:selling string: "${entry.fr}"`,
        });
      }
    }

    // (c) reading-level budget for the entry's screen class.
    const budget = data.readingBudgets[entry.screenClass];
    for (const sentence of splitSentences(entry.fr)) {
      const sentenceWords = words(sentence);
      if (sentenceWords.length > budget.maxWordsPerSentence) {
        violations.push({
          key: entry.key,
          condition: 'reading_level',
          message: `sentence of ${sentenceWords.length} words exceeds the ${entry.screenClass} budget of ${budget.maxWordsPerSentence}: "${sentence}"`,
        });
      }
      if (sentenceWords.length > 0) {
        const avgSyllables =
          sentenceWords.reduce((sum, w) => sum + estimateSyllables(w), 0) / sentenceWords.length;
        if (avgSyllables > budget.maxAvgSyllablesPerWord) {
          violations.push({
            key: entry.key,
            condition: 'reading_level',
            message: `average ${avgSyllables.toFixed(2)} syllables/word exceeds the ${entry.screenClass} budget of ${budget.maxAvgSyllablesPerWord}: "${sentence}"`,
          });
        }
      }
    }

    // (d) Mooré/Dioula in money or instruction strings.
    const localForbidden = entry.register === 'money' || entry.screenClass === 'instruction';
    if (localForbidden) {
      const hit = findToken(entry.fr, data.localLanguageTokens);
      if (hit !== undefined) {
        violations.push({
          key: entry.key,
          condition: 'local_language_in_money_or_instruction',
          message: `Mooré/Dioula token « ${hit} » in a ${entry.register}/${entry.screenClass} string: "${entry.fr}"`,
        });
      }
      if (entry.moore !== undefined || entry.dioula !== undefined) {
        violations.push({
          key: entry.key,
          condition: 'local_language_in_money_or_instruction',
          message: `moore/dioula variant carried on a ${entry.register}/${entry.screenClass} entry — money and instruction strings stay French`,
        });
      }
    }
  }

  return { ok: violations.length === 0, checkedEntries: catalog.length, violations };
}

export function formatLintReport(report: LintReport): string {
  if (report.ok) {
    return `copy-lint OK: ${report.checkedEntries} entries, 0 violations`;
  }
  const lines = [
    `copy-lint FAILED: ${report.violations.length} violation(s) across ${report.checkedEntries} entries`,
  ];
  for (const v of report.violations) {
    lines.push(`  [${v.condition}] ${v.key}: ${v.message}`);
  }
  return lines.join('\n');
}
