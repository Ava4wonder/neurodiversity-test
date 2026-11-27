import { activeItems, formatOf } from './load';
import { keyValue, scaleBounds } from './score';
import type { Content, Session, Validity, ValidityRuleResult, ValidityStatus } from './types';

const rank: Record<ValidityStatus, number> = { ok: 0, caution: 1, invalid: 2 };

function level(n: number, caution: number, invalid: number): ValidityStatus {
  if (n >= invalid) return 'invalid';
  if (n >= caution) return 'caution';
  return 'ok';
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Step 6 of the scoring mechanism: response-quality checks. */
export function checkValidity(content: Content, session: Session): Validity {
  const cfg = content.scoring.validity;
  const { min, max } = scaleBounds(content);
  const itemById = new Map(content.testSet.items.map((i) => [i.id, i]));
  const rules: ValidityRuleResult[] = [];

  // 1. attention checks
  const checks = content.testSet.attention_checks;
  const failed = checks.filter((c) => session.responses[c.id] !== c.expected_value);
  rules.push({
    rule: 'attention_checks',
    status: level(failed.length, cfg.attention_checks.caution_if_failed, cfg.attention_checks.invalid_if_failed),
    detail: `${checks.length - failed.length} of ${checks.length} attention checks answered as instructed.`,
  });

  // 2. consistency pairs (opposite-keyed items about the same behaviour)
  const cp = cfg.consistency_pairs;
  let flagged = 0;
  let evaluated = 0;
  for (const [a, b] of cp.pairs) {
    const ia = itemById.get(a);
    const ib = itemById.get(b);
    const ra = session.responses[a];
    const rb = session.responses[b];
    if (!ia || !ib || typeof ra !== 'number' || typeof rb !== 'number') continue;
    evaluated++;
    const gap = Math.abs(keyValue(ra, ia.keyed ?? 'forward', min, max) - keyValue(rb, ib.keyed ?? 'forward', min, max));
    if (gap >= cp.flag_if_keyed_gap_at_least) flagged++;
  }
  rules.push({
    rule: 'consistency',
    status: level(flagged, cp.caution_if_flagged, cp.invalid_if_flagged),
    detail: `${flagged} of ${evaluated} paired statements answered in contradictory ways.`,
  });

  // 3. straight-lining (agreement-scale items only)
  const order = session.presentedOrder ?? activeItems(content).map((i) => i.id);
  const scored = order.filter((id) => {
    const it = itemById.get(id);
    return !!it && formatOf(it) === 'likert' && typeof session.responses[id] === 'number';
  });
  const values = scored.map((id) => session.responses[id]);
  let longest = 0;
  let run = 0;
  values.forEach((v, i) => {
    run = i > 0 && v === values[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1);
  const sd = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length || 1));
  const sl = cfg.straightlining;
  const slStatus: ValidityStatus =
    values.length === 0 ? 'ok' : sd < sl.min_response_sd ? 'invalid' : longest >= sl.max_identical_run ? 'caution' : 'ok';
  rules.push({
    rule: 'straightlining',
    status: slStatus,
    detail: `Longest run of identical answers: ${longest}. Answer spread (SD): ${sd.toFixed(2)}.`,
  });

  // 4. speed
  const times = Object.entries(session.timings ?? {})
    .filter(([id]) => itemById.has(id))
    .map(([, ms]) => ms / 1000);
  if (times.length >= 10) {
    const med = median(times);
    const sp = cfg.speed;
    const status: ValidityStatus =
      med < sp.invalid_median_seconds_per_item ? 'invalid' : med < sp.caution_median_seconds_per_item ? 'caution' : 'ok';
    rules.push({ rule: 'speed', status, detail: `Median time per statement: ${med.toFixed(1)} s.` });
  } else {
    rules.push({ rule: 'speed', status: 'ok', detail: 'Timing data not available; speed not checked.' });
  }

  const status = rules.reduce<ValidityStatus>((w, r) => (rank[r.status] > rank[w] ? r.status : w), 'ok');
  return { status, rules };
}
