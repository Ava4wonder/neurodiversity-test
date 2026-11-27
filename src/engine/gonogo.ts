import { mulberry32, shuffle } from './rng';
import type { GoNoGoMetrics, GoNoGoParams } from './types';

export interface Trial {
  kind: 'go' | 'nogo';
  isiMs: number;
}

export interface TrialResult {
  kind: 'go' | 'nogo';
  /** reaction time in ms, or null if no response within the window */
  rtMs: number | null;
}

/** Deterministic trial sequence from the task params (same for everyone). */
export function buildTrials(p: GoNoGoParams, practice = false): Trial[] {
  const rand = mulberry32(p.seed + (practice ? 1 : 0));
  const n = practice ? p.practice_trials : p.trials;
  const nNogo = Math.round(n * p.nogo_ratio);
  const kinds: ('go' | 'nogo')[] = [...Array(n - nNogo).fill('go'), ...Array(nNogo).fill('nogo')];
  let seq = shuffle(kinds, rand);
  // never start with a no-go, and avoid 3 no-gos in a row
  for (let guard = 0; guard < 50; guard++) {
    const bad = seq[0] === 'nogo' || seq.some((k, i) => i >= 2 && k === 'nogo' && seq[i - 1] === 'nogo' && seq[i - 2] === 'nogo');
    if (!bad) break;
    seq = shuffle(kinds, rand);
  }
  const [lo, hi] = p.isi_ms;
  return seq.map((kind) => ({ kind, isiMs: Math.round(lo + rand() * (hi - lo)) }));
}

/** Compute task metrics. Anticipations (< anticipation_ms) count as no valid RT. */
export function computeGoNoGoMetrics(results: TrialResult[], p: GoNoGoParams): GoNoGoMetrics {
  const go = results.filter((r) => r.kind === 'go');
  const nogo = results.filter((r) => r.kind === 'nogo');
  const validRts = go
    .map((r) => r.rtMs)
    .filter((rt): rt is number => rt !== null && rt >= p.anticipation_ms);
  const omissions = go.filter((r) => r.rtMs === null).length;
  const commissions = nogo.filter((r) => r.rtMs !== null).length;
  const mean = validRts.reduce((a, b) => a + b, 0) / (validRts.length || 1);
  const sd = Math.sqrt(validRts.reduce((s, v) => s + (v - mean) ** 2, 0) / (validRts.length || 1));
  return {
    commission_rate: nogo.length ? commissions / nogo.length : 0,
    omission_rate: go.length ? omissions / go.length : 0,
    rt_mean_ms: Math.round(mean),
    rt_cv: mean > 0 ? sd / mean : 0,
    valid_go_trials: validRts.length,
    go_trials: go.length,
    nogo_trials: nogo.length,
  };
}
