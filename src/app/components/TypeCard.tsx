import { forwardRef } from 'react';
import type { TypeDef } from '../../engine';
import { wrap } from '../lib/format';
import { Mascot } from './Mascot';

export interface CardDim {
  id: string;
  score: number | null;
  elevated: boolean;
}

interface Props {
  type: TypeDef;
  dims: CardDim[];
  signature: string[];
  blendWith?: TypeDef | null;
  confidence?: string;
  date?: string;
  version: string;
}

const FONT = "'Atkinson Hyperlegible', Arial, Helvetica, sans-serif";

/** Shareable type card, a self-contained SVG (exportable to PNG). */
export const TypeCard = forwardRef<SVGSVGElement, Props>(function TypeCard(
  { type, dims, signature, blendWith, confidence, date, version },
  ref,
) {
  const { palette: p } = type;
  const W = 600;
  const H = 880;
  const tagline = wrap(type.tagline, 40, 2);
  const strengths = type.strengths.slice(0, 3).map((s) => wrap(s, 46, 1)[0]);
  const chips = signature.length ? signature.slice(0, 5) : ['No elevated dimension'];
  const chipW = (t: string) => t.length * 9.5 + 28;
  const totalChips = chips.reduce((s, c) => s + chipW(c), 0) + (chips.length - 1) * 8;
  let cx = (W - totalChips) / 2;

  const barTop = 600;
  const barBase = 700;
  const barArea = 440;
  const slot = barArea / dims.length;
  const bw = Math.min(30, slot - 12);

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Type card: ${type.name}`} fontFamily={FONT}>
      <defs>
        <clipPath id={`clip-${type.id}`}>
          <rect width={W} height={H} rx={36} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${type.id})`}>
        <rect width={W} height={H} fill={p.background} />
        <circle cx={520} cy={70} r={120} fill={p.secondary} opacity={0.25} />
        <circle cx={70} cy={480} r={90} fill={p.primary} opacity={0.08} />
        <rect y={H - 64} width={W} height={64} fill={p.primary} opacity={0.12} />
      </g>
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={35} fill="none" stroke={p.primary} strokeOpacity={0.25} strokeWidth={2} />

      <text x={40} y={58} fontSize={14} fontWeight={700} letterSpacing={2} fill={p.ink} opacity={0.75}>
        NEURODIVERSITY TRAIT PROFILE
      </text>
      <text x={W - 40} y={58} fontSize={14} textAnchor="end" fill={p.ink} opacity={0.6}>
        v{version}
      </text>

      <circle cx={W / 2} cy={232} r={142} fill={p.primary} opacity={0.14} />
      <circle cx={W / 2} cy={232} r={118} fill="#FFFFFF" opacity={0.55} />
      <g transform={`translate(${W / 2 - 115} ${232 - 115}) scale(1.15)`}>
        <Mascot mascot={type.mascot} palette={p} asGroup />
      </g>

      <text x={W / 2} y={428} textAnchor="middle" fontSize={48} fontWeight={700} fill={p.ink}>
        {type.name}
      </text>
      {tagline.map((l, i) => (
        <text key={i} x={W / 2} y={466 + i * 27} textAnchor="middle" fontSize={20} fill={p.ink} opacity={0.85}>
          {l}
        </text>
      ))}
      {blendWith && (
        <text x={W / 2} y={466 + tagline.length * 27 + 4} textAnchor="middle" fontSize={16} fontStyle="italic" fill={p.ink} opacity={0.75}>
          blended with {blendWith.name}
        </text>
      )}

      <g>
        {chips.map((c) => {
          const w = chipW(c);
          const x = cx;
          cx += w + 8;
          return (
            <g key={c}>
              <rect x={x} y={538} width={w} height={32} rx={16} fill={p.primary} />
              <text x={x + w / 2} y={559} textAnchor="middle" fontSize={15} fontWeight={700} fill="#FFFFFF">
                {c}
              </text>
            </g>
          );
        })}
      </g>

      {/* mini profile strip */}
      <line x1={80} x2={520} y1={barBase} y2={barBase} stroke={p.ink} strokeOpacity={0.2} strokeWidth={1.5} />
      {dims.map((d, i) => {
        const x = 80 + slot * i + (slot - bw) / 2;
        const h = Math.max(4, ((d.score ?? 0) / 100) * (barBase - barTop));
        return (
          <g key={d.id}>
            <rect x={x} y={barBase - (barBase - barTop)} width={bw} height={barBase - barTop} rx={6} fill={p.ink} opacity={0.06} />
            <path
              d={`M${x} ${barBase} L${x} ${barBase - h + 6} Q${x} ${barBase - h} ${x + 6} ${barBase - h} L${x + bw - 6} ${barBase - h} Q${x + bw} ${barBase - h} ${x + bw} ${barBase - h + 6} L${x + bw} ${barBase} Z`}
              fill={p.primary}
              opacity={d.elevated ? 1 : 0.4}
            />
            <text x={x + bw / 2} y={barBase + 20} textAnchor="middle" fontSize={12} fontWeight={d.elevated ? 700 : 400} fill={p.ink} opacity={d.elevated ? 1 : 0.7}>
              {d.id}
            </text>
          </g>
        );
      })}

      <text x={60} y={758} fontSize={13} fontWeight={700} letterSpacing={1.5} fill={p.ink} opacity={0.7}>
        COMMONLY REPORTED STRENGTHS
      </text>
      <text x={60} y={786} fontSize={16} fill={p.ink}>
        {strengths.slice(0, 2).map((s, i) => (
          <tspan key={i} x={60} dy={i === 0 ? 0 : 24}>
            • {s}
          </tspan>
        ))}
      </text>

      <text x={40} y={H - 26} fontSize={13} fill={p.ink} opacity={0.8}>
        Self-reflection profile · not a diagnosis{confidence ? ` · ${confidence}` : ''}
      </text>
      <text x={W - 40} y={H - 26} fontSize={13} textAnchor="end" fill={p.ink} opacity={0.8}>
        {date ?? ''}
      </text>
    </svg>
  );
});
