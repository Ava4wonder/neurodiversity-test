import { refByKey } from '../content';
import { refLink, shortCite } from '../lib/format';

/** Inline citation list: (Kessler et al., 2005; APA, 2022), each linked to its DOI. */
export function Cite({ refs, prefix = '' }: { refs?: string[]; prefix?: string }) {
  if (!refs?.length) return null;
  return (
    <span className="small muted">
      {prefix}(
      {refs.map((k, i) => {
        const r = refByKey.get(k);
        if (!r) return <span key={k}>{k}</span>;
        return (
          <span key={k}>
            {i > 0 && '; '}
            <a href={refLink(r)} target="_blank" rel="noreferrer" title={r.title}>
              {shortCite(r).replace('American Psychiatric Association', 'APA')}
            </a>
          </span>
        );
      })}
      )
    </span>
  );
}

export function EvidenceBadge({ level }: { level: string }) {
  return <span className={`badge-ev ${level}`}>{level}</span>;
}
