import { activeItems, itemDimensions, itemWeight } from '../../engine';
import { content } from '../content';
import { Mascot } from '../components/Mascot';
import type { SessionState } from '../state';

interface Props {
  session: SessionState;
  onConsent: (v: boolean) => void;
  onStart: () => void;
  onResume: () => void;
  hasProgress: boolean;
  hasResults: boolean;
  onResults: () => void;
}

export function Home({ session, onConsent, onStart, onResume, hasProgress, hasResults, onResults }: Props) {
  const { testSet, typeSet, references } = content;
  const items = activeItems(content);
  const scored = items.filter((i) => itemWeight(content, i) > 0 && itemDimensions(i).length > 0).length;
  const withDoi = references.references.filter((r) => r.doi).length;

  return (
    <div>
      <section className="hero">
        <div className="mascot-parade" aria-hidden>
          {typeSet.types.map((t) => (
            <div className="m" key={t.id} style={{ background: t.palette.background }}>
              <Mascot mascot={t.mascot} palette={t.palette} size={56} />
            </div>
          ))}
        </div>
        <h1 style={{ marginTop: 28 }}>{testSet.meta.title}</h1>
        <p className="lead">
          Discover how your mind works across {testSet.dimensions.length} neurodivergent trait dimensions and your everyday comfort zone. You get a visual
          report and a cartoon type card.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {hasResults && (
            <button className="btn secondary" onClick={onResults}>
              View my last results
            </button>
          )}
          {hasProgress && !hasResults && (
            <button className="btn secondary" onClick={onResume}>
              Resume where I left off
            </button>
          )}
        </div>
      </section>

      <div className="grid-3" style={{ margin: '28px 0' }}>
        <div className="card">
          <div className="stat">~{testSet.meta.estimated_minutes} min</div>
          <div className="muted small">
            {items.length} statements + an optional 90-second reaction task
          </div>
        </div>
        <div className="card">
          <div className="stat">{scored} scored</div>
          <div className="muted small">
            items, each tagged established / emerging / exploratory evidence, with citations
          </div>
        </div>
        <div className="card">
          <div className="stat">{references.references.length} sources</div>
          <div className="muted small">
            cited ({withDoi} with DOIs checked against Crossref). See <a href="#/method">Method &amp; evidence</a>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card steps">
          <h2>How it works</h2>
          <div className="step" style={{ marginBottom: 14 }}>
            <b>Answer {items.length} short statements</b>
            <div className="muted small">About attention, energy, planning, social cues, senses, routines, reading, numbers and movement. Then your preferred light, sound, temperature and more.</div>
          </div>
          <div className="step" style={{ marginBottom: 14 }}>
            <b>Optional: a quick reaction task</b>
            <div className="muted small">A 90-second Go/No-Go game adds a behavioural measure of attention and impulse control. You can skip it.</div>
          </div>
          <div className="step">
            <b>Get your report and type card</b>
            <div className="muted small">
              Your closest of {typeSet.types.length} profile types, your dimension profile, comfort zone, strengths, tips, and the full calculation behind every number.
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Before you begin</h2>
          <ul className="ticks small" style={{ marginBottom: 16 }}>
            <li>
              <b>This is not a diagnosis.</b> It's a self-reflection tool based on published research. Only a qualified professional can diagnose ADHD, autism,
              dyslexia, dyscalculia or dyspraxia.
            </li>
            <li>Neurodivergent traits are differences, not deficits. Every type describes strengths as well as challenges.</li>
            <li>Your answers stay in this browser. Nothing is sent to a server.</li>
            <li>
              This is version {testSet.meta.version} (<i>{testSet.meta.status}</i>). Scores are not yet normed against a population.
            </li>
          </ul>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={session.consent} onChange={(e) => onConsent(e.target.checked)} style={{ width: 20, height: 20, marginTop: 3, accentColor: 'var(--accent)' }} />
            <span>
              I am {testSet.meta.min_age} or older and understand this is a self-reflection tool, not a medical or psychological diagnosis.
            </span>
          </label>
          <button className="btn" disabled={!session.consent} onClick={onStart} style={{ width: '100%' }}>
            {hasProgress ? 'Start again from the beginning' : 'Start the test'}
          </button>
        </div>
      </div>
    </div>
  );
}
