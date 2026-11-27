import type { Band, DimensionScore } from '../../engine';
import { dimById } from '../content';
import { useTooltip } from './Tooltip';

interface Props {
  dims: DimensionScore[];
  bands: Band[];
}

/** Ranked-free, fixed-order bar list of 0-100 dimension scores with band ticks. */
export function DimensionBars({ dims, bands }: Props) {
  const tt = useTooltip();
  return (
    <div>
      {dims.map((d) => {
        const dim = dimById.get(d.dimensionId)!;
        const v = d.score ?? 0;
        const tip = (
          <>
            <b>{dim.name}</b>
            <br />
            Questionnaire: {d.questionnaireScore ?? 'n/a'}
            {d.taskContributions.map((t) => (
              <span key={t.metric}>
                <br />
                Task {t.metric}: {t.taskScore.toFixed(0)} (weight {t.weight})
              </span>
            ))}
            <br />
            Final: {d.score ?? 'n/a'} ({d.band?.label ?? 'insufficient data'})
          </>
        );
        return (
          <div className="dimrow" key={d.dimensionId}>
            <div className="name">
              {dim.name}
              <small>{dim.short}</small>
            </div>
            <div className="track-wrap">
              <svg
                viewBox="0 0 100 14"
                preserveAspectRatio="none"
                width="100%"
                height="22"
                tabIndex={0}
                aria-label={`${dim.name} ${d.score ?? 'no data'} out of 100`}
                onMouseMove={(e) => tt.show(e, tip)}
                onMouseLeave={tt.hide}
                onFocus={(e) => tt.show(e.currentTarget, tip)}
                onBlur={tt.hide}
                style={{ display: 'block', overflow: 'visible' }}
              >
                <rect x={0} y={4} width={100} height={6} rx={3} fill="var(--surface-2)" />
                {bands.slice(1).map((b) => (
                  <line key={b.id} x1={b.min} x2={b.min} y1={1} y2={13} stroke="var(--chart-axis)" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
                ))}
                {d.score !== null && <rect x={0} y={4} width={Math.max(v, 1.5)} height={6} rx={3} fill="var(--chart-1)" />}
              </svg>
            </div>
            <div className="val">
              <b>{d.score ?? '–'}</b>
              <br />
              <span className={d.elevated ? '' : 'muted'} style={{ fontWeight: d.elevated ? 700 : 400 }}>
                {d.band?.label ?? 'No data'}
              </span>
            </div>
          </div>
        );
      })}
      <p className="tiny muted" style={{ marginTop: 10 }}>
        Ticks mark band boundaries: {bands.map((b) => `${b.label} ≥ ${b.min}`).join(' · ')}. Scores are 0–100 and not yet normed against a population.
      </p>
      {tt.node}
    </div>
  );
}
