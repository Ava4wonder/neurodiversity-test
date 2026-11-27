import { useCallback, useEffect, useState } from 'react';
import { load, remove, save } from './lib/storage';
import type { GoNoGoMetrics, Responses, Timings } from '../engine';

export interface SessionState {
  version: string;
  consent: boolean;
  responses: Responses;
  timings: Timings;
  presentedOrder: string[];
  tasks: { GNG?: GoNoGoMetrics };
  taskSkipped: boolean;
  startedAt?: string;
  completedAt?: string;
  research: { diagnoses: string[]; ageBand: string };
}

const KEY = 'ndtp.session.v1';

export const emptySession = (version: string): SessionState => ({
  version,
  consent: false,
  responses: {},
  timings: {},
  presentedOrder: [],
  tasks: {},
  taskSkipped: false,
  research: { diagnoses: [], ageBand: '' },
});

/** Session state persisted to localStorage (cleared if the test-set version changes). */
export function useSession(version: string) {
  const [session, setSession] = useState<SessionState>(() => {
    const stored = load<SessionState | null>(KEY, null);
    return stored && stored.version === version ? { ...emptySession(version), ...stored } : emptySession(version);
  });
  useEffect(() => save(KEY, session), [session]);
  const update = useCallback((fn: (s: SessionState) => SessionState) => setSession((s) => fn(s)), []);
  const reset = useCallback(() => {
    remove(KEY);
    setSession(emptySession(version));
  }, [version]);
  return { session, update, reset, setSession };
}

// ---------------------------------------------------------------- hash router
export function useRoute(): [string, (to: string) => void] {
  const get = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => {
      setRoute(get());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((to: string) => {
    window.location.hash = to;
  }, []);
  return [route, go];
}
