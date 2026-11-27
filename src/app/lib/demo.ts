import { activeItems, buildQuestionOrder, formatOf, prototypeTargets } from '../../engine';
import { gaussian, mulberry32 } from '../../engine/rng';
import { content, typeById } from '../content';
import { emptySession, type SessionState } from '../state';

/** Synthetic respondent generated from a type prototype (for demos and the Lab). */
export function demoSession(typeId: string, seed = 7): SessionState {
  const rand = mulberry32(seed);
  const type = typeById.get(typeId)!;
  const latent: Record<string, number> = {};
  if (type.prototype) prototypeTargets(content, type).forEach((t) => (latent[t.dimensionId] = Math.max(0, Math.min(100, t.target + gaussian(rand) * 6))));
  else content.testSet.dimensions.forEach((d, i) => (latent[d.id] = i % 3 === 0 ? 80 : 25));
  const responses: Record<string, number> = {};
  const timings: Record<string, number> = {};
  for (const item of activeItems(content)) {
    timings[item.id] = Math.round(2500 + rand() * 3500);
    if (formatOf(item) === 'choice') {
      let best = 0;
      let bestD = Infinity;
      item.options!.forEach((o, idx) => {
        const d = Object.entries(o.scores).reduce((s, [dim, v]) => s + (v - (latent[dim] ?? 30) / 25) ** 2, 0);
        if (d < bestD) [best, bestD] = [idx, d];
      });
      responses[item.id] = best;
      continue;
    }
    const l = item.dimension ? latent[item.dimension] : 30 + rand() * 50;
    const k = Math.max(0, Math.min(4, Math.round(l / 25 + gaussian(rand) * 0.5)));
    responses[item.id] = item.keyed === 'reverse' ? 4 - k : k;
  }
  content.testSet.attention_checks.forEach((c) => (responses[c.id] = c.expected_value));
  return {
    ...emptySession(content.testSet.meta.version),
    consent: true,
    responses,
    timings,
    presentedOrder: buildQuestionOrder(content).map((q) => q.id),
    taskSkipped: true,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
}
