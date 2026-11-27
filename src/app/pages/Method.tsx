import { activeItems, formatOf, itemDimensions, itemWeight } from '../../engine';
import { content, dimById, refByKey } from '../content';
import { Cite, EvidenceBadge } from '../components/Citations';
import { Mascot } from '../components/Mascot';
import { formatReference, refLink } from '../lib/format';

export function Method() {
  const { testSet, typeSet, scoring, references } = content;
  const items = activeItems(content);
  const cls = scoring.classification;
  const counts = { established: 0, emerging: 0, exploratory: 0 } as Record<string, number>;
  items.forEach((i) => counts[i.evidence.level]++);
  const files = [
    { file: 'docs/01-question-bank-design-guidelines.md', role: 'Question Bank Design Guidelines', version: testSet.meta.guidelines_version, status: 'draft' },
    { file: 'content/test-set.yaml', role: 'Test Set (dimensions, items, tasks)', version: testSet.meta.version, status: testSet.meta.status },
    { file: 'content/type-set.yaml', role: 'Type Set (prototypes, texts)', version: typeSet.meta.version, status: typeSet.meta.status },
    { file: 'content/scoring.yaml', role: 'Scoring Mechanism (parameters)', version: scoring.meta.version, status: scoring.meta.status },
    { file: 'content/references.yaml', role: 'Evidence base (bibliography)', version: references.meta.version, status: `${references.references.length} refs` },
  ];

  return (
    <div>
      <h1>Method &amp; evidence</h1>
      <p className="muted" style={{ maxWidth: 760 }}>
        This page is generated from the same content files the test uses, so it always matches the version you took. Everything that decides your result is
        listed here: the dimensions, every question with its evidence, the type prototypes, the scoring parameters and the {references.references.length}{' '}
        references.
      </p>

      <div className="card">
        <h2>Traceable source files</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Document</th>
                <th>File in the repository</th>
                <th>Version</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.file}>
                  <td>{f.role}</td>
                  <td>
                    <code>{f.file}</code>
                  </td>
                  <td>{f.version}</td>
                  <td>{f.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 style={{ marginTop: 18 }}>Iteration loop</h3>
        <ol className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>Write or revise items following the design guidelines; cite evidence for each.</li>
          <li>
            <code>npm run validate</code> enforces the guideline rules (coverage, keying, evidence, citations, versions).
          </li>
          <li>
            <code>npm run verify-refs</code> checks every DOI against Crossref.
          </li>
          <li>
            <code>npm run simulate</code> checks that types are separable and validity rules catch careless responding.
          </li>
          <li>Expert review (content validity), cognitive interviews, then pilot data collection via research exports.</li>
          <li>
            <code>npm run analyze</code> computes reliability and item statistics, then revise, bump versions and log changes.
          </li>
        </ol>
      </div>

      <div className="card">
        <h2>Dimensions</h2>
        <div className="grid-3">
          {testSet.dimensions.map((d) => (
            <div key={d.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>{d.name}</b>
                <span className="chip">{d.id}</span>
              </div>
              <p className="small muted" style={{ margin: '6px 0' }}>
                {d.construct}
              </p>
              <div className="tiny">
                <b>High:</b> {d.high_pole}
                <br />
                <b>Low:</b> {d.low_pole}
              </div>
              <div className="tiny" style={{ marginTop: 6 }}>
                <Cite refs={d.refs} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Question bank</h2>
        <p className="small muted">
          {items.length} items: {counts.established} established, {counts.emerging} emerging, {counts.exploratory} exploratory. Evidence level sets the
          scoring weight ({Object.entries(scoring.dimension_scoring.evidence_weights)
            .map(([k, v]) => `${k} ${v}`)
            .join(', ')}
          ). All wording is original; sources support the construct, not the exact phrasing.
        </p>
        {[...testSet.dimensions.map((d) => ({ id: d.id, label: `${d.name} (${d.id})` })), { id: '_desc', label: 'Descriptive only (not scored)' }].map((g) => {
          const groupItems = items.filter((i) =>
            g.id === '_desc' ? itemDimensions(i).length === 0 : (i.dimension ?? itemDimensions(i)[0]) === g.id,
          );
          if (!groupItems.length) return null;
          return (
            <details className="disclose" key={g.id}>
              <summary>
                {g.label} · {groupItems.length} items
              </summary>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Statement</th>
                      <th>Format</th>
                      <th>Evidence</th>
                      <th>Basis &amp; sources</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupItems.map((i) => (
                      <tr key={i.id}>
                        <td>{i.id}</td>
                        <td>
                          {i.text}
                          <div className="tiny muted">
                            {i.facet}
                            {i.keyed === 'reverse' ? ' · reverse-keyed' : ''}
                            {itemDimensions(i).length > 1 ? ` · feeds ${itemDimensions(i).map((d) => dimById.get(d)?.id).join(', ')}` : ''}
                          </div>
                        </td>
                        <td>{formatOf(i)}</td>
                        <td>
                          <EvidenceBadge level={i.evidence.level} />
                          <div className="tiny muted">weight {itemWeight(content, i)}</div>
                        </td>
                        <td className="small">
                          {i.evidence.basis} <Cite refs={i.evidence.refs} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          );
        })}
      </div>

      <div className="card">
        <h2>Type set</h2>
        <p className="small muted">
          Levels: high = {cls.levels.high}, moderate = {cls.levels.moderate}, low = {cls.levels.low}. Dimensions not listed are expected at "{typeSet.meta.default_level}"
          with peripheral weight.
        </p>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th />
                <th>Type</th>
                <th>Core (weight {cls.core_weight})</th>
                <th>Expected (weight {cls.peripheral_weight})</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              {typeSet.types.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: 44 }}>
                    <div style={{ background: t.palette.background, borderRadius: 10, width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
                      <Mascot mascot={t.mascot} palette={t.palette} size={36} />
                    </div>
                  </td>
                  <td>
                    <b>{t.name}</b>
                    <div className="tiny muted">{t.associated_with}</div>
                  </td>
                  <td className="small">
                    {t.prototype
                      ? Object.entries(t.prototype.core)
                          .map(([d, l]) => `${d} ${l}`)
                          .join(', ')
                      : 'fallback, no prototype'}
                  </td>
                  <td className="small">
                    {t.prototype && Object.keys(t.prototype.expected ?? {}).length
                      ? Object.entries(t.prototype.expected)
                          .map(([d, l]) => `${d} ${l}`)
                          .join(', ')
                      : '–'}
                  </td>
                  <td>
                    <Cite refs={t.refs} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Scoring mechanism</h2>
        <div className="grid-2 small">
          <div>
            <h3>1. Items → dimension score</h3>
            <p>
              Reverse-keyed answers are flipped (keyed = 4 − answer). Choice items give a keyed value per dimension. The dimension score is 100 × the
              evidence-weighted mean of keyed answers ÷ 4. At least {scoring.dimension_scoring.min_answered_ratio * 100}% of scored items must be answered.
            </p>
            <h3>2. Reaction task (optional)</h3>
            <p>
              {scoring.task_integration.contributions.map((c) => `${c.metric} → ${c.dimension} (weight ${c.weight}, mapped ${c.from[0]}–${c.from[1]} → 0–100)`).join('; ')}.{' '}
              <Cite refs={scoring.task_integration.refs} />
            </p>
            <h3>3. Bands</h3>
            <p>
              {scoring.bands.map((b) => `${b.label} ≥ ${b.min}`).join(' · ')}. "Elevated" signature threshold: {scoring.elevated_threshold}. Norms:{' '}
              {scoring.norms.status.replace('_', ' ')}.
            </p>
          </div>
          <div>
            <h3>4. Type classification</h3>
            <p>
              Weighted RMS distance to every prototype, fit = 1 − distance/100, probability = softmax(−distance / {cls.temperature}). If the best fit is below{' '}
              {cls.min_fit} and a dimension is elevated, the result is {cls.fallback.type}. If the top two probabilities differ by less than {cls.blend_margin}, the
              result is reported as a blend. <Cite refs={cls.refs} />
            </p>
            <h3>5. Validity</h3>
            <p>
              Attention checks (caution at {scoring.validity.attention_checks.caution_if_failed} failed), {scoring.validity.consistency_pairs.pairs.length}{' '}
              opposite-keyed consistency pairs, straight-lining (run ≥ {scoring.validity.straightlining.max_identical_run} or SD &lt;{' '}
              {scoring.validity.straightlining.min_response_sd}), and speed (median &lt; {scoring.validity.speed.caution_median_seconds_per_item} s per item).{' '}
              <Cite refs={scoring.validity.refs} />
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>References</h2>
        <p className="small muted">
          {references.references.filter((r) => r.doi).length} of {references.references.length} references have a DOI, each checked against Crossref with{' '}
          <code>npm run verify-refs</code>.
        </p>
        <ol className="small" style={{ paddingLeft: '1.4em' }}>
          {references.references.map((r) => (
            <li key={r.key} id={`ref-${r.key}`} style={{ marginBottom: 8 }}>
              {formatReference(r)}{' '}
              {refLink(r) && (
                <a href={refLink(r)} target="_blank" rel="noreferrer">
                  {r.doi ? `doi:${r.doi}` : r.url}
                </a>
              )}
              <div className="tiny muted">
                [{r.key}] {r.supports}
              </div>
            </li>
          ))}
        </ol>
        {refByKey.size === 0 && <p>No references loaded.</p>}
      </div>
    </div>
  );
}
