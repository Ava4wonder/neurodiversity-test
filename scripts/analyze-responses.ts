/**
 * Item & scale analysis on pilot data.
 *
 *   npm run analyze -- research/responses
 *
 * Reads every *.json research export (downloaded from the results page with
 * "Download research export") in the given folder and writes
 * reports/item-analysis.md with:
 *   - per-dimension Cronbach's alpha and alpha-if-item-deleted
 *   - corrected item-total correlations (flag < .30)
 *   - item means / SDs / floor-ceiling effects
 *   - dimension inter-correlations
 *   - type distribution, and type x self-reported diagnosis (if provided)
 * Exports flagged "invalid" by the validity rules are excluded.
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { activeItems, formatOf, itemDimensions, itemWeight } from '../src/engine/load';
import { keyValue } from '../src/engine/score';
import { runScoring } from '../src/engine/index';
import type { Session } from '../src/engine/types';
import { loadContentFromDisk } from './lib/load-node';

interface ResearchExport {
  format: string;
  versions: { testSet: string; typeSet: string; scoring: string };
  responses: Record<string, number>;
  timings?: Record<string, number>;
  presentedOrder?: string[];
  tasks?: Session['tasks'];
  research?: { diagnoses?: string[]; ageBand?: string };
}

const dir = process.argv[2] ?? 'research/responses';
if (!existsSync(dir)) {
  console.error(`Folder not found: ${dir}`);
  process.exit(1);
}
const content = loadContentFromDisk();
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const exportsAll: ResearchExport[] = files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const versionMismatch = exportsAll.filter((e) => e.versions?.testSet !== content.testSet.meta.version).length;

const sessions = exportsAll
  .filter((e) => e.versions?.testSet === content.testSet.meta.version)
  .map((e) => ({ e, report: runScoring(content, { responses: e.responses, timings: e.timings, presentedOrder: e.presentedOrder, tasks: e.tasks }) }));
const valid = sessions.filter((s) => s.report.validity.status !== 'invalid');
const n = valid.length;

const values = content.testSet.response_scale.values;
const sMin = Math.min(...values);
const sMax = Math.max(...values);

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(xs.length - 1, 1);
};
const corr = (a: number[], b: number[]) => {
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : NaN;
};
/** Cronbach's alpha for a matrix rows=persons, cols=items (complete cases). */
function alpha(matrix: number[][]) {
  const k = matrix[0]?.length ?? 0;
  if (k < 2 || matrix.length < 3) return NaN;
  const itemVars = Array.from({ length: k }, (_, j) => variance(matrix.map((r) => r[j])));
  const totalVar = variance(matrix.map((r) => r.reduce((a, b) => a + b, 0)));
  return totalVar ? (k / (k - 1)) * (1 - itemVars.reduce((a, b) => a + b, 0) / totalVar) : NaN;
}
const f2 = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : 'n/a');

// keyed value of item for a dimension
function keyedFor(itemId: string, dim: string, responses: Record<string, number>) {
  const item = content.testSet.items.find((i) => i.id === itemId)!;
  const raw = responses[itemId];
  if (typeof raw !== 'number') return null;
  if (formatOf(item) === 'choice') return item.options?.[raw]?.scores?.[dim] ?? null;
  return keyValue(raw, item.keyed ?? 'forward', sMin, sMax);
}

const sections: string[] = [];
const items = activeItems(content);
for (const d of content.testSet.dimensions) {
  const dItems = items.filter((i) => itemDimensions(i).includes(d.id));
  const scoredIds = dItems.filter((i) => itemWeight(content, i) > 0).map((i) => i.id);
  const rows = valid
    .map((s) => scoredIds.map((id) => keyedFor(id, d.id, s.e.responses)))
    .filter((r): r is number[] => r.every((v) => v !== null));
  const a = alpha(rows);
  const lines = dItems.map((it) => {
    const col = valid.map((s) => keyedFor(it.id, d.id, s.e.responses)).filter((v): v is number => v !== null);
    const idx = scoredIds.indexOf(it.id);
    let rit = NaN;
    let aDel = NaN;
    if (idx >= 0 && rows.length > 2) {
      const rest = rows.map((r) => r.reduce((s, v, j) => (j === idx ? s : s + v), 0));
      rit = corr(rows.map((r) => r[idx]), rest);
      aDel = alpha(rows.map((r) => r.filter((_, j) => j !== idx)));
    }
    const floor = col.filter((v) => v === sMin).length / (col.length || 1);
    const ceil = col.filter((v) => v === sMax).length / (col.length || 1);
    const flags = [
      idx < 0 ? 'not scored' : '',
      Number.isFinite(rit) && rit < 0.3 ? '**r_it < .30**' : '',
      Number.isFinite(aDel) && aDel > a + 0.02 ? '**alpha rises if deleted**' : '',
      floor > 0.6 ? 'floor effect' : '',
      ceil > 0.6 ? 'ceiling effect' : '',
    ].filter(Boolean);
    return `| ${it.id} | ${it.evidence.level} | ${f2(mean(col))} | ${f2(Math.sqrt(variance(col)))} | ${f2(rit)} | ${f2(aDel)} | ${flags.join(', ')} |`;
  });
  sections.push(`### ${d.id}: ${d.name}\n\nCronbach's alpha = **${f2(a)}** (complete cases: ${rows.length}; target >= .70)\n\n| Item | Evidence | Mean (keyed) | SD | Corrected r_it | Alpha if deleted | Flags |\n|---|---|---:|---:|---:|---:|---|\n${lines.join('\n')}`);
}

// dimension inter-correlations
const dimIds = content.testSet.dimensions.map((d) => d.id);
const dimScores = (id: string) => valid.map((s) => s.report.dimensions.find((x) => x.dimensionId === id)?.score ?? NaN);
const corrRows = dimIds.map((a) => `| **${a}** | ${dimIds.map((b) => (a === b ? '1' : f2(corr(dimScores(a), dimScores(b))))).join(' | ')} |`);

// types
const typeCounts = new Map<string, number>();
valid.forEach((s) => typeCounts.set(s.report.classification.primaryTypeId, (typeCounts.get(s.report.classification.primaryTypeId) ?? 0) + 1));
const typeRows = content.typeSet.types.map((t) => `| ${t.id} | ${typeCounts.get(t.id) ?? 0} | ${n ? (((typeCounts.get(t.id) ?? 0) / n) * 100).toFixed(0) : 0}% |`);

const withDx = valid.filter((s) => s.e.research?.diagnoses?.length);
const dxSet = [...new Set(withDx.flatMap((s) => s.e.research!.diagnoses!))].sort();
const dxRows = dxSet.map((dx) => {
  const group = withDx.filter((s) => s.e.research!.diagnoses!.includes(dx));
  return `| ${dx} | ${group.length} | ${content.typeSet.types.map((t) => group.filter((s) => s.report.classification.primaryTypeId === t.id).length || '·').join(' | ')} |`;
});

const md = `# Item & scale analysis

Generated by \`npm run analyze\` on ${new Date().toISOString().slice(0, 10)} from \`${dir}\`.
Content: test set v${content.testSet.meta.version}, scoring v${content.scoring.meta.version}.

- Files read: ${files.length} (skipped for other test-set versions: ${versionMismatch})
- Excluded as invalid: ${sessions.length - n}
- **Analysed: ${n}**${n < 200 ? `\n\n> Warning: n = ${n}. Item statistics are unstable below about 200 respondents (guidelines section 9). Treat the numbers below as indicative only.` : ''}

## 1. Reliability and item statistics

${sections.join('\n\n')}

## 2. Dimension inter-correlations (Pearson)

High correlations (> .70) suggest two dimensions may not be distinct.

| | ${dimIds.join(' | ')} |
|---|${dimIds.map(() => '---:').join('|')}|
${corrRows.join('\n')}

## 3. Type distribution

| Type | n | % |
|---|---:|---:|
${typeRows.join('\n')}

## 4. Type x self-reported diagnosis

${withDx.length ? `Respondents who reported at least one diagnosis: ${withDx.length}.\n\n| Diagnosis | n | ${content.typeSet.types.map((t) => t.id).join(' | ')} |\n|---|---:|${content.typeSet.types.map(() => '---:').join('|')}|\n${dxRows.join('\n')}` : 'No diagnosis information in the exports.'}
`;
mkdirSync('reports', { recursive: true });
writeFileSync('reports/item-analysis.md', md);
console.log(md.split('\n').slice(0, 12).join('\n'));
console.log('\nFull report: reports/item-analysis.md');
