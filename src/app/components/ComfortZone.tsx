import { activeItems, formatOf, itemDimensions, itemWeight, type Responses } from '../../engine';
import { content, dimById } from '../content';
import { Cite, EvidenceBadge } from './Citations';
import { TopicIcon } from './Icons';

const labels = content.testSet.response_scale.labels;

function answerText(itemId: string, raw: number | undefined) {
  const item = content.testSet.items.find((i) => i.id === itemId)!;
  if (typeof raw !== 'number') return 'Not answered';
  const f = formatOf(item);
  if (f === 'choice') return item.options?.[raw]?.label ?? '';
  if (f === 'bipolar' && item.poles) {
    const [l, r] = item.poles;
    return ['Strongly: ' + l, 'Leaning: ' + l, 'In between', 'Leaning: ' + r, 'Strongly: ' + r][raw] ?? '';
  }
  return labels[raw];
}

/** "Your comfort zone": every everyday-preference answer, with how (or whether) it is scored. */
export function ComfortZone({ responses }: { responses: Responses }) {
  const prefs = activeItems(content).filter((i) => i.section === 'preferences');
  return (
    <div className="comfort">
      {prefs.map((item) => {
        const raw = responses[item.id];
        const dims = itemDimensions(item);
        const scored = itemWeight(content, item) > 0 && dims.length > 0;
        const f = formatOf(item);
        return (
          <div className="comfort-item" key={item.id}>
            <div className="head">
              <div className="icon">
                <TopicIcon name={item.icon} />
              </div>
              <div>
                <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{item.topic}</div>
                <div className="tiny muted">{item.id}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.95rem', minHeight: 44 }}>{answerText(item.id, raw)}</div>
            {f !== 'choice' && typeof raw === 'number' && (
              <div className="pos" aria-hidden>
                {[0, 1, 2, 3, 4].map((v) => (
                  <i key={v} className={v === raw ? 'on' : ''} />
                ))}
              </div>
            )}
            <div className="row tiny" style={{ gap: 6, marginTop: 6 }}>
              <EvidenceBadge level={item.evidence.level} />
              <span className="muted">{scored ? `feeds ${dims.map((d) => dimById.get(d)?.name).join(' + ')}` : 'descriptive only, not scored'}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <Cite refs={item.evidence.refs} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
