import type { Classification } from '../../engine';
import { typeById } from '../content';
import { Mascot } from './Mascot';
import { useTooltip } from './Tooltip';

/** Probability of each prototype. The primary match is highlighted; others are muted. */
export function TypeMatchBars({ classification }: { classification: Classification }) {
  const tt = useTooltip();
  const highlight = classification.usedFallback ? null : classification.primaryTypeId;
  return (
    <div>
      {classification.matches.map((m) => {
        const t = typeById.get(m.typeId)!;
        const pct = Math.round(m.probability * 100);
        const tip = (
          <>
            <b>{t.name}</b>
            <br />
            Match probability {pct}%<br />
            Fit {m.fit.toFixed(2)} (distance {m.distance.toFixed(1)})
          </>
        );
        return (
          <div key={m.typeId} style={{ display: 'grid', gridTemplateColumns: '34px minmax(110px, 160px) 1fr 44px', gap: 10, alignItems: 'center', padding: '5px 0' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: t.palette.background, display: 'grid', placeItems: 'center' }}>
              <Mascot mascot={t.mascot} palette={t.palette} size={30} title={t.name} />
            </div>
            <div style={{ fontWeight: m.typeId === highlight ? 700 : 400, fontSize: '0.92rem' }}>{t.name}</div>
            <svg
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              height="16"
              width="100%"
              tabIndex={0}
              aria-label={`${t.name} ${pct} percent`}
              onMouseMove={(e) => tt.show(e, tip)}
              onMouseLeave={tt.hide}
              onFocus={(e) => tt.show(e.currentTarget, tip)}
              onBlur={tt.hide}
              style={{ display: 'block' }}
            >
              <rect x={0} y={2} width={100} height={6} rx={3} fill="var(--surface-2)" />
              <rect x={0} y={2} width={Math.max(pct, 1)} height={6} rx={3} fill={m.typeId === highlight ? 'var(--chart-1)' : 'var(--chart-muted)'} />
            </svg>
            <div style={{ textAlign: 'right', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
          </div>
        );
      })}
      {tt.node}
    </div>
  );
}
