import { load as parseYaml } from 'js-yaml';
import type { Content, Item, References, ScoringConfig, TestSet, TypeSet } from './types';

/**
 * Parse the three YAML content files into a typed Content bundle.
 * Structural validation lives in validate.ts so it can report every problem
 * at once instead of failing on the first.
 */
export function parseContent(sources: { testSet: string; typeSet: string; scoring: string; references: string }): Content {
  return {
    testSet: parseYaml(sources.testSet) as TestSet,
    typeSet: parseYaml(sources.typeSet) as TypeSet,
    scoring: parseYaml(sources.scoring) as ScoringConfig,
    references: parseYaml(sources.references) as References,
  };
}

/** Items that are presented (anything not retired). */
export function activeItems(content: Content) {
  return content.testSet.items.filter((i) => i.status !== 'retired');
}

export const formatOf = (item: Item) => item.format ?? 'likert';

/** Dimensions an item contributes to (choice items may feed several). */
export function itemDimensions(item: Item): string[] {
  if (formatOf(item) === 'choice') {
    const dims = new Set<string>();
    item.options?.forEach((o) => Object.keys(o.scores ?? {}).forEach((d) => dims.add(d)));
    return [...dims];
  }
  return item.dimension ? [item.dimension] : [];
}

/** Scoring weight: explicit `weight`, else the weight for the evidence level. */
export function itemWeight(content: Content, item: Item): number {
  if (typeof item.weight === 'number') return item.weight;
  return content.scoring.dimension_scoring.evidence_weights[item.evidence?.level ?? 'exploratory'] ?? 0;
}
