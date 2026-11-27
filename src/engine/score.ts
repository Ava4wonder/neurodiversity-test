import { activeItems, formatOf, itemDimensions, itemWeight } from './load';
import type {
  Band,
  Content,
  DimensionScore,
  ItemTrace,
  Session,
  TaskTrace,
  GoNoGoMetrics,
} from './types';

export function scaleBounds(content: Content) {
  const values = content.testSet.response_scale.values;
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** forward: keyed = value; reverse: keyed = (max + min) - value */
export function keyValue(raw: number, keying: 'forward' | 'reverse', min: number, max: number): number {
  return keying === 'reverse' ? max + min - raw : raw;
}

export function bandFor(score: number, bands: Band[]): Band {
  const sorted = [...bands].sort((a, b) => a.min - b.min);
  let found = sorted[0];
  for (const b of sorted) if (score >= b.min) found = b;
  return found;
}

/** Linear map from [lo, hi] to [0, 100], clamped. */
export function mapTo100(value: number, [lo, hi]: [number, number]): number {
  if (hi === lo) return value >= hi ? 100 : 0;
  const t = (value - lo) / (hi - lo);
  return Math.max(0, Math.min(100, t * 100));
}

/** Standard normal CDF (Abramowitz-Stegun 7.1.26 approximation via erf). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

function round(v: number, decimals: number) {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/**
 * Step 1 + 2 of the scoring mechanism: items -> questionnaire score,
 * then optional blending with behavioural-task metrics.
 */
export function scoreDimensions(content: Content, session: Session): DimensionScore[] {
  const { scoring, testSet } = content;
  const { min, max } = scaleBounds(content);
  const cfg = scoring.dimension_scoring;
  const items = activeItems(content);

  return testSet.dimensions.map((dim) => {
    const dimItems = items.filter((i) => itemDimensions(i).includes(dim.id));
    const traces: ItemTrace[] = dimItems.map((item) => {
      const raw = session.responses[item.id];
      const has = typeof raw === 'number';
      const format = formatOf(item);
      let keyed: number | null = null;
      if (has && format === 'choice') {
        const v = item.options?.[raw]?.scores?.[dim.id];
        keyed = typeof v === 'number' ? v : null;
      } else if (has) {
        keyed = keyValue(raw, item.keyed ?? 'forward', min, max);
      }
      return {
        itemId: item.id,
        format,
        raw: has ? raw : null,
        keyed,
        keying: format === 'choice' ? 'option' : item.keyed ?? 'forward',
        weight: itemWeight(content, item),
        evidence: item.evidence?.level ?? 'exploratory',
      };
    });

    // only weighted items count; exploratory (weight 0) items are traced but not scored
    const scoredTraces = traces.filter((t) => t.weight > 0);
    const answered = scoredTraces.filter((t) => t.keyed !== null);
    const sufficient = scoredTraces.length > 0 && answered.length / scoredTraces.length >= cfg.min_answered_ratio;

    let questionnaireScore: number | null = null;
    if (sufficient) {
      const wSum = answered.reduce((s, t) => s + t.weight, 0);
      const mean = answered.reduce((s, t) => s + t.weight * (t.keyed as number), 0) / wSum;
      questionnaireScore = (100 * (mean - min)) / (max - min);
    }

    // ---- behavioural task blending
    const taskContributions: TaskTrace[] = [];
    if (scoring.task_integration.enabled && session.tasks) {
      for (const c of scoring.task_integration.contributions) {
        if (c.dimension !== dim.id) continue;
        const metrics = session.tasks[c.task] as GoNoGoMetrics | undefined;
        if (!metrics || metrics.valid_go_trials < scoring.task_integration.min_valid_go_trials) continue;
        const value = (metrics as unknown as Record<string, number>)[c.metric];
        if (typeof value !== 'number' || Number.isNaN(value)) continue;
        taskContributions.push({
          task: c.task,
          metric: c.metric,
          value,
          taskScore: mapTo100(value, c.from),
          weight: c.weight,
        });
      }
    }

    let score = questionnaireScore;
    if (score !== null && taskContributions.length) {
      const wTask = taskContributions.reduce((s, t) => s + t.weight, 0);
      score = (1 - wTask) * score + taskContributions.reduce((s, t) => s + t.weight * t.taskScore, 0);
    }

    const finalScore = score === null ? null : round(score, cfg.decimals);
    const norm = scoring.norms.dimensions?.[dim.id];
    const percentile =
      finalScore !== null && norm && norm.sd > 0
        ? Math.round(100 * normalCdf((finalScore - norm.mean) / norm.sd))
        : null;

    return {
      dimensionId: dim.id,
      questionnaireScore: questionnaireScore === null ? null : round(questionnaireScore, cfg.decimals),
      score: finalScore,
      band: finalScore === null ? null : bandFor(finalScore, scoring.bands),
      elevated: finalScore !== null && finalScore >= scoring.elevated_threshold,
      answered: answered.length,
      total: scoredTraces.length,
      sufficient,
      percentile,
      items: traces,
      taskContributions,
    };
  });
}
