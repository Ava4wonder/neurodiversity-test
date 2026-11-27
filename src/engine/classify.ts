import type { Classification, Content, DimensionScore, Level, TypeDef, TypeMatch } from './types';

/** Resolve a prototype type into a target value + weight for every dimension. */
export function prototypeTargets(content: Content, type: TypeDef) {
  const { levels, core_weight, peripheral_weight } = content.scoring.classification;
  const defaultLevel: Level = content.typeSet.meta.default_level;
  return content.testSet.dimensions.map((d) => {
    const core = type.prototype?.core?.[d.id];
    const expected = type.prototype?.expected?.[d.id];
    if (core) return { dimensionId: d.id, target: levels[core], weight: core_weight };
    if (expected) return { dimensionId: d.id, target: levels[expected], weight: peripheral_weight };
    return { dimensionId: d.id, target: levels[defaultLevel], weight: peripheral_weight };
  });
}

/**
 * Step 5 of the scoring mechanism: weighted prototype distance + softmax.
 * Dimensions with insufficient data are left out of every distance.
 */
export function classify(content: Content, dims: DimensionScore[]): Classification {
  const cfg = content.scoring.classification;
  const scoreOf = new Map(dims.map((d) => [d.dimensionId, d.score]));
  const prototypes = content.typeSet.types.filter((t) => t.assignment === 'prototype');

  const raw = prototypes.map((type) => {
    const perDimension = prototypeTargets(content, type)
      .filter((t) => typeof scoreOf.get(t.dimensionId) === 'number')
      .map((t) => ({ ...t, score: scoreOf.get(t.dimensionId) as number }));
    const wSum = perDimension.reduce((s, p) => s + p.weight, 0);
    const sq = perDimension.reduce((s, p) => s + p.weight * (p.score - p.target) ** 2, 0);
    const distance = wSum > 0 ? Math.sqrt(sq / wSum) : 100;
    return { typeId: type.id, distance, fit: 1 - distance / 100, perDimension };
  });

  // softmax(-D / T), stabilised by subtracting the max logit
  const logits = raw.map((r) => -r.distance / cfg.temperature);
  const maxLogit = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - maxLogit));
  const z = exps.reduce((a, b) => a + b, 0);
  const matches: TypeMatch[] = raw
    .map((r, i) => ({ ...r, probability: exps[i] / z }))
    .sort((a, b) => b.probability - a.probability);

  const signature = dims
    .filter((d) => d.elevated)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .map((d) => d.dimensionId);

  const best = matches[0];
  const second = matches[1] ?? null;
  let primaryTypeId = best.typeId;
  let usedFallback = false;
  if (best.fit < cfg.min_fit && (!cfg.fallback.requires_elevated || signature.length > 0)) {
    primaryTypeId = cfg.fallback.type;
    usedFallback = true;
  }

  const isBlend = !usedFallback && !!second && best.probability - second.probability < cfg.blend_margin;
  const confidence = usedFallback
    ? { id: 'low', label: 'No single close match' }
    : [...cfg.confidence]
        .sort((a, b) => b.min_probability - a.min_probability)
        .find((c) => best.probability >= c.min_probability) ?? cfg.confidence[cfg.confidence.length - 1];

  return {
    primaryTypeId,
    secondaryTypeId: usedFallback ? best.typeId : second?.typeId ?? null,
    isBlend,
    usedFallback,
    confidence: { id: confidence.id, label: confidence.label },
    matches,
    signature,
  };
}
