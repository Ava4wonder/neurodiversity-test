import { useCallback, useState, type ReactNode } from 'react';

/** Lightweight hover/focus tooltip. Tooltips enhance; every value is also in a table. */
export function useTooltip() {
  const [tip, setTip] = useState<{ x: number; y: number; content: ReactNode } | null>(null);
  const show = useCallback((e: { clientX: number; clientY: number } | Element, content: ReactNode) => {
    if (e instanceof Element) {
      const r = e.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.top, content });
    } else setTip({ x: e.clientX, y: e.clientY, content });
  }, []);
  const hide = useCallback(() => setTip(null), []);
  const node = tip ? (
    <div
      className="chart-tooltip"
      role="tooltip"
      style={{
        left: Math.min(tip.x + 14, window.innerWidth - 270),
        top: Math.max(tip.y - 12, 8),
        transform: 'translateY(-100%)',
      }}
    >
      {tip.content}
    </div>
  ) : null;
  return { show, hide, node };
}
