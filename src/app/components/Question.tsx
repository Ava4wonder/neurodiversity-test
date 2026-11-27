import type { Item } from '../../engine';
import { content } from '../content';

interface Props {
  id: string;
  text: string;
  item?: Item; // undefined for attention checks (agreement scale)
  value: number | undefined;
  onChange: (v: number) => void;
  index: number;
}

const labels = content.testSet.response_scale.labels;
const values = content.testSet.response_scale.values;

/** One question: agreement scale (likert), two-pole scale (bipolar) or option list (choice). */
export function Question({ id, text, item, value, onChange, index }: Props) {
  const format = item?.format ?? 'likert';
  const answered = typeof value === 'number';
  const qid = `q-${id}`;

  if (format === 'choice' && item?.options) {
    return (
      <div className={`question ${answered ? 'answered' : ''}`} id={qid}>
        <p className="qtext" id={`${qid}-t`}>
          <span className="sr-only">Question {index + 1}. </span>
          {text}
        </p>
        <div className="choices" role="radiogroup" aria-labelledby={`${qid}-t`}>
          {item.options.map((o, i) => (
            <label key={i} className={`choice ${value === i ? 'selected' : ''}`}>
              <input type="radio" name={qid} checked={value === i} onChange={() => onChange(i)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  const [left, right] = format === 'bipolar' && item?.poles ? item.poles : [labels[0], labels[labels.length - 1]];
  return (
    <div className={`question ${answered ? 'answered' : ''}`} id={qid}>
      <p className="qtext" id={`${qid}-t`}>
        <span className="sr-only">Question {index + 1}. </span>
        {text}
      </p>
      <div className="scale" role="radiogroup" aria-labelledby={`${qid}-t`}>
        <span className="pole left" aria-hidden>
          {format === 'bipolar' ? left : 'Disagree'}
        </span>
        {values.map((v, i) => (
          <label key={v} className={`dot s${i}`} title={format === 'bipolar' ? undefined : labels[i]}>
            <input
              type="radio"
              name={qid}
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              aria-label={format === 'bipolar' ? `${i + 1} of ${values.length}: ${i === 0 ? left : i === values.length - 1 ? right : i === 2 ? 'in between' : i < 2 ? `closer to "${left}"` : `closer to "${right}"`}` : labels[i]}
            />
            <span />
          </label>
        ))}
        <span className="pole right" aria-hidden>
          {format === 'bipolar' ? right : 'Agree'}
        </span>
      </div>
      <div className="scale-labels" aria-hidden>
        <span>{format === 'bipolar' ? left : 'Disagree'}</span>
        <span>{format === 'bipolar' ? right : 'Agree'}</span>
      </div>
    </div>
  );
}
