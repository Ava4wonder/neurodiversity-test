import type { Reference } from '../../engine';

/** APA-7-style reference string (plain text, without the DOI link). */
export function formatReference(r: Reference): string {
  const vol = r.volume ? `, ${r.volume}` : '';
  const iss = r.issue ? `(${r.issue})` : '';
  const pages = r.pages ? `, ${r.pages}` : '';
  if (r.type === 'article') return `${r.authors} (${r.year}). ${r.title}. ${r.container}${vol}${iss}${pages}.`;
  if (r.type === 'book') return `${r.authors} (${r.year}). ${r.title}. ${r.publisher ?? ''}.`;
  return `${r.authors} (${r.year}). ${r.title}.`;
}

/** APA in-text citation: "Dunn, 1997", "Aron & Aron, 1997", "Kessler et al., 2005". */
export function shortCite(r: Reference): string {
  const people = r.authors.replace(/,?\s*&\s*/, ', ').split(/\.,\s+/).filter(Boolean);
  const surname = (a: string) => a.split(',')[0].trim();
  if (r.type !== 'article' || people.length === 1) return `${surname(people[0])}, ${r.year}`;
  if (people.length === 2) return `${surname(people[0])} & ${surname(people[1])}, ${r.year}`;
  return `${surname(people[0])} et al., ${r.year}`;
}

export const refLink = (r: Reference) => (r.doi ? `https://doi.org/${r.doi}` : r.url ?? '');

/** Greedy word wrap for SVG text. */
export function wrap(text: string, maxChars: number, maxLines = 3): string[] {
  const words = text.split(/\s+/);
  // balance line lengths: aim for an even split instead of a short last line
  const n = Math.min(maxLines, Math.ceil(text.length / maxChars));
  if (n > 1) maxChars = Math.min(maxChars, Math.ceil(text.length / n) + 6);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[,.;:]?$/, '…');
    return kept;
  }
  return lines;
}
