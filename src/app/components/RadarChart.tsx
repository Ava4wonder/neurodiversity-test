import type { DimensionScore } from '../../engine';
import { dimById } from '../content';
import { useTooltip } from './Tooltip';

interface Props {
  dims: DimensionScore[];
  elevatedAt: number;
  size?: number;
}

/** Profile shape: one series, so no legend; the card title names it. */
export function RadarChart({ dims, elevatedAt, size = 380 }: Props) {
  const tt = useTooltip();
  const pad = 96;
  const vb = size + pad * 2;
  const c = vb / 2;
  const R = size / 2 - 6;
  const n = dims.length;
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, v: number) => [c + Math.cos(ang(i)) * (R * v) / 100, c + Math.sin(ang(i)) * (R * v) / 100];
  const ring = (v: number) => dims.map((_, i) => pt(i, v).join(',')).join(' ');
  const poly = dims.map((d, i) => pt(i, d.score ?? 0).join(',')).join(' ');

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" role="img" aria-label="Radar chart of dimension scores (0 to 100). The same values are in the dimension list.">
        {[25, 50, 75, 100].map((v) => (
          <polygon key={v} points={ring(v)} fill="none" stroke="var(--chart-grid)" strokeWidth={1} />
        ))}
        <polygon points={ring(elevatedAt)} fill="none" stroke="var(--chart-axis)" strokeWidth={1.5} />
        {dims.map((_, i) => {
          const [x, y] = pt(i, 100);
          return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />;
        })}
        <text x={c + 4} y={c - (R * elevatedAt) / 100 - 4} fontSize={11} fill="var(--ink-3)">
          elevated ({elevatedAt})
        </text>
        <polygon points={poly} fill="var(--chart-1)" fillOpacity={0.16} stroke="var(--chart-1)" strokeWidth={2} strokeLinejoin="round" />
        {dims.map((d, i) => {
          const [x, y] = pt(i, d.score ?? 0);
          const dim = dimById.get(d.dimensionId)!;
          const [lx, ly] = pt(i, 116);
          const words = dim.name.split(' ');
          const lines = dim.name.length > 10 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [dim.name];
          const anchor = Math.abs(lx - c) < 8 ? 'middle' : lx > c ? 'start' : 'end';
          const tip = (
            <>
              <b>{dim.name}</b>: {d.score ?? 'n/a'} / 100
              <br />
              {d.band?.label ?? 'Insufficient data'}
            </>
          );
          return (
            <g key={d.dimensionId}>
              <circle cx={x} cy={y} r={5} fill="var(--chart-1)" stroke="var(--surface)" strokeWidth={2} />
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="transparent"
                tabIndex={0}
                aria-label={`${dim.name}: ${d.score ?? 'no data'}`}
                onMouseMove={(e) => tt.show(e, tip)}
                onMouseLeave={tt.hide}
                onFocus={(e) => tt.show(e.currentTarget, tip)}
                onBlur={tt.hide}
              />
              <text x={lx} y={ly - (lines.length - 1) * 8} textAnchor={anchor} dominantBaseline="middle" fontSize={15} fontWeight={d.elevated ? 700 : 400} fill={d.elevated ? 'var(--ink)' : 'var(--ink-2)'}>
                {lines.map((l, k) => (
                  <tspan key={k} x={lx} dy={k === 0 ? 0 : 17}>
                    {l}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      {tt.node}
    </div>
  );
}
