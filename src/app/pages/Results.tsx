import { useMemo, useRef, useState } from 'react';
import { runScoring, type Report } from '../../engine';
import { content, dimById, itemById, typeById } from '../content';
import { Cite, EvidenceBadge } from '../components/Citations';
import { ComfortZone } from '../components/ComfortZone';
import { DimensionBars } from '../components/DimensionBars';
import { StatusIcon } from '../components/Icons';
import { RadarChart } from '../components/RadarChart';
import { TypeCard } from '../components/TypeCard';
import { TypeMatchBars } from '../components/TypeMatchBars';
import { downloadJson, downloadSvgAsPng } from '../lib/download';
import type { SessionState } from '../state';

interface Props {
  session: SessionState;
  update: (fn: (s: SessionState) => SessionState) => void;
  onRetake: () => void;
  onStart: () => void;
}

const DIAGNOSES = ['ADHD', 'Autism', 'Dyslexia', 'Dyscalculia', 'Dyspraxia / DCD', 'Other neurodivergence', 'None', 'Prefer not to say'];
const AGE_BANDS = ['', '16-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const RULE_LABEL: Record<string, string> = {
  attention_checks: 'Attention checks',
  consistency: 'Consistency',
  straightlining: 'Answer variety',
  speed: 'Response speed',
};

export function Results({ session, update, onRetake, onStart }: Props) {
  const cardRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState(false);
  const answered = Object.keys(session.responses).length;

  const report: Report | null = useMemo(() => {
    if (answered < 10) return null;
    return runScoring(
      content,
      { responses: session.responses, timings: session.timings, presentedOrder: session.presentedOrder, tasks: session.tasks },
      session.completedAt ? new Date(session.completedAt) : new Date(),
    );
  }, [session, answered]);

  if (!report) {
    return (
      <div className="narrow card" style={{ textAlign: 'center' }}>
        <h2>No results yet</h2>
        <p className="muted">Take the test to see your profile, comfort zone and type card.</p>
        <button className="btn" onClick={onStart}>
          Go to the start page
        </button>
      </div>
    );
  }

  const { classification: cls, validity, dimensions } = report;
  const type = typeById.get(cls.primaryTypeId)!;
  const second = cls.secondaryTypeId ? typeById.get(cls.secondaryTypeId) ?? null : null;
  const elevated = dimensions.filter((d) => d.elevated).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const date = new Date(report.generatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const gng = session.tasks.GNG;

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      await downloadSvgAsPng(cardRef.current, `type-card-${type.id.toLowerCase()}.png`, 2);
    } finally {
      setBusy(false);
    }
  };

  const exportResearch = () =>
    downloadJson(
      {
        format: 'nd-test-research-export/v1',
        exportedAt: new Date().toISOString(),
        versions: report.versions,
        presentedOrder: session.presentedOrder,
        responses: session.responses,
        timings: session.timings,
        tasks: session.tasks,
        research: session.research,
        summary: {
          primaryTypeId: cls.primaryTypeId,
          secondaryTypeId: cls.secondaryTypeId,
          dimensions: Object.fromEntries(dimensions.map((d) => [d.dimensionId, d.score])),
          validity: validity.status,
        },
      },
      `nd-test-export-${new Date().toISOString().slice(0, 10)}.json`,
    );

  const toggleDx = (dx: string) =>
    update((s) => {
      const has = s.research.diagnoses.includes(dx);
      return { ...s, research: { ...s.research, diagnoses: has ? s.research.diagnoses.filter((d) => d !== dx) : [...s.research.diagnoses, dx] } };
    });

  return (
    <div>
      {validity.status !== 'ok' && (
        <div className={`notice ${validity.status}`} role="alert" style={{ marginBottom: 20 }}>
          <StatusIcon status={validity.status} />
          <div>
            <b>{validity.status === 'invalid' ? 'These results may not reflect you' : 'Read these results with some caution'}.</b>{' '}
            {validity.rules
              .filter((r) => r.status !== 'ok')
              .map((r) => `${RULE_LABEL[r.rule]}: ${r.detail}`)
              .join(' ')}{' '}
            {validity.status === 'invalid' && (
              <button className="btn small secondary no-print" onClick={onRetake} style={{ marginLeft: 6 }}>
                Retake
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ hero */}
      <section className="result-hero">
        <div className="typecard-wrap">
          <TypeCard
            ref={cardRef}
            type={type}
            dims={dimensions.map((d) => ({ id: d.dimensionId, score: d.score, elevated: d.elevated }))}
            signature={cls.signature}
            blendWith={cls.isBlend ? second : null}
            confidence={cls.confidence.label}
            date={date}
            version={report.versions.testSet}
          />
          <div className="row no-print" style={{ marginTop: 14, justifyContent: 'center' }}>
            <button className="btn small" onClick={downloadCard} disabled={busy}>
              {busy ? 'Preparing…' : 'Download card (PNG)'}
            </button>
            <button className="btn small secondary" onClick={() => window.print()}>
              Print / save report as PDF
            </button>
          </div>
        </div>
        <div>
          <span className="eyebrow">Your closest profile type</span>
          <h1 style={{ marginTop: 6 }}>{type.name}</h1>
          <p style={{ fontSize: '1.15rem' }} className="muted">
            {type.tagline}
          </p>
          <div className="row" style={{ marginBottom: 14 }}>
            <span className="chip accent">{cls.confidence.label}</span>
            {cls.isBlend && second && <span className="chip">Blend with {second.name}</span>}
            {cls.usedFallback && second && <span className="chip">Nearest prototype: {second.name}</span>}
            {report.tasksCompleted.length > 0 && <span className="chip">Includes reaction task</span>}
          </div>
          <p>{type.summary}</p>
          {cls.isBlend && second && (
            <p className="small">
              Your profile sits between two types. You also match <b>{second.name}</b> closely: {second.tagline.toLowerCase()}
            </p>
          )}
          <div className="notice small" style={{ margin: '14px 0' }}>
            <div>
              <b>{type.associated_with}.</b> This describes a pattern of self-reported traits. It is not a diagnosis.{' '}
              <Cite refs={type.refs} />
            </div>
          </div>
          <div className="small">
            <span className="muted">Profile signature (elevated dimensions): </span>
            {cls.signature.length ? (
              cls.signature.map((id) => (
                <span key={id} className="chip" style={{ marginRight: 6 }} title={dimById.get(id)?.name}>
                  {id} · {dimById.get(id)?.name}
                </span>
              ))
            ) : (
              <span>none above {content.scoring.elevated_threshold}</span>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ profile */}
      <div className="card" style={{ marginTop: 28 }}>
        <h2>Your dimension profile</h2>
        <p className="muted small">Higher scores mean more of the trait. Hover over or focus any point for details.</p>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <RadarChart dims={dimensions} elevatedAt={content.scoring.elevated_threshold} />
          <DimensionBars dims={dimensions} bands={content.scoring.bands} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2>How closely you match each type</h2>
          <p className="muted small">
            Each type is a prototype profile. Your profile is compared with all of them, and the closer the match, the higher the probability.{' '}
            {cls.usedFallback && <b>No prototype fitted closely, so you were assigned {type.name}. </b>}
            <Cite refs={content.scoring.classification.refs} />
          </p>
          <TypeMatchBars classification={cls} />
        </div>
        <div className="card">
          <h2>Strengths, challenges &amp; ideas</h2>
          <h3 style={{ marginTop: 10 }}>Commonly reported strengths</h3>
          <ul className="ticks small">
            {type.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3 style={{ marginTop: 16 }}>Common challenges</h3>
          <ul className="ticks small">
            {type.challenges.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3 style={{ marginTop: 16 }}>Ideas to try</h3>
          <ul className="ticks small">
            {type.support_tips.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="tiny muted" style={{ marginTop: 10, marginBottom: 0 }}>
            Strengths come mostly from qualitative studies of people with this profile and won't apply to everyone. Ideas are practical suggestions, not
            clinical treatments.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ comfort zone */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Your everyday comfort zone</h2>
        <p className="muted small">
          Your preferences for light, sound, temperature and more. Where research links a preference to a trait, it adds a small, evidence-weighted amount
          to that dimension. Otherwise it is shown here only.
        </p>
        <ComfortZone responses={session.responses} />
      </div>

      {/* ------------------------------------------------ elevated dims */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>Your elevated dimensions</h2>
        {elevated.length === 0 && <p className="muted">No dimension reached the elevated band ({content.scoring.elevated_threshold}+).</p>}
        <div className="grid-2">
          {elevated.map((d) => {
            const dim = dimById.get(d.dimensionId)!;
            return (
              <div key={d.dimensionId} style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 16 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0 }}>{dim.name}</h3>
                  <span className="chip">
                    {d.score} · {d.band?.label}
                  </span>
                </div>
                <p className="small muted" style={{ margin: '6px 0 10px' }}>
                  {dim.construct}
                </p>
                <div className="grid-2" style={{ gap: 12 }}>
                  <div>
                    <div className="eyebrow">Strengths</div>
                    <ul className="ticks small">
                      {dim.strengths.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="eyebrow">Challenges</div>
                    <ul className="ticks small">
                      {dim.challenges.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="tiny muted" style={{ margin: '10px 0 0' }}>
                  Often associated with: {dim.associated_with.join(', ')}. <Cite refs={dim.refs} />
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------ traceability */}
      <div className="card" style={{ marginTop: 20 }}>
        <h2>How your result was calculated</h2>
        <p className="muted small">
          Every number above can be traced to your answers, the published{' '}
          <a href="#/method">content files and scoring rules</a>. Test set v{report.versions.testSet} · type set v{report.versions.typeSet} · scoring v
          {report.versions.scoring}.
        </p>

        <details className="disclose">
          <summary>Response quality checks</summary>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {validity.rules.map((r) => (
                  <tr key={r.rule}>
                    <td style={{ width: 28 }}>
                      <StatusIcon status={r.status} />
                    </td>
                    <td>
                      <b>{RULE_LABEL[r.rule]}</b> ({r.status})
                    </td>
                    <td>{r.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tiny muted">
              Rules from the careless-responding literature <Cite refs={content.scoring.validity.refs} />.
            </p>
          </div>
        </details>

        <details className="disclose">
          <summary>Reaction task</summary>
          <div>
            {gng ? (
              <table className="data">
                <tbody>
                  <tr>
                    <td>False alarms on the red square (commission rate)</td>
                    <td className="num">{(gng.commission_rate * 100).toFixed(0)}%</td>
                  </tr>
                  <tr>
                    <td>Missed green circles (omission rate)</td>
                    <td className="num">{(gng.omission_rate * 100).toFixed(0)}%</td>
                  </tr>
                  <tr>
                    <td>Mean reaction time</td>
                    <td className="num">{gng.rt_mean_ms} ms</td>
                  </tr>
                  <tr>
                    <td>Reaction-time variability (CV)</td>
                    <td className="num">{gng.rt_cv.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="small muted">{session.taskSkipped ? 'You skipped the reaction task, so results use the questionnaire only.' : 'Not completed.'}</p>
            )}
          </div>
        </details>

        {dimensions.map((d) => {
          const dim = dimById.get(d.dimensionId)!;
          return (
            <details className="disclose" key={d.dimensionId}>
              <summary>
                {dim.name}: {d.score ?? 'insufficient data'}{' '}
                <span className="muted small" style={{ fontWeight: 400 }}>
                  ({d.answered}/{d.total} scored items answered)
                </span>
              </summary>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Statement</th>
                      <th>Evidence</th>
                      <th className="num">Answer</th>
                      <th className="num">Keyed</th>
                      <th className="num">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.items.map((t) => {
                      const it = itemById.get(t.itemId)!;
                      return (
                        <tr key={t.itemId} style={{ opacity: t.weight > 0 ? 1 : 0.55 }}>
                          <td>{t.itemId}</td>
                          <td>
                            {it.text}
                            {t.keying === 'reverse' && <span className="tiny muted"> (reverse-keyed)</span>}
                          </td>
                          <td>
                            <EvidenceBadge level={t.evidence} />
                          </td>
                          <td className="num">{t.raw ?? '–'}</td>
                          <td className="num">{t.keyed ?? '–'}</td>
                          <td className="num">{t.weight}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="tiny muted">
                  Questionnaire score = 100 × weighted mean of keyed answers / 4 = <b>{d.questionnaireScore ?? 'n/a'}</b>
                  {d.taskContributions.length > 0 &&
                    `; blended with task metrics (${d.taskContributions.map((t) => `${t.metric} → ${t.taskScore.toFixed(0)} × ${t.weight}`).join(', ')}) = ${d.score}`}
                  .
                </p>
              </div>
            </details>
          );
        })}

        <details className="disclose">
          <summary>Distance to each type prototype</summary>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Type</th>
                  {content.testSet.dimensions.map((d) => (
                    <th key={d.id} className="num">
                      {d.id}
                    </th>
                  ))}
                  <th className="num">Distance</th>
                  <th className="num">Fit</th>
                  <th className="num">p</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <b>You</b>
                  </td>
                  {dimensions.map((d) => (
                    <td key={d.dimensionId} className="num">
                      <b>{d.score ?? '–'}</b>
                    </td>
                  ))}
                  <td colSpan={3} />
                </tr>
                {cls.matches.map((m) => (
                  <tr key={m.typeId}>
                    <td>{typeById.get(m.typeId)?.name}</td>
                    {m.perDimension.map((p) => (
                      <td key={p.dimensionId} className="num" style={{ fontWeight: p.weight >= 1 ? 700 : 400 }}>
                        {p.target}
                      </td>
                    ))}
                    <td className="num">{m.distance.toFixed(1)}</td>
                    <td className="num">{m.fit.toFixed(2)}</td>
                    <td className="num">{(m.probability * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tiny muted">
              Bold targets are core dimensions (weight {content.scoring.classification.core_weight}); others are peripheral (weight{' '}
              {content.scoring.classification.peripheral_weight}). Distance = weighted RMS difference; fit = 1 − distance/100; p = softmax(−distance /{' '}
              {content.scoring.classification.temperature}). Fallback to {content.scoring.classification.fallback.type} if best fit &lt;{' '}
              {content.scoring.classification.min_fit}.
            </p>
          </div>
        </details>
      </div>

      {/* ------------------------------------------------ research export */}
      <div className="card no-print" style={{ marginTop: 20 }}>
        <h2>Help improve the test (optional)</h2>
        <p className="small muted">
          The test gets more trustworthy as we collect pilot data. You can download an anonymous export of your answers to share with the research team. The
          optional questions below only go into that file. Nothing is uploaded automatically.
        </p>
        <div className="grid-2">
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Formal diagnoses you have received (optional)
            </div>
            <div className="row" style={{ gap: 8 }}>
              {DIAGNOSES.map((dx) => (
                <label key={dx} className="chip" style={{ cursor: 'pointer', fontWeight: 400 }}>
                  <input type="checkbox" checked={session.research.diagnoses.includes(dx)} onChange={() => toggleDx(dx)} style={{ accentColor: 'var(--accent)' }} />
                  {dx}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="eyebrow" htmlFor="age">
              Age band (optional)
            </label>
            <div>
              <select
                id="age"
                value={session.research.ageBand}
                onChange={(e) => update((s) => ({ ...s, research: { ...s.research, ageBand: e.target.value } }))}
                style={{ marginTop: 6, padding: 8, borderRadius: 8, border: '1px solid var(--line-strong)', background: 'var(--surface)', color: 'var(--ink)', font: 'inherit' }}
              >
                {AGE_BANDS.map((a) => (
                  <option key={a} value={a}>
                    {a || 'Prefer not to say'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn secondary" onClick={exportResearch}>
            Download research export (JSON)
          </button>
          <button className="btn ghost" onClick={onRetake}>
            Retake the test
          </button>
        </div>
      </div>

      <div className="notice small" style={{ marginTop: 20 }}>
        <div>
          <b>Next steps.</b> If these traits affect your work, study or wellbeing, consider talking to a doctor or a licensed psychologist about a formal
          assessment. Bring this report along as a starting point for the conversation. If you're in distress, contact your local emergency or crisis service.
        </div>
      </div>
    </div>
  );
}
