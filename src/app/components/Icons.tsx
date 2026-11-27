// 24x24 stroke icons (currentColor).
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export function TopicIcon({ name, size = 22 }: { name?: string; size?: number }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true };
  switch (name) {
    case 'light':
      return (
        <svg {...s}>
          <path {...P} d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
        </svg>
      );
    case 'sound':
      return (
        <svg {...s}>
          <path {...P} d="M4 9v6h4l5 4V5L8 9H4ZM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      );
    case 'temperature':
      return (
        <svg {...s}>
          <path {...P} d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0ZM12 10v7" />
        </svg>
      );
    case 'humidity':
      return (
        <svg {...s}>
          <path {...P} d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
          <path {...P} d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5" />
        </svg>
      );
    case 'food':
      return (
        <svg {...s}>
          <path {...P} d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1-3 4-3 7s1 4 3 4" />
        </svg>
      );
    case 'movement':
      return (
        <svg {...s}>
          <circle {...P} cx="13" cy="4.5" r="1.8" />
          <path {...P} d="m9 21 2.5-6 2.5 2v4M7 12l3-4 4 1 2 3h3M11.5 15l1-6" />
        </svg>
      );
    case 'rhythm':
      return (
        <svg {...s}>
          <path {...P} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      );
    case 'workspace':
      return (
        <svg {...s}>
          <path {...P} d="M3 10h18M5 10v10M19 10v10M8 10V6h8v4M10 6V4h4v2" />
        </svg>
      );
    default:
      return (
        <svg {...s}>
          <circle {...P} cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function StatusIcon({ status }: { status: 'ok' | 'caution' | 'invalid' }) {
  const color = status === 'ok' ? 'var(--ok)' : status === 'caution' ? 'var(--caution)' : 'var(--critical)';
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" fill={color} />
      {status === 'ok' ? (
        <path d="m7.5 12.5 3 3 6-6" stroke="#fff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M12 7v6M12 16.5v.5" stroke={status === 'caution' ? '#3a2a00' : '#fff'} strokeWidth={2.4} strokeLinecap="round" />
      )}
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <circle {...P} cx="12" cy="12" r="3" />
      <path {...P} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
