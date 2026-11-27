import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseContent } from '../../src/engine/load';
import type { Content } from '../../src/engine/types';

export function loadContentFromDisk(root = '.'): Content {
  const read = (f: string) => readFileSync(join(root, 'content', f), 'utf8');
  return parseContent({
    testSet: read('test-set.yaml'),
    typeSet: read('type-set.yaml'),
    scoring: read('scoring.yaml'),
    references: read('references.yaml'),
  });
}

/** Reference keys cited in hand-written docs as [@key] or [@key1; @key2] (docs/generated is excluded). */
export function citedKeysInDocs(root = '.'): string[] {
  const dir = join(root, 'docs');
  if (!existsSync(dir)) return [];
  const keys = new Set<string>();
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const text = readFileSync(join(dir, f), 'utf8');
    for (const group of text.matchAll(/\[@[^\]]+\]/g)) for (const m of group[0].matchAll(/@([a-z0-9]+)/g)) keys.add(m[1]);
  }
  return [...keys];
}
