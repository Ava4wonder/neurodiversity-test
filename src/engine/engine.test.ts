import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  activeItems,
  buildQuestionOrder,
  buildTrials,
  classify,
  computeGoNoGoMetrics,
  formatOf,
  keyValue,
  mapTo100,
  parseContent,
  prototypeTargets,
  runScoring,
  scoreDimensions,
  validateContent,
  type Content,
  type DimensionScore,
  type Responses,
} from './index';
import { checkValidity } from './validity';

const read = (f: string) => readFileSync(`content/${f}`, 'utf8');
const content: Content = parseContent({
  testSet: read('test-set.yaml'),
  typeSet: read('type-set.yaml'),
  scoring: read('scoring.yaml'),
  references: read('references.yaml'),
});

/** Answer every item so that each dimension gets the requested keyed value (0..4). */
function answersFor(keyedByDim: Record<string, number>, fallback = 1): Responses {
  const r: Responses = {};
  for (const item of activeItems(content)) {
    if (formatOf(item) === 'choice') {
      r[item.id] = item.options!.length - 1; // "makes no difference"
      continue;
    }
    const k = item.dimension ? keyedByDim[item.dimension] ?? fallback : fallback;
    r[item.id] = item.keyed === 'reverse' ? 4 - k : k;
  }
  for (const c of content.testSet.attention_checks) r[c.id] = c.expected_value;
  return r;
}

const dimScores = (scores: Record<string, number>): DimensionScore[] =>
  content.testSet.dimensions.map((d) => ({
    dimensionId: d.id,
    questionnaireScore: scores[d.id] ?? 20,
    score: scores[d.id] ?? 20,
    band: null,
    elevated: (scores[d.id] ?? 20) >= content.scoring.elevated_threshold,
    answered: 6,
    total: 6,
    sufficient: true,
    percentile: null,
    items: [],
    taskContributions: [],
  }));

describe('content', () => {
  it('passes validation with no errors', () => {
    const res = validateContent(content);
    expect(res.errors).toEqual([]);
  });
});

describe('item keying', () => {
  it('reverses on a 0-4 scale', () => {
    expect(keyValue(4, 'reverse', 0, 4)).toBe(0);
    expect(keyValue(1, 'reverse', 0, 4)).toBe(3);
    expect(keyValue(3, 'forward', 0, 4)).toBe(3);
  });
  it('maps metrics linearly and clamps', () => {
    expect(mapTo100(0.25, [0.05, 0.45])).toBeCloseTo(50);
    expect(mapTo100(0.9, [0.05, 0.45])).toBe(100);
    expect(mapTo100(0, [0.05, 0.45])).toBe(0);
  });
});

describe('dimension scoring', () => {
  it('gives 100 when every item is answered at the trait end', () => {
    const dims = scoreDimensions(content, { responses: answersFor({ ATT: 4 }) });
    const att = dims.find((d) => d.dimensionId === 'ATT')!;
    // the sound choice item ("no difference") contributes ATT=0 at weight 0.5
    expect(att.score).toBeGreaterThan(90);
    expect(att.elevated).toBe(true);
  });

  it('does not score exploratory items (weight 0)', () => {
    const r = answersFor({ NUM: 0 });
    const base = scoreDimensions(content, { responses: r }).find((d) => d.dimensionId === 'NUM')!.score;
    r['NUM-03'] = 4; // exploratory item
    const after = scoreDimensions(content, { responses: r }).find((d) => d.dimensionId === 'NUM')!.score;
    expect(after).toBe(base);
  });

  it('lets a choice item feed two dimensions', () => {
    const r = answersFor({});
    r['PRF-02'] = 0; // complete silence -> SEN 4, ATT 1
    const dims = scoreDimensions(content, { responses: r });
    const senTrace = dims.find((d) => d.dimensionId === 'SEN')!.items.find((i) => i.itemId === 'PRF-02')!;
    const attTrace = dims.find((d) => d.dimensionId === 'ATT')!.items.find((i) => i.itemId === 'PRF-02')!;
    expect(senTrace.keyed).toBe(4);
    expect(attTrace.keyed).toBe(1);
    expect(senTrace.weight).toBe(0.5);
  });

  it('marks dimensions with too few answers as insufficient', () => {
    const r = answersFor({});
    ['MOT-01', 'MOT-02', 'MOT-03'].forEach((id) => delete r[id]);
    const mot = scoreDimensions(content, { responses: r }).find((d) => d.dimensionId === 'MOT')!;
    expect(mot.sufficient).toBe(false);
    expect(mot.score).toBeNull();
  });

  it('blends task metrics with the configured weights', () => {
    const r = answersFor({ IMP: 0 });
    const q = scoreDimensions(content, { responses: r }).find((d) => d.dimensionId === 'IMP')!.score!;
    const withTask = scoreDimensions(content, {
      responses: r,
      tasks: { GNG: { commission_rate: 0.45, omission_rate: 0, rt_mean_ms: 400, rt_cv: 0.1, valid_go_trials: 45, go_trials: 45, nogo_trials: 15 } },
    }).find((d) => d.dimensionId === 'IMP')!;
    expect(withTask.score).toBeCloseTo(0.8 * q + 0.2 * 100, 0);
    expect(withTask.taskContributions).toHaveLength(1);
  });
});

describe('classification', () => {
  it('recovers each prototype from its own target profile', () => {
    for (const t of content.typeSet.types.filter((x) => x.assignment === 'prototype')) {
      const targets = Object.fromEntries(prototypeTargets(content, t).map((p) => [p.dimensionId, p.target]));
      expect(classify(content, dimScores(targets)).primaryTypeId).toBe(t.id);
    }
  });

  it('falls back to MOSAIC when nothing fits and something is elevated', () => {
    const c = classify(content, dimScores({ SOC: 90, LIT: 90, MOT: 90, IMP: 90 }));
    expect(c.primaryTypeId).toBe('MOSAIC');
    expect(c.usedFallback).toBe(true);
  });

  it('probabilities sum to 1', () => {
    const c = classify(content, dimScores({ ATT: 70 }));
    expect(c.matches.reduce((s, m) => s + m.probability, 0)).toBeCloseTo(1);
  });
});

describe('validity', () => {
  it('flags straight-lining as invalid', () => {
    const r: Responses = {};
    activeItems(content).forEach((i) => (r[i.id] = 2));
    content.testSet.attention_checks.forEach((c) => (r[c.id] = 2));
    expect(checkValidity(content, { responses: r }).status).toBe('invalid');
  });
  it('passes a consistent, attentive respondent', () => {
    const r = answersFor({ ATT: 3, IMP: 3, EXF: 3 });
    expect(runScoring(content, { responses: r }).validity.status).toBe('ok');
  });
});

describe('presentation order', () => {
  const order = buildQuestionOrder(content);
  it('contains every active item and check exactly once', () => {
    const ids = order.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(activeItems(content).length + content.testSet.attention_checks.length);
  });
  it('keeps sections contiguous and interleaves dimensions', () => {
    const firstPref = order.findIndex((q) => q.section === 'preferences');
    expect(order.slice(firstPref).every((q) => q.section === 'preferences')).toBe(true);
    const traits = order.filter((q) => q.section === 'traits' && q.kind === 'item');
    const adjacentSame = traits.filter((q, i) => i > 0 && q.dimension === traits[i - 1].dimension).length;
    expect(adjacentSame).toBe(0);
  });
});

describe('go/no-go task', () => {
  const p = content.testSet.tasks[0].params;
  it('builds a deterministic sequence with the right no-go ratio', () => {
    const a = buildTrials(p);
    expect(a).toEqual(buildTrials(p));
    expect(a.filter((t) => t.kind === 'nogo').length).toBe(Math.round(p.trials * p.nogo_ratio));
    expect(a[0].kind).toBe('go');
  });
  it('computes commission, omission and RT variability', () => {
    const m = computeGoNoGoMetrics(
      [
        { kind: 'go', rtMs: 300 },
        { kind: 'go', rtMs: 500 },
        { kind: 'go', rtMs: null },
        { kind: 'nogo', rtMs: 250 },
        { kind: 'nogo', rtMs: null },
      ],
      p,
    );
    expect(m.commission_rate).toBe(0.5);
    expect(m.omission_rate).toBeCloseTo(1 / 3);
    expect(m.rt_mean_ms).toBe(400);
    expect(m.rt_cv).toBeCloseTo(0.25);
  });
});
