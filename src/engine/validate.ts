import { activeItems, formatOf, itemDimensions, itemWeight } from './load';
import type { Content } from './types';

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  stats: Record<string, number | string>;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const LEVELS = ['high', 'moderate', 'low'];
const EVIDENCE = ['established', 'emerging', 'exploratory'];

/** Rule thresholds; the matching guideline sections are in docs/01-question-bank-design-guidelines.md. */
export const RULES = {
  minScoredItemsPerDimension: 4, // G-4.1
  reverseShare: [0.25, 0.5] as [number, number], // G-4.4
  maxItemChars: 120, // G-4.2
  negations: /\b(not|never|no)\b|n't\b/i, // G-4.4 (reverse items must not use negation)
};

/**
 * Validate the content bundle against the Question Bank Design Guidelines.
 * `extraCitedKeys`: reference keys cited in docs (e.g. "[@clark1995]"), so
 * references used only by the documentation don't count as unused.
 * `knownMascots`: mascots the frontend can draw.
 */
export function validateContent(
  content: Content,
  opts: { extraCitedKeys?: string[]; knownMascots?: string[] } = {},
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { testSet, typeSet, scoring, references } = content;
  const err = (rule: string, msg: string) => errors.push(`[${rule}] ${msg}`);
  const warn = (rule: string, msg: string) => warnings.push(`[${rule}] ${msg}`);

  // ------------------------------------------------------------ references
  const refKeys = new Set<string>();
  for (const r of references?.references ?? []) {
    if (refKeys.has(r.key)) err('G-7.1', `Duplicate reference key ${r.key}`);
    refKeys.add(r.key);
    if (!r.doi && !r.url && r.type === 'article') warn('G-7.2', `Article ${r.key} has no DOI or URL`);
    if (!r.supports) err('G-7.2', `Reference ${r.key} must say what it supports`);
  }
  const cited = new Set<string>(opts.extraCitedKeys ?? []);
  const cite = (where: string, keys: string[] | undefined) => {
    for (const k of keys ?? []) {
      cited.add(k);
      if (!refKeys.has(k)) err('G-7.1', `${where} cites unknown reference "${k}"`);
    }
  };

  // ------------------------------------------------------------ versions
  if (typeSet.meta.test_set_version !== testSet.meta.version)
    err('G-8.2', `type-set targets test set ${typeSet.meta.test_set_version}, but test set is ${testSet.meta.version}`);
  if (scoring.meta.test_set_version !== testSet.meta.version)
    err('G-8.2', `scoring targets test set ${scoring.meta.test_set_version}, but test set is ${testSet.meta.version}`);
  if (scoring.meta.type_set_version !== typeSet.meta.version)
    err('G-8.2', `scoring targets type set ${scoring.meta.type_set_version}, but type set is ${typeSet.meta.version}`);

  // ------------------------------------------------------------ dimensions & sections
  const dimIds = new Set(testSet.dimensions.map((d) => d.id));
  const sectionIds = new Set(testSet.sections.map((s) => s.id));
  for (const d of testSet.dimensions) {
    if (!d.construct) err('G-3.1', `Dimension ${d.id} needs a construct definition`);
    if (!d.refs?.length) err('G-3.2', `Dimension ${d.id} must cite at least one reference`);
    cite(`Dimension ${d.id}`, d.refs);
  }

  // ------------------------------------------------------------ items
  const { min, max } = { min: Math.min(...testSet.response_scale.values), max: Math.max(...testSet.response_scale.values) };
  const ids = new Set<string>();
  for (const item of testSet.items) {
    const f = formatOf(item);
    if (ids.has(item.id)) err('G-8.1', `Duplicate item id ${item.id}`);
    ids.add(item.id);
    if (!sectionIds.has(item.section)) err('G-5.1', `${item.id}: unknown section "${item.section}"`);
    if (!item.text?.trim()) err('G-4.2', `${item.id}: empty text`);
    if (item.text && item.text.length > RULES.maxItemChars)
      warn('G-4.2', `${item.id}: ${item.text.length} characters (max ${RULES.maxItemChars}); consider shortening`);
    if (!item.rationale) err('G-4.7', `${item.id}: missing rationale`);
    if (!item.facet) warn('G-3.3', `${item.id}: missing facet`);

    // format-specific structure
    if (f === 'choice') {
      if (!item.options || item.options.length < 2) err('G-4.3', `${item.id}: choice item needs >= 2 options`);
      const dims = itemDimensions(item);
      item.options?.forEach((o, idx) => {
        for (const d of dims) {
          const v = o.scores?.[d];
          if (typeof v !== 'number') err('G-4.3', `${item.id} option ${idx + 1}: missing score for ${d}`);
          else if (v < min || v > max) err('G-4.3', `${item.id} option ${idx + 1}: score ${v} outside scale ${min}-${max}`);
        }
      });
      dims.forEach((d) => !dimIds.has(d) && err('G-3.1', `${item.id}: unknown dimension ${d}`));
    } else {
      if (item.dimension && !dimIds.has(item.dimension)) err('G-3.1', `${item.id}: unknown dimension ${item.dimension}`);
      if (item.dimension && !item.keyed) err('G-4.4', `${item.id}: scored item needs keyed: forward|reverse`);
      if (f === 'bipolar' && (!item.poles || item.poles.length !== 2)) err('G-4.3', `${item.id}: bipolar item needs 2 poles`);
      if (f === 'likert' && item.keyed === 'reverse' && RULES.negations.test(item.text))
        warn('G-4.4', `${item.id}: reverse-keyed item uses a negation; rephrase positively`);
    }

    // evidence (G-7)
    const ev = item.evidence;
    if (!ev || !EVIDENCE.includes(ev.level)) {
      err('G-7.3', `${item.id}: evidence.level must be one of ${EVIDENCE.join(', ')}`);
    } else {
      if (ev.level !== 'exploratory' && !ev.refs?.length)
        err('G-7.3', `${item.id}: ${ev.level} evidence needs at least one reference`);
      if (!ev.basis) err('G-7.3', `${item.id}: evidence.basis is required`);
      if (ev.level === 'exploratory' && itemWeight(content, item) > 0)
        err('G-7.4', `${item.id}: exploratory items must not be scored (weight 0)`);
    }
    cite(`Item ${item.id}`, ev?.refs);
    if (testSet.meta.status === 'validated' && item.status === 'draft')
      err('G-8.3', `${item.id}: draft item in a validated test set`);
  }

  // per-dimension coverage
  const active = activeItems(content);
  for (const d of testSet.dimensions) {
    const scoredItems = active.filter((i) => itemDimensions(i).includes(d.id) && itemWeight(content, i) > 0);
    if (scoredItems.length < RULES.minScoredItemsPerDimension)
      err('G-4.1', `Dimension ${d.id} has ${scoredItems.length} scored items (min ${RULES.minScoredItemsPerDimension})`);
    const keyedItems = scoredItems.filter((i) => formatOf(i) !== 'choice');
    const rev = keyedItems.filter((i) => i.keyed === 'reverse').length / (keyedItems.length || 1);
    if (rev < RULES.reverseShare[0] || rev > RULES.reverseShare[1])
      warn('G-4.4', `Dimension ${d.id}: ${(rev * 100).toFixed(0)}% reverse-keyed (target ${RULES.reverseShare[0] * 100}-${RULES.reverseShare[1] * 100}%)`);
  }

  // attention checks
  for (const c of testSet.attention_checks) {
    if (ids.has(c.id)) err('G-8.1', `Duplicate id ${c.id}`);
    ids.add(c.id);
    if (!testSet.response_scale.values.includes(c.expected_value))
      err('G-6.1', `${c.id}: expected value ${c.expected_value} is not on the response scale`);
  }
  if (testSet.attention_checks.length < 1) warn('G-6.1', 'No attention checks defined');

  // tasks
  for (const t of testSet.tasks) cite(`Task ${t.id}`, t.refs);

  // ------------------------------------------------------------ types
  const typeIds = new Set<string>();
  for (const t of typeSet.types) {
    if (typeIds.has(t.id)) err('G-8.1', `Duplicate type id ${t.id}`);
    typeIds.add(t.id);
    for (const [k, v] of Object.entries(t.palette ?? {}))
      if (!HEX.test(v)) err('T-1', `${t.id}: palette.${k} "${v}" is not a #RRGGBB colour`);
    if (opts.knownMascots && !opts.knownMascots.includes(t.mascot))
      err('T-2', `${t.id}: mascot "${t.mascot}" has no illustration`);
    if (!t.refs?.length) err('G-7.5', `Type ${t.id} must cite at least one reference`);
    cite(`Type ${t.id}`, t.refs);
    if (t.assignment === 'prototype') {
      if (!t.prototype || !Object.keys(t.prototype.core ?? {}).length) err('T-3', `${t.id}: prototype needs >= 1 core dimension`);
      for (const [d, lvl] of [...Object.entries(t.prototype?.core ?? {}), ...Object.entries(t.prototype?.expected ?? {})]) {
        if (!dimIds.has(d)) err('T-3', `${t.id}: unknown dimension ${d}`);
        if (!LEVELS.includes(lvl)) err('T-3', `${t.id}: unknown level "${lvl}" for ${d}`);
      }
    }
  }
  // duplicate prototypes are indistinguishable
  const sigs = new Map<string, string>();
  for (const t of typeSet.types.filter((x) => x.assignment === 'prototype')) {
    const sig = JSON.stringify([t.prototype?.core, t.prototype?.expected]);
    if (sigs.has(sig)) err('T-4', `${t.id} has the same prototype as ${sigs.get(sig)}`);
    sigs.set(sig, t.id);
  }

  // ------------------------------------------------------------ scoring
  const fb = scoring.classification.fallback.type;
  const fbType = typeSet.types.find((t) => t.id === fb);
  if (!fbType) err('S-1', `Fallback type ${fb} is not in the type set`);
  else if (fbType.assignment !== 'fallback') err('S-1', `Fallback type ${fb} must have assignment: fallback`);
  const taskIds = new Set(testSet.tasks.map((t) => t.id));
  const taskWeight = new Map<string, number>();
  for (const c of scoring.task_integration.contributions) {
    if (!taskIds.has(c.task)) err('S-2', `Task contribution references unknown task ${c.task}`);
    if (!dimIds.has(c.dimension)) err('S-2', `Task contribution references unknown dimension ${c.dimension}`);
    const task = testSet.tasks.find((t) => t.id === c.task);
    if (task && !task.metrics.some((m) => m.id === c.metric)) err('S-2', `Task ${c.task} has no metric ${c.metric}`);
    taskWeight.set(c.dimension, (taskWeight.get(c.dimension) ?? 0) + c.weight);
  }
  for (const [d, w] of taskWeight) if (w >= 0.5) err('S-2', `Task weights for ${d} sum to ${w}; must be < 0.5`);
  const bands = scoring.bands;
  if (bands[0]?.min !== 0) err('S-3', 'First band must start at 0');
  bands.forEach((b, i) => i > 0 && b.min <= bands[i - 1].min && err('S-3', `Bands must be ascending (${b.id})`));
  for (const [a, b] of scoring.validity.consistency_pairs.pairs) {
    const ia = testSet.items.find((i) => i.id === a);
    const ib = testSet.items.find((i) => i.id === b);
    if (!ia || !ib) err('S-4', `Consistency pair ${a}/${b} references unknown item`);
    else {
      if (ia.dimension !== ib.dimension) err('S-4', `Consistency pair ${a}/${b} spans two dimensions`);
      if (ia.keyed === ib.keyed) warn('S-4', `Consistency pair ${a}/${b} should be opposite-keyed`);
    }
  }
  cite('scoring.task_integration', scoring.task_integration.refs);
  cite('scoring.classification', scoring.classification.refs);
  cite('scoring.validity', scoring.validity.refs);

  for (const k of refKeys) if (!cited.has(k)) warn('G-7.1', `Reference ${k} is never cited`);

  const scored = active.filter((i) => itemWeight(content, i) > 0 && itemDimensions(i).length > 0);
  return {
    errors,
    warnings,
    stats: {
      dimensions: testSet.dimensions.length,
      items: active.length,
      scoredItems: scored.length,
      descriptiveOnly: active.length - scored.length,
      established: active.filter((i) => i.evidence?.level === 'established').length,
      emerging: active.filter((i) => i.evidence?.level === 'emerging').length,
      exploratory: active.filter((i) => i.evidence?.level === 'exploratory').length,
      attentionChecks: testSet.attention_checks.length,
      types: typeSet.types.length,
      references: refKeys.size,
    },
  };
}
