import { mulberry32, shuffle } from './rng';
import { activeItems } from './load';
import type { Content } from './types';

export interface Question {
  id: string;
  text: string;
  kind: 'item' | 'check';
  section: string;
  dimension?: string;
}

/**
 * Build the presentation order, section by section.
 * - `interleaved`: round-robin across dimensions (each dimension's items
 *   shuffled with the fixed seed), so neighbouring items rarely share a
 *   dimension (guideline 5.2). Items without a dimension go at the end.
 * - Attention checks go into sections with `attention_checks: true`, at
 *   evenly spaced positions (2 checks -> about 40% and 80%).
 */
export function buildQuestionOrder(content: Content): Question[] {
  const { sections, attention_checks, presentation } = content.testSet;
  const items = activeItems(content);
  const rand = mulberry32(presentation.shuffle_seed);
  const out: Question[] = [];
  const checkSection = sections.find((s) => s.attention_checks)?.id;

  for (const section of sections) {
    const secItems = items.filter((i) => i.section === section.id);
    const toQ = (i: (typeof secItems)[number]): Question => ({
      id: i.id,
      text: i.text,
      kind: 'item',
      section: section.id,
      dimension: i.dimension,
    });
    let ordered: Question[];
    if (section.order === 'as_listed') {
      ordered = secItems.map(toQ);
    } else {
      const dims = [...new Set(secItems.map((i) => i.dimension).filter((d): d is string => !!d))];
      const queues = shuffle(dims, rand).map((d) => shuffle(secItems.filter((i) => i.dimension === d), rand));
      ordered = [];
      for (let round = 0; queues.some((q) => q.length); round++) {
        // rotate the starting dimension each round to avoid a fixed rhythm
        const k = round % queues.length;
        for (const q of queues.slice(k).concat(queues.slice(0, k))) {
          const next = q.shift();
          if (next) ordered.push(toQ(next));
        }
      }
      ordered.push(...secItems.filter((i) => !i.dimension).map(toQ));
    }

    if (section.id === checkSection) {
      attention_checks.forEach((c, idx) => {
        const pos = Math.round(ordered.length * ((idx + 1) / (attention_checks.length + 0.5)));
        ordered.splice(Math.min(Math.max(pos, 1), ordered.length - 1), 0, {
          id: c.id,
          text: c.text,
          kind: 'check',
          section: section.id,
        });
      });
    }
    out.push(...ordered);
  }
  return out;
}

/** Pages never cross a section boundary. */
export function paginateBySection(questions: Question[], size: number): Question[][] {
  const pages: Question[][] = [];
  let current: Question[] = [];
  for (const q of questions) {
    if (current.length && (current.length >= size || current[0].section !== q.section)) {
      pages.push(current);
      current = [];
    }
    current.push(q);
  }
  if (current.length) pages.push(current);
  return pages;
}
