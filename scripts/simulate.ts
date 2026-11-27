/**
 * Monte-Carlo check of the scoring mechanism.
 *
 *   npm run simulate -- --n 400 --person-sd 10 --item-sd 0.8 --seed 1
 *
 * 1. Recovery: for every prototype type, generate synthetic respondents whose
 *    latent dimension levels equal the prototype targets plus person-level
 *    noise, and whose item answers add item-level noise. Score and classify
 *    them, then report how often the generating type is recovered (confusion
 *    matrix).
 * 2. Validity: generate careless respondents (random clickers, straight-liners,
 *    speeders) and report how often each validity rule flags them.
 *
 * This tests whether the type set and scoring are internally separable. It
 * says nothing about real-world validity, which needs pilot data
 * (see docs/01 section 9).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { activeItems, formatOf, itemDimensions } from '../src/engine/load';
import { prototypeTargets } from '../src/engine/classify';
import { runScoring } from '../src/engine/index';
import { gaussian, mulberry32 } from '../src/engine/rng';
import type { Content, Responses, Session } from '../src/engine/types';
import { loadContentFromDisk } from './lib/load-node';

const args = process.argv.slice(2);
const arg = (name: string, def: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const N = arg('n', 400);
const PERSON_SD = arg('person-sd', 10);
const ITEM_SD = arg('item-sd', 0.8);
const SEED = arg('seed', 1);

const content = loadContentFromDisk();
const rand = mulberry32(SEED);
const values = content.testSet.response_scale.values;
const sMin = Math.min(...values);
const sMax = Math.max(...values);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function answerAll(c: Content, latent: Record<string, number>, rnd: () => number): Responses {
  const responses: Responses = {};
  for (const item of activeItems(c)) {
    const dims = itemDimensions(item);
    if (formatOf(item) === 'choice') {
      // pick the option closest to the latent profile, with noise
      let best = 0;
      let bestD = Infinity;
      item.options!.forEach((o, idx) => {
        const d = dims.reduce((s, dim) => {
          const target = sMin + ((latent[dim] ?? 30) / 100) * (sMax - sMin);
          return s + (o.scores[dim] - target) ** 2;
        }, 0) + Math.abs(gaussian(rnd)) * ITEM_SD;
        if (d < bestD) {
          bestD = d;
          best = idx;
        }
      });
      responses[item.id] = best;
      continue;
    }
    const l = item.dimension ? latent[item.dimension] : 30 + gaussian(rnd) * 20;
    const keyed = clamp(Math.round(sMin + (l / 100) * (sMax - sMin) + gaussian(rnd) * ITEM_SD), sMin, sMax);
    responses[item.id] = item.keyed === 'reverse' ? sMax + sMin - keyed : keyed;
  }
  for (const chk of c.testSet.attention_checks) responses[chk.id] = chk.expected_value;
  return responses;
}

// ------------------------------------------------------------------ 1. recovery
const prototypes = content.typeSet.types.filter((t) => t.assignment === 'prototype');
const allTypeIds = content.typeSet.types.map((t) => t.id);
const confusion: Record<string, Record<string, number>> = {};
const blends: Record<string, number> = {};
const fitSum: Record<string, number> = {};

for (const t of prototypes) {
  confusion[t.id] = Object.fromEntries(allTypeIds.map((id) => [id, 0]));
  blends[t.id] = 0;
  fitSum[t.id] = 0;
  const targets = prototypeTargets(content, t);
  for (let n = 0; n < N; n++) {
    const latent: Record<string, number> = {};
    targets.forEach((x) => (latent[x.dimensionId] = clamp(x.target + gaussian(rand) * PERSON_SD, 0, 100)));
    const session: Session = { responses: answerAll(content, latent, rand) };
    const report = runScoring(content, session);
    confusion[t.id][report.classification.primaryTypeId]++;
    if (report.classification.isBlend) blends[t.id]++;
    fitSum[t.id] += report.classification.matches[0].fit;
  }
}

const recovered = prototypes.map((t) => confusion[t.id][t.id] / N);
const overall = recovered.reduce((a, b) => a + b, 0) / recovered.length;

// ------------------------------------------------------------------ 2. validity
type Careless = 'random' | 'straight' | 'speeder' | 'attentive';
const validityRows: string[] = [];
for (const kind of ['attentive', 'random', 'straight', 'speeder'] as Careless[]) {
  const counts = { ok: 0, caution: 0, invalid: 0 };
  for (let n = 0; n < N; n++) {
    let responses: Responses = {};
    const timings: Record<string, number> = {};
    const items = activeItems(content);
    if (kind === 'attentive') {
      const t = prototypes[Math.floor(rand() * prototypes.length)];
      const latent: Record<string, number> = {};
      prototypeTargets(content, t).forEach((x) => (latent[x.dimensionId] = clamp(x.target + gaussian(rand) * PERSON_SD, 0, 100)));
      responses = answerAll(content, latent, rand);
      items.forEach((i) => (timings[i.id] = 2500 + rand() * 4000));
    } else if (kind === 'random') {
      items.forEach((i) => {
        const nOpts = formatOf(i) === 'choice' ? i.options!.length : values.length;
        responses[i.id] = formatOf(i) === 'choice' ? Math.floor(rand() * nOpts) : values[Math.floor(rand() * nOpts)];
        timings[i.id] = 1500 + rand() * 2000;
      });
      content.testSet.attention_checks.forEach((c) => (responses[c.id] = values[Math.floor(rand() * values.length)]));
    } else if (kind === 'straight') {
      const v = values[Math.floor(rand() * values.length)];
      items.forEach((i) => {
        responses[i.id] = formatOf(i) === 'choice' ? 0 : v;
        timings[i.id] = 1200 + rand() * 800;
      });
      content.testSet.attention_checks.forEach((c) => (responses[c.id] = v));
    } else {
      items.forEach((i) => {
        responses[i.id] = formatOf(i) === 'choice' ? Math.floor(rand() * i.options!.length) : values[Math.floor(rand() * values.length)];
        timings[i.id] = 300 + rand() * 500;
      });
      content.testSet.attention_checks.forEach((c) => (responses[c.id] = values[Math.floor(rand() * values.length)]));
    }
    const report = runScoring(content, { responses, timings });
    counts[report.validity.status]++;
  }
  validityRows.push(
    `| ${kind} | ${((counts.ok / N) * 100).toFixed(0)}% | ${((counts.caution / N) * 100).toFixed(0)}% | ${((counts.invalid / N) * 100).toFixed(0)}% |`,
  );
}

// ------------------------------------------------------------------ report
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
const header = `| generated \\ classified | ${allTypeIds.join(' | ')} |\n|---|${allTypeIds.map(() => '---:').join('|')}|`;
const matrix = prototypes
  .map((t) => `| **${t.id}** | ${allTypeIds.map((id) => (confusion[t.id][id] ? pct(confusion[t.id][id] / N) : '·')).join(' | ')} |`)
  .join('\n');
const perType = prototypes
  .map((t, i) => `| ${t.id} | ${pct(recovered[i])} | ${pct(blends[t.id] / N)} | ${(fitSum[t.id] / N).toFixed(2)} |`)
  .join('\n');

const md = `# Scoring simulation report

Generated by \`npm run simulate\` on ${new Date().toISOString().slice(0, 10)}.
Content: test set v${content.testSet.meta.version}, type set v${content.typeSet.meta.version}, scoring v${content.scoring.meta.version}.
Parameters: n = ${N} per type, person SD = ${PERSON_SD} points, item SD = ${ITEM_SD} scale points, seed = ${SEED}.

> This checks **internal separability**: can the scoring recover the type that
> generated the answers? It does **not** show that the types exist in real
> people or that they match clinical diagnoses. That needs pilot data.

## 1. Type recovery

Overall recovery: **${pct(overall)}**

| Type | Recovered | Reported as blend | Mean best fit |
|---|---:|---:|---:|
${perType}

### Confusion matrix (row = generating prototype)

${header}
${matrix}

## 2. Validity rules vs. simulated response styles

| Response style | ok | caution | invalid |
|---|---:|---:|---:|
${validityRows.join('\n')}

- *attentive*: answers generated from a prototype, 2.5 to 6.5 s per item
- *random*: uniform random answers
- *straight*: same answer to everything
- *speeder*: random answers at 0.3 to 0.8 s per item
`;
mkdirSync('reports', { recursive: true });
writeFileSync('reports/simulation-report.md', md);
console.log(md);
