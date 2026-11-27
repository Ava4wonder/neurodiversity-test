// The frontend reads the four content files at build time. Edit content/*.yaml,
// not this file.
import testSet from '../../content/test-set.yaml?raw';
import typeSet from '../../content/type-set.yaml?raw';
import scoring from '../../content/scoring.yaml?raw';
import references from '../../content/references.yaml?raw';
import { parseContent } from '../engine';
import type { Dimension, Item, Reference, TypeDef } from '../engine';

export const content = parseContent({ testSet, typeSet, scoring, references });

export const dimById = new Map<string, Dimension>(content.testSet.dimensions.map((d) => [d.id, d]));
export const typeById = new Map<string, TypeDef>(content.typeSet.types.map((t) => [t.id, t]));
export const itemById = new Map<string, Item>(content.testSet.items.map((i) => [i.id, i]));
export const refByKey = new Map<string, Reference>(content.references.references.map((r) => [r.key, r]));
export const checkIds = new Set(content.testSet.attention_checks.map((c) => c.id));
