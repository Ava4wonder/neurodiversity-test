import { useCallback, useEffect, useRef, useState } from 'react';
import { buildTrials, computeGoNoGoMetrics, type GoNoGoMetrics, type TrialResult } from '../../engine';
import { content } from '../content';
import { Cite } from '../components/Citations';

type Phase = 'intro' | 'practice' | 'between' | 'main' | 'done';
type Stim = 'fix' | 'go' | 'nogo' | 'blank' | 'ok' | 'miss';

interface Props {
  onComplete: (m: GoNoGoMetrics) => void;
  onSkip: () => void;
}

function Stimulus({ s }: { s: Stim }) {
  if (s === 'go')
    return (
      <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label="Green circle: respond">
        <circle cx={70} cy={70} r={62} fill="#2f9e7a" />
      </svg>
    );
  if (s === 'nogo')
    return (
      <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label="Red square: do not respond">
        <rect x={12} y={12} width={116} height={116} rx={14} fill="#dc3c3d" />
      </svg>
    );
  if (s === 'ok') return <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ok-ink)' }}>✓ Correct</div>;
  if (s === 'miss') return <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--critical)' }}>✗ Not quite</div>;
  if (s === 'fix') return <div className="fix">+</div>;
  return <div className="fix" />;
}

export function Task({ onComplete, onSkip }: Props) {
  const task = content.testSet.tasks.find((t) => t.type === 'go_nogo')!;
  const p = task.params;
  const [phase, setPhase] = useState<Phase>('intro');
  const [stim, setStim] = useState<Stim>('blank');
  const [progress, setProgress] = useState(0);
  const timers = useRef<number[]>([]);
  const onset = useRef<number | null>(null);
  const rt = useRef<number | null>(null);
  const windowOpen = useRef(false);

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const run = useCallback(
    (practice: boolean) => {
      const trials = buildTrials(p, practice);
      const results: TrialResult[] = [];
      let i = 0;
      const step = () => {
        if (i >= trials.length) {
          setStim('blank');
          if (practice) setPhase('between');
          else {
            setPhase('done');
            onComplete(computeGoNoGoMetrics(results, p));
          }
          return;
        }
        const t = trials[i];
        setStim('fix');
        later(() => {
          onset.current = performance.now();
          rt.current = null;
          windowOpen.current = true;
          setStim(t.kind);
          later(() => setStim('blank'), p.stimulus_ms);
          later(() => {
            windowOpen.current = false;
            results.push({ kind: t.kind, rtMs: rt.current });
            i++;
            setProgress(i / trials.length);
            if (practice) {
              const correct = (t.kind === 'go') === (rt.current !== null);
              setStim(correct ? 'ok' : 'miss');
              later(step, 700);
            } else step();
          }, p.response_window_ms);
        }, t.isiMs);
      };
      setProgress(0);
      step();
    },
    [p, onComplete],
  );

  const respond = useCallback(() => {
    if (windowOpen.current && rt.current === null && onset.current !== null) rt.current = performance.now() - onset.current;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (phase === 'practice' || phase === 'main')) {
        e.preventDefault();
        respond();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, respond]);

  const start = (practice: boolean) => {
    clear();
    setPhase(practice ? 'practice' : 'main');
    later(() => run(practice), 600);
  };

  const running = phase === 'practice' || phase === 'main';

  return (
    <div className="narrow">
      <div className="card">
        <span className="eyebrow">Optional · {task.status}</span>
        <h2>{task.name}</h2>
        {phase === 'intro' && (
          <>
            <p>{task.description}</p>
            <div className="row" style={{ justifyContent: 'center', gap: 40, margin: '10px 0 18px' }}>
              <div style={{ textAlign: 'center' }}>
                <Stimulus s="go" />
                <div className="small">
                  <b>Green circle</b>: tap / Space
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Stimulus s="nogo" />
                <div className="small">
                  <b>Red square</b>: do nothing
                </div>
              </div>
            </div>
            <p className="small muted">
              Why: this task measures response inhibition and reaction-time consistency, two well-studied markers of attention{' '}
              <Cite refs={task.refs} />. It adds a small, capped weight to two dimensions. Skip it if you prefer, or if motor or visual differences would make it
              unfair. Your results will just use the questionnaire.
            </p>
            <div className="row">
              <button className="btn" onClick={() => start(true)}>
                Start practice ({p.practice_trials} trials)
              </button>
              <button className="btn ghost" onClick={onSkip}>
                Skip this task
              </button>
            </div>
          </>
        )}
        {phase === 'between' && (
          <>
            <p>Practice done. The real round has {p.trials} trials with no feedback. Be fast, but don't respond to the red square.</p>
            <div className="row">
              <button className="btn" onClick={() => start(false)}>
                Start the real round
              </button>
              <button className="btn secondary" onClick={() => start(true)}>
                Practise again
              </button>
              <button className="btn ghost" onClick={onSkip}>
                Skip
              </button>
            </div>
          </>
        )}
        {running && (
          <>
            <div className="progress" style={{ margin: '8px 0 14px' }}>
              <div style={{ width: `${progress * 100}%` }} />
            </div>
            <div
              className="task-stage"
              onPointerDown={(e) => {
                e.preventDefault();
                respond();
              }}
              role="button"
              aria-label="Response area: tap here or press Space when you see the green circle"
            >
              <Stimulus s={stim} />
            </div>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
              <span className="small muted">{phase === 'practice' ? 'Practice' : 'Real round'}: tap the area or press Space</span>
              <button
                className="btn ghost small"
                onClick={() => {
                  clear();
                  onSkip();
                }}
              >
                Stop &amp; skip
              </button>
            </div>
          </>
        )}
        {phase === 'done' && <p>Done! Calculating your results…</p>}
      </div>
    </div>
  );
}
