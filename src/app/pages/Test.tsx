import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildQuestionOrder, paginateBySection } from '../../engine';
import { content, itemById } from '../content';
import { Question } from '../components/Question';
import type { SessionState } from '../state';

interface Props {
  session: SessionState;
  update: (fn: (s: SessionState) => SessionState) => void;
  onFinish: () => void;
}

export function Test({ session, update, onFinish }: Props) {
  const order = useMemo(() => buildQuestionOrder(content), []);
  const pages = useMemo(() => paginateBySection(order, content.testSet.presentation.items_per_page), [order]);
  const firstOpen = pages.findIndex((p) => p.some((q) => typeof session.responses[q.id] !== 'number'));
  const [page, setPage] = useState(firstOpen < 0 ? pages.length - 1 : firstOpen);
  const [hint, setHint] = useState(false);
  const lastTick = useRef(performance.now());
  const containerRef = useRef<HTMLDivElement>(null);

  const questions = pages[page];
  const section = content.testSet.sections.find((s) => s.id === questions[0].section)!;
  const isSectionStart = page === 0 || pages[page - 1][0].section !== questions[0].section;
  const answeredCount = order.filter((q) => typeof session.responses[q.id] === 'number').length;
  const allAnswered = questions.every((q) => typeof session.responses[q.id] === 'number');

  useEffect(() => {
    if (!session.presentedOrder.length) update((s) => ({ ...s, presentedOrder: order.map((q) => q.id), startedAt: s.startedAt ?? new Date().toISOString() }));
  }, [order, session.presentedOrder.length, update]);

  useEffect(() => {
    lastTick.current = performance.now();
    setHint(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const answer = useCallback(
    (id: string, v: number, idx: number) => {
      const now = performance.now();
      const dt = Math.round(now - lastTick.current);
      lastTick.current = now;
      update((s) => ({
        ...s,
        responses: { ...s.responses, [id]: v },
        timings: s.timings[id] ? s.timings : { ...s.timings, [id]: dt },
      }));
      // move focus/scroll to the next unanswered question on this page
      const next = questions.slice(idx + 1).find((q) => typeof session.responses[q.id] !== 'number');
      if (next) {
        setTimeout(() => {
          const el = document.getElementById(`q-${next.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
      }
    },
    [questions, session.responses, update],
  );

  // keyboard: 1-5 answers the first unanswered agreement-scale question on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 5) return;
      const idx = questions.findIndex((q) => typeof session.responses[q.id] !== 'number' && (itemById.get(q.id)?.format ?? 'likert') !== 'choice');
      if (idx < 0) return;
      answer(questions[idx].id, content.testSet.response_scale.values[n - 1], idx);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [questions, session.responses, answer]);

  const next = () => {
    if (!allAnswered) {
      setHint(true);
      const first = questions.find((q) => typeof session.responses[q.id] !== 'number');
      if (first) document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (page < pages.length - 1) setPage(page + 1);
    else onFinish();
  };

  return (
    <div className="narrow" ref={containerRef}>
      <div style={{ position: 'sticky', top: 57, zIndex: 5, background: 'var(--bg)', padding: '10px 0 12px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="eyebrow">{section.title}</span>
          <span className="small muted" aria-live="polite">
            {answeredCount} / {order.length} answered
          </span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={order.length} aria-valuenow={answeredCount}>
          <div style={{ width: `${(answeredCount / order.length) * 100}%` }} />
        </div>
      </div>

      {isSectionStart && (
        <div className="card" style={{ marginTop: 12 }}>
          <h2 style={{ marginBottom: 6 }}>{section.title}</h2>
          <p className="muted" style={{ marginBottom: 6 }}>
            {section.intro}
          </p>
          {section.id === content.testSet.sections[0].id && <p className="small muted" style={{ margin: 0 }}>{content.testSet.response_scale.instruction}</p>}
          <p className="tiny muted" style={{ margin: '8px 0 0' }}>
            Tip: press <span className="kbd">1</span>–<span className="kbd">5</span> to answer the next statement with the keyboard.
          </p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, paddingTop: 4, paddingBottom: 4 }}>
        {questions.map((q, i) => (
          <Question
            key={q.id}
            id={q.id}
            index={order.indexOf(q)}
            text={q.text}
            item={itemById.get(q.id)}
            value={session.responses[q.id]}
            onChange={(v) => answer(q.id, v, i)}
          />
        ))}
      </div>

      {hint && (
        <p className="notice caution" role="alert" style={{ marginTop: 12 }}>
          Please answer every statement on this page to continue.
        </p>
      )}

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 18 }}>
        <button className="btn secondary" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0 || !content.testSet.presentation.allow_back}>
          Back
        </button>
        <span className="small muted">
          Page {page + 1} of {pages.length}
        </span>
        <button className="btn" onClick={next} aria-disabled={!allAnswered}>
          {page < pages.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>
    </div>
  );
}
