import { boutikPlusTheme, neutralColors } from '@platform/ui-tokens';
import { NINE_CHAIN_IDS } from './steps.js';
import type { ChainReport } from './runner.js';

/**
 * The E1 "basic dashboard" seed (Contract E1 exit): a static HTML chain
 * report. Warm family surfaces, one clear verdict, the nine-id chain visible
 * at a glance — sparse, never careless.
 */
const c = {
  surface: neutralColors.surface,
  raised: neutralColors.surfaceRaised,
  ink: neutralColors.ink,
  muted: neutralColors.inkMuted,
  line: neutralColors.line,
  good: boutikPlusTheme.colors.primary,
  bad: neutralColors.danger,
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function chainReportHtml(report: ChainReport): string {
  const stepRows = report.steps
    .map((s) => {
      const ids = Object.entries(s.mintedIds)
        .map(([k, v]) => `<code>${esc(k)}=${esc(v)}</code>`)
        .join('<br>');
      const problems = s.problems.map((p) => `<div class="problem">${esc(p)}</div>`).join('');
      return `<tr>
        <td class="status ${s.ok ? 'ok' : 'ko'}">${s.ok ? '✓' : '✗'}</td>
        <td class="idx">${s.index}</td>
        <td>${esc(s.title)}${problems}</td>
        <td class="mono">${s.eventNames.map(esc).join('<br>') || '—'}</td>
        <td class="mono">${ids || '—'}</td>
      </tr>`;
    })
    .join('\n');

  const chainCells = NINE_CHAIN_IDS.map((name) => {
    const value = report.chainIds[name];
    return `<div class="link ${value ? 'ok' : 'ko'}"><div class="name">${esc(name)}</div><div class="val">${esc(value ?? 'MISSING')}</div></div>`;
  }).join('<div class="arrow">→</div>');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chaîne E1 — ${esc(report.correlationId)}</title>
<style>
  body { margin:0; padding:24px; background:${c.surface}; color:${c.ink}; font:15px/1.5 system-ui, sans-serif; }
  h1 { font-size:24px; margin:0 0 4px; }
  .verdict { display:inline-block; padding:6px 14px; border-radius:10px; color:#fff; font-weight:700;
             background:${report.ok ? c.good : c.bad}; margin:8px 0 16px; }
  .meta { color:${c.muted}; margin-bottom:20px; }
  .chain { display:flex; flex-wrap:wrap; align-items:center; gap:6px; background:${c.raised};
           border:1px solid ${c.line}; border-radius:16px; padding:16px; margin-bottom:24px; }
  .link { border-radius:10px; padding:8px 10px; border:1px solid ${c.line}; }
  .link.ok { border-color:${c.good}; }
  .link.ko { border-color:${c.bad}; background:#FBEDEA; }
  .link .name { font-size:11px; color:${c.muted}; }
  .link .val { font-family:ui-monospace,monospace; font-size:12px; }
  .arrow { color:${c.muted}; }
  table { width:100%; border-collapse:collapse; background:${c.raised}; border:1px solid ${c.line};
          border-radius:16px; overflow:hidden; }
  th, td { text-align:left; padding:10px 12px; border-top:1px solid ${c.line}; vertical-align:top; }
  th { background:${c.surface}; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:${c.muted}; border-top:none; }
  .status { font-weight:700; width:24px; }
  .status.ok { color:${c.good}; } .status.ko { color:${c.bad}; }
  .idx { color:${c.muted}; width:32px; }
  .mono { font-family:ui-monospace,monospace; font-size:12px; }
  .problem { color:${c.bad}; font-size:13px; margin-top:4px; }
</style>
</head>
<body>
  <h1>Chaîne E1 — les quinze étapes</h1>
  <div class="verdict">${report.ok ? 'CHAÎNE COMPLÈTE' : 'CHAÎNE ROMPUE'}</div>
  <div class="meta">corrélation <code>${esc(report.correlationId)}</code> · ${report.totalEvents} événements · ${report.steps.filter((s) => s.ok).length}/15 étapes vertes</div>
  <div class="chain">${chainCells}</div>
  <table>
    <thead><tr><th></th><th>#</th><th>Étape (Contrat §2.3)</th><th>Événements</th><th>Identifiants</th></tr></thead>
    <tbody>${stepRows}</tbody>
  </table>
</body>
</html>
`;
}
