import { useMemo, useState } from 'react';
import { classify, prototypeTargets, bandFor, type DimensionScore } from '../../engine';
import { content, typeById } from '../content';
import { TypeCard } from '../components/TypeCard';
import { TypeMatchBars } from '../components/TypeMatchBars';
import { demoSession } from '../lib/demo';
import type { SessionState } from '../state';

/** Scoring playground: move dimension scores and watch the classification respond. */
export function Lab({ onDemo }: { onDemo: (s: SessionState) => void }) {
  const dims = content.testSet.dimensions;
  const [scores, setScores] = useState<Record<string, number>>(() => Object.fromEntries(dims.map((d) => [d.id, 25])));
  const [demoType, setDemoType] = useState(content.typeSet.types[0].id);

  const dimScores: DimensionScore[] = useMemo(
    () =>
      dims.map((d) => ({
        dimensionId: d.id,
        questionnaireScore: scores[d.id],
        score: scores[d.id],
        band: bandFor(scores[d.id], content.scoring.bands),
        elevated: scores[d.id] >= content.scoring.elevated_threshold,
        answered: 1,
        total: 1,
        sufficient: true,
        percentile: null,
        items: [],
        taskContributions: [],
      })),
    [scores, dims],
  );
  const cls = useMemo(() => classify(content, dimScores), [dimScores]);
  const type = typeById.get(cls.primaryTypeId)!;

  const loadPrototype = (id: string) => {
    const t = typeById.get(id)!;
    if (!t.prototype) return;
    setScores(Object.fromEntries(prototypeTargets(content, t).map((p) => [p.dimensionId, p.target])));
  };

  return (
    <div>
      <h1>Scoring lab</h1>
      <p className="muted" style={{ maxWidth: 760 }}>
        A sandbox for researchers iterating on <code>content/type-set.yaml</code> and <code>content/scoring.yaml</code>. Move the dimension scores and see
        how the classifier responds, or generate a synthetic respondent to preview the full report.
      </p>
      <div className="result-hero">
        <div className="typecard-wrap">
          <TypeCard
            type={type}
            dims={dimScores.map((d) => ({ id: d.dimensionId, score: d.score, elevated: d.elevated }))}
            signature={cls.signature}
            blendWith={cls.isBlend && cls.secondaryTypeId ? typeById.get(cls.secondaryTypeId) : null}
            confidence={cls.confidence.label}
            version={content.testSet.meta.version}
            date="preview"
          />
        </div>
        <div>
          <div className="card">
            <h2>Dimension scores</h2>
            {dims.map((d) => (
              <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 40px', gap: 10, alignItems: 'center' }}>
                <label htmlFor={`s-${d.id}`} className="small">
                  <b>{d.id}</b> {d.name}
                </label>
                <input
                  id={`s-${d.id}`}
                  type="range"
                  min={0}
                  max={100}
                  value={scores[d.id]}
                  onChange={(e) => setScores((s) => ({ ...s, [d.id]: Number(e.target.value) }))}
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="small" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {scores[d.id]}
                </span>
              </div>
            ))}
            <div className="row" style={{ marginTop: 12, gap: 6 }}>
              <span className="small muted">Load prototype:</span>
              {content.typeSet.types
                .filter((t) => t.prototype)
                .map((t) => (
                  <button key={t.id} className="btn small secondary" onClick={() => loadPrototype(t.id)}>
                    {t.name.replace('The ', '')}
                  </button>
                ))}
            </div>
          </div>
          <div className="card">
            <h2>
              Result: {type.name} <span className="chip">{cls.confidence.label}</span>
            </h2>
            <TypeMatchBars classification={cls} />
          </div>
          <div className="card">
            <h2>Preview a full report</h2>
            <p className="small muted">Generates synthetic answers from a prototype. This replaces your current answers in this browser.</p>
            <div className="row">
              <select value={demoType} onChange={(e) => setDemoType(e.target.value)} style={{ padding: 8, borderRadius: 8, font: 'inherit', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-strong)' }}>
                {content.typeSet.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button className="btn" onClick={() => onDemo(demoSession(demoType))}>
                Generate &amp; view report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
