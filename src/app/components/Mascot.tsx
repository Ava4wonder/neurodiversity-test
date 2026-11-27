import type { Palette } from '../../engine';

// Hand-drawn SVG mascots, 200x200 viewBox, tinted with the type palette.
// Add a new mascot here AND to mascot-ids.ts (the validator checks both).

interface Props {
  mascot: string;
  palette: Palette;
  size?: number;
  /** render a <g> (for embedding in another SVG) instead of an <svg> */
  asGroup?: boolean;
  title?: string;
}

const WHITE = '#FFFFFF';

function Eye({ x, y, r = 9, ink, dx = 0, dy = 0 }: { x: number; y: number; r?: number; ink: string; dx?: number; dy?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={WHITE} />
      <circle cx={x + dx} cy={y + dy} r={r * 0.6} fill={ink} />
      <circle cx={x + dx - r * 0.22} cy={y + dy - r * 0.25} r={r * 0.2} fill={WHITE} />
    </g>
  );
}

function Cheeks({ y, x1, x2, color }: { y: number; x1: number; x2: number; color: string }) {
  return (
    <g opacity={0.45}>
      <ellipse cx={x1} cy={y} rx={9} ry={5.5} fill={color} />
      <ellipse cx={x2} cy={y} rx={9} ry={5.5} fill={color} />
    </g>
  );
}

function Smile({ x, y, w = 14, ink }: { x: number; y: number; w?: number; ink: string }) {
  return <path d={`M${x - w / 2} ${y} Q${x} ${y + w * 0.6} ${x + w / 2} ${y}`} stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />;
}

function Sparkle({ x, y, s = 8, color }: { x: number; y: number; s?: number; color: string }) {
  return (
    <path
      d={`M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`}
      fill={color}
    />
  );
}

function body(mascot: string, p: Palette) {
  const { primary: c1, secondary: c2, ink } = p;
  switch (mascot) {
    case 'hummingbird':
      return (
        <g>
          <Sparkle x={36} y={44} s={9} color={c2} />
          <Sparkle x={168} y={150} s={7} color={c2} />
          <Sparkle x={58} y={24} s={5} color={c1} />
          <g opacity={0.35} stroke={ink} strokeWidth={3} strokeLinecap="round">
            <path d="M40 92 L24 88" />
            <path d="M42 104 L20 104" />
          </g>
          <ellipse cx={70} cy={78} rx={15} ry={44} fill={c2} transform="rotate(-38 70 78)" />
          <ellipse cx={82} cy={72} rx={13} ry={38} fill={c2} opacity={0.7} transform="rotate(-62 82 72)" />
          <path d="M66 146 L34 172 L52 142 L28 150 L60 130 Z" fill={c1} />
          <ellipse cx={98} cy={122} rx={44} ry={34} fill={c1} transform="rotate(-24 98 122)" />
          <circle cx={122} cy={82} r={31} fill={c1} />
          <ellipse cx={124} cy={106} rx={17} ry={10} fill={c2} />
          <path d="M150 78 L194 69 L150 88 Z" fill={ink} strokeLinejoin="round" />
          <Eye x={128} y={76} r={9} ink={ink} dx={2} />
          <ellipse cx={112} cy={92} rx={7} ry={4.5} fill={c2} opacity={0.6} />
        </g>
      );
    case 'otter':
      return (
        <g>
          <g fill={c2}>
            <circle cx={150} cy={36} r={13} />
            <circle cx={166} cy={30} r={10} />
            <circle cx={136} cy={44} r={6} />
            <circle cx={128} cy={56} r={3.5} />
          </g>
          <Sparkle x={160} y={33} s={5} color={WHITE} />
          <ellipse cx={100} cy={172} rx={52} ry={30} fill={c1} />
          <ellipse cx={100} cy={176} rx={32} ry={20} fill={WHITE} opacity={0.75} />
          <circle cx={58} cy={70} r={12} fill={c1} />
          <circle cx={142} cy={70} r={12} fill={c1} />
          <circle cx={58} cy={70} r={6} fill={c2} />
          <circle cx={142} cy={70} r={6} fill={c2} />
          <circle cx={100} cy={104} r={52} fill={c1} />
          <ellipse cx={100} cy={128} rx={30} ry={20} fill={WHITE} opacity={0.85} />
          <Eye x={80} y={98} r={9} ink={ink} dx={1} dy={-3} />
          <Eye x={120} y={98} r={9} ink={ink} dx={1} dy={-3} />
          <path d="M93 116 Q100 112 107 116 Q104 123 100 124 Q96 123 93 116 Z" fill={ink} />
          <Smile x={100} y={129} w={12} ink={ink} />
          <g stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.5}>
            <path d="M72 124 L52 120" />
            <path d="M72 130 L54 133" />
            <path d="M128 124 L148 120" />
            <path d="M128 130 L146 133" />
          </g>
          <ellipse cx={78} cy={160} rx={13} ry={9} fill={c1} stroke={ink} strokeOpacity={0.15} strokeWidth={2} />
          <ellipse cx={122} cy={160} rx={13} ry={9} fill={c1} stroke={ink} strokeOpacity={0.15} strokeWidth={2} />
        </g>
      );
    case 'octopus':
      return (
        <g>
          {[
            'M62 112 Q38 140 48 166 Q54 180 40 186',
            'M80 120 Q70 150 80 172 Q86 186 74 194',
            'M100 122 Q100 156 102 176 Q104 192 94 196',
            'M120 120 Q130 150 122 172 Q118 186 130 192',
            'M138 112 Q162 136 154 162 Q150 178 164 184',
          ].map((d, i) => (
            <path key={i} d={d} stroke={c1} strokeWidth={17} fill="none" strokeLinecap="round" />
          ))}
          <g fill={c2}>
            <circle cx={47} cy={150} r={3} />
            <circle cx={77} cy={160} r={3} />
            <circle cx={101} cy={165} r={3} />
            <circle cx={124} cy={160} r={3} />
            <circle cx={156} cy={150} r={3} />
          </g>
          <path d="M48 98 Q48 36 100 36 Q152 36 152 98 Q152 124 100 124 Q48 124 48 98 Z" fill={c1} />
          <ellipse cx={80} cy={56} rx={12} ry={7} fill={WHITE} opacity={0.25} transform="rotate(-25 80 56)" />
          <Eye x={82} y={88} r={11} ink={ink} dx={2} />
          <Eye x={118} y={88} r={11} ink={ink} dx={2} />
          <Cheeks y={104} x1={70} x2={130} color={c2} />
          <Smile x={100} y={106} w={12} ink={ink} />
          <g>
            <path d="M158 132 L176 152" stroke={ink} strokeWidth={6} strokeLinecap="round" />
            <circle cx={150} cy={122} r={15} fill={WHITE} fillOpacity={0.5} stroke={ink} strokeWidth={5} />
          </g>
        </g>
      );
    case 'raccoon':
      return (
        <g>
          <Sparkle x={30} y={50} s={9} color={c2} />
          <Sparkle x={172} y={46} s={8} color={c1} />
          <Sparkle x={168} y={160} s={6} color={c2} />
          <Sparkle x={34} y={156} s={6} color={c1} />
          <path d="M50 78 L58 30 L92 60 Z" fill={c1} strokeLinejoin="round" />
          <path d="M150 78 L142 30 L108 60 Z" fill={c1} strokeLinejoin="round" />
          <path d="M60 66 L63 44 L80 59 Z" fill={c2} />
          <path d="M140 66 L137 44 L120 59 Z" fill={c2} />
          <ellipse cx={100} cy={110} rx={62} ry={52} fill={c1} />
          <path d="M40 104 Q70 80 100 98 Q130 80 160 104 Q150 126 124 122 Q108 118 100 110 Q92 118 76 122 Q50 126 40 104 Z" fill={ink} />
          <Eye x={78} y={104} r={10} ink={ink} dx={1} />
          <Eye x={122} y={104} r={10} ink={ink} dx={1} />
          <ellipse cx={100} cy={138} rx={26} ry={18} fill={WHITE} opacity={0.9} />
          <ellipse cx={100} cy={130} rx={9} ry={6} fill={ink} />
          <Smile x={100} y={140} w={12} ink={ink} />
          <g opacity={0.9}>
            <rect x={56} y={56} width={7} height={7} rx={1.5} fill={c2} transform="rotate(45 59.5 59.5)" />
            <rect x={137} y={56} width={7} height={7} rx={1.5} fill={c2} transform="rotate(45 140.5 59.5)" />
          </g>
        </g>
      );
    case 'fox':
      return (
        <g>
          <g>
            <path d="M150 8 L186 8 Q198 8 198 20 L198 36 Q198 48 186 48 L170 48 L160 58 L161 48 L150 48 Q138 48 138 36 L138 20 Q138 8 150 8 Z" fill={WHITE} stroke={ink} strokeOpacity={0.2} strokeWidth={2} />
            <circle cx={156} cy={28} r={3.5} fill={ink} />
            <circle cx={168} cy={28} r={3.5} fill={ink} />
            <circle cx={180} cy={28} r={3.5} fill={ink} />
          </g>
          <g transform="translate(-6 18) scale(0.88)">
            <path d="M42 86 L50 30 L86 64 Z" fill={c1} strokeLinejoin="round" />
            <path d="M158 86 L150 30 L114 64 Z" fill={c1} strokeLinejoin="round" />
            <path d="M52 72 L56 44 L76 62 Z" fill={c2} />
            <path d="M148 72 L144 44 L124 62 Z" fill={c2} />
            <path d="M36 90 Q100 40 164 90 Q160 130 128 156 Q112 170 100 172 Q88 170 72 156 Q40 130 36 90 Z" fill={c1} />
            <path d="M40 98 Q62 118 100 132 Q138 118 160 98 Q156 132 128 156 Q112 170 100 172 Q88 170 72 156 Q44 132 40 98 Z" fill={WHITE} opacity={0.9} />
            <Eye x={76} y={104} r={9} ink={ink} dx={1} />
            <Eye x={124} y={104} r={9} ink={ink} dx={1} />
            <ellipse cx={100} cy={142} rx={9} ry={6.5} fill={ink} />
            <Smile x={100} y={151} w={12} ink={ink} />
            <Cheeks y={126} x1={66} x2={134} color={c2} />
          </g>
        </g>
      );
    case 'parrot':
      return (
        <g>
          <g>
            <path d="M18 56 Q18 34 44 34 L66 34 Q88 34 88 56 Q88 76 66 76 L46 76 L34 90 L36 76 Q18 74 18 56 Z" fill={WHITE} stroke={ink} strokeOpacity={0.2} strokeWidth={2} />
            <text x={53} y={64} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={700} fontSize={24} fill={ink}>
              Aa
            </text>
          </g>
          <path d="M112 30 Q106 8 92 12 Q104 20 104 36 Z" fill={c2} />
          <path d="M124 32 Q130 6 146 10 Q132 20 128 38 Z" fill={c2} />
          <path d="M118 30 Q118 0 120 2 Q124 14 122 34 Z" fill={c1} />
          <path d="M86 170 L74 198 L96 176 L100 198 L106 172 Z" fill={c2} />
          <ellipse cx={110} cy={134} rx={42} ry={50} fill={c1} />
          <ellipse cx={92} cy={140} rx={18} ry={36} fill={ink} opacity={0.18} transform="rotate(12 92 140)" />
          <ellipse cx={118} cy={146} rx={22} ry={30} fill={c2} opacity={0.55} />
          <circle cx={118} cy={74} r={38} fill={c1} />
          <circle cx={108} cy={68} r={13} fill={WHITE} />
          <circle cx={110} cy={68} r={6} fill={ink} />
          <circle cx={108} cy={65.5} r={2} fill={WHITE} />
          <path d="M140 66 Q166 62 164 88 Q162 104 150 102 Q156 88 140 86 Z" fill={c2} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      );
    case 'penguin':
      return (
        <g transform="rotate(-6 100 110)">
          <g stroke="#7FB6E6" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.8}>
            <path d="M18 186 Q34 176 50 186 T82 186" />
            <path d="M120 190 Q136 180 152 190 T184 190" />
          </g>
          <ellipse cx={80} cy={180} rx={15} ry={7} fill={c2} />
          <ellipse cx={122} cy={180} rx={15} ry={7} fill={c2} />
          <ellipse cx={46} cy={118} rx={13} ry={36} fill={c1} transform="rotate(28 46 118)" />
          <ellipse cx={154} cy={110} rx={13} ry={36} fill={c1} transform="rotate(-46 154 110)" />
          <ellipse cx={100} cy={112} rx={52} ry={68} fill={c1} />
          <path d="M60 104 Q60 66 100 66 Q140 66 140 104 L140 130 Q140 172 100 172 Q60 172 60 130 Z" fill={WHITE} />
          <path d="M70 88 Q84 70 100 84 Q116 70 130 88" fill={c1} />
          <Eye x={84} y={96} r={9} ink={ink} dx={1} />
          <Eye x={116} y={96} r={9} ink={ink} dx={1} />
          <path d="M90 108 L110 108 L100 122 Z" fill={c2} strokeLinejoin="round" />
          <Cheeks y={114} x1={74} x2={126} color={c2} />
        </g>
      );
    case 'rabbit':
      return (
        <g>
          <g stroke={c1} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7}>
            <path d="M40 30 Q30 44 40 58" />
            <path d="M28 22 Q12 44 28 66" />
            <path d="M160 30 Q170 44 160 58" />
            <path d="M172 22 Q188 44 172 66" />
          </g>
          <ellipse cx={76} cy={56} rx={15} ry={44} fill={c1} transform="rotate(-10 76 56)" />
          <ellipse cx={124} cy={56} rx={15} ry={44} fill={c1} transform="rotate(10 124 56)" />
          <ellipse cx={76} cy={58} rx={7} ry={32} fill={c2} transform="rotate(-10 76 58)" />
          <ellipse cx={124} cy={58} rx={7} ry={32} fill={c2} transform="rotate(10 124 58)" />
          <ellipse cx={100} cy={178} rx={44} ry={22} fill={c1} />
          <circle cx={100} cy={124} r={50} fill={c1} />
          <ellipse cx={100} cy={142} rx={24} ry={16} fill={WHITE} opacity={0.85} />
          <Eye x={80} y={118} r={10} ink={ink} dx={1} />
          <Eye x={120} y={118} r={10} ink={ink} dx={1} />
          <path d="M94 134 L106 134 L100 141 Z" fill={c2} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M100 141 L100 148 M100 148 Q94 153 90 149 M100 148 Q106 153 110 149" stroke={ink} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Cheeks y={140} x1={66} x2={134} color={c2} />
        </g>
      );
    case 'turtle':
      return (
        <g>
          <ellipse cx={64} cy={160} rx={14} ry={12} fill={c2} />
          <ellipse cx={132} cy={160} rx={14} ry={12} fill={c2} />
          <path d="M30 140 L18 146 L32 150 Z" fill={c2} />
          <circle cx={164} cy={112} r={24} fill={c2} />
          <Eye x={170} y={106} r={7} ink={ink} dx={1} />
          <Smile x={170} y={120} w={10} ink={ink} />
          <path d="M28 146 Q28 64 98 64 Q168 64 168 146 Z" fill={c1} />
          <path d="M22 146 L174 146 Q174 158 160 158 L36 158 Q22 158 22 146 Z" fill={c1} />
          <path d="M22 146 L174 146" stroke={ink} strokeOpacity={0.25} strokeWidth={3} />
          <g stroke={c2} strokeWidth={3.5} fill="none" opacity={0.85} strokeLinejoin="round">
            <path d="M78 92 L118 92 L130 116 L118 140 L78 140 L66 116 Z" />
            <path d="M78 92 L62 76 M118 92 L134 76 M66 116 L40 116 M130 116 L156 116" />
          </g>
          <path d="M98 100 L104 116 L98 132 L92 116 Z" fill={WHITE} />
          <path d="M84 116 L98 112 L112 116 L98 120 Z" fill={c2} />
          <circle cx={98} cy={116} r={3} fill={ink} />
        </g>
      );
    case 'chameleon':
      return (
        <g>
          <path d="M150 168 L150 188" stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.3} />
          <path d="M20 170 L190 170" stroke={c2} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
          <path d="M52 134 Q20 140 22 112 Q24 90 46 96 Q62 102 54 116 Q48 124 40 116" stroke={c1} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d="M70 156 L64 172 M118 156 L124 172" stroke={c1} strokeWidth={10} strokeLinecap="round" />
          <path d="M54 130 Q60 86 108 84 Q140 82 150 96 L180 112 Q172 136 142 140 Q120 160 80 156 Q56 152 54 130 Z" fill={c1} />
          <g>
            <rect x={70} y={104} width={14} height={14} rx={4} fill={c2} />
            <rect x={88} y={96} width={12} height={12} rx={3.5} fill="#5BB6E6" />
            <rect x={90} y={122} width={14} height={14} rx={4} fill="#E7517B" />
            <rect x={108} y={108} width={12} height={12} rx={3.5} fill="#F2C14E" />
            <rect x={72} y={128} width={11} height={11} rx={3} fill="#8A6FDF" />
            <rect x={110} y={130} width={10} height={10} rx={3} fill={c2} />
          </g>
          <circle cx={148} cy={104} r={16} fill={c1} stroke={ink} strokeOpacity={0.2} strokeWidth={2} />
          <Eye x={150} y={104} r={9} ink={ink} dx={2} />
          <path d="M156 126 Q166 128 174 122" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />
        </g>
      );
    default:
      return <circle cx={100} cy={100} r={60} fill={c1} />;
  }
}

export function Mascot({ mascot, palette, size = 160, asGroup = false, title }: Props) {
  const g = body(mascot, palette);
  if (asGroup) return g;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={title ?? `${mascot} mascot`}>
      {g}
    </svg>
  );
}
