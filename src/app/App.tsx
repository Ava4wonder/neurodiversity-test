import { useEffect, useState } from 'react';
import { content } from './content';
import { GearIcon } from './components/Icons';
import { load, save } from './lib/storage';
import { Home } from './pages/Home';
import { Lab } from './pages/Lab';
import { Method } from './pages/Method';
import { Results } from './pages/Results';
import { Task } from './pages/Task';
import { Test } from './pages/Test';
import { useRoute, useSession } from './state';

type Theme = 'auto' | 'light' | 'dark';
interface Prefs {
  theme: Theme;
  scale: number;
  spacing: 'normal' | 'wide';
}

function Settings({ prefs, setPrefs, onClose }: { prefs: Prefs; setPrefs: (p: Prefs) => void; onClose: () => void }) {
  return (
    <div className="settings-pop" role="dialog" aria-label="Display settings">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <b>Display</b>
        <button className="btn ghost small" onClick={onClose} aria-label="Close settings">
          ✕
        </button>
      </div>
      <div className="eyebrow">Theme</div>
      <div className="seg" style={{ margin: '6px 0 12px' }}>
        {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
          <button key={t} aria-pressed={prefs.theme === t} onClick={() => setPrefs({ ...prefs, theme: t })}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="eyebrow">Text size</div>
      <div className="seg" style={{ margin: '6px 0 12px' }}>
        {[1, 1.15, 1.3].map((s) => (
          <button key={s} aria-pressed={prefs.scale === s} onClick={() => setPrefs({ ...prefs, scale: s })}>
            {s === 1 ? 'A' : s === 1.15 ? 'A+' : 'A++'}
          </button>
        ))}
      </div>
      <div className="eyebrow">Spacing</div>
      <div className="seg" style={{ marginTop: 6 }}>
        {(['normal', 'wide'] as const).map((s) => (
          <button key={s} aria-pressed={prefs.spacing === s} onClick={() => setPrefs({ ...prefs, spacing: s })}>
            {s === 'normal' ? 'Normal' : 'Extra (easier reading)'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function App() {
  const [route, go] = useRoute();
  const version = content.testSet.meta.version;
  const { session, update, reset, setSession } = useSession(version);
  const [prefs, setPrefsState] = useState<Prefs>(() => load('ndtp.prefs', { theme: 'auto', scale: 1, spacing: 'normal' } as Prefs));
  const [showSettings, setShowSettings] = useState(false);

  const setPrefs = (p: Prefs) => {
    setPrefsState(p);
    save('ndtp.prefs', p);
  };
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', prefs.theme);
    root.style.setProperty('--text-scale', String(prefs.scale));
    root.setAttribute('data-spacing', prefs.spacing);
  }, [prefs]);

  const answered = Object.keys(session.responses).length;
  const hasResults = !!session.completedAt;
  const finishQuestionnaire = () => {
    const task = content.testSet.tasks.find((t) => t.type === 'go_nogo');
    if (task && !session.tasks.GNG && !session.taskSkipped) go('/task');
    else {
      update((s) => ({ ...s, completedAt: new Date().toISOString() }));
      go('/results');
    }
  };

  let page;
  switch (route) {
    case '/test':
      page = session.consent ? <Test session={session} update={update} onFinish={finishQuestionnaire} /> : null;
      if (!session.consent) setTimeout(() => go('/'), 0);
      break;
    case '/task':
      page = (
        <Task
          onComplete={(m) => {
            update((s) => ({ ...s, tasks: { ...s.tasks, GNG: m }, completedAt: new Date().toISOString() }));
            setTimeout(() => go('/results'), 400);
          }}
          onSkip={() => {
            update((s) => ({ ...s, taskSkipped: true, completedAt: new Date().toISOString() }));
            go('/results');
          }}
        />
      );
      break;
    case '/results':
      page = (
        <Results
          session={session}
          update={update}
          onStart={() => go('/')}
          onRetake={() => {
            reset();
            go('/');
          }}
        />
      );
      break;
    case '/method':
      page = <Method />;
      break;
    case '/lab':
      page = (
        <Lab
          onDemo={(s) => {
            setSession(s);
            go('/results');
          }}
        />
      );
      break;
    default:
      page = (
        <Home
          session={session}
          hasProgress={answered > 0}
          hasResults={hasResults}
          onConsent={(v) => update((s) => ({ ...s, consent: v }))}
          onStart={() => {
            if (answered > 0) {
              reset();
              update((s) => ({ ...s, consent: true }));
            }
            go('/test');
          }}
          onResume={() => go('/test')}
          onResults={() => go('/results')}
        />
      );
  }

  const nav = [
    { to: '/', label: 'Home' },
    { to: '/test', label: 'Test' },
    { to: '/results', label: 'Results' },
    { to: '/method', label: 'Method' },
    { to: '/lab', label: 'Lab' },
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner" style={{ position: 'relative' }}>
          <a className="brand" href="#/">
            <span className="brand-dot" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 64 64">
                <path d="M14 38c5-18 31-18 36 0" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" />
                <circle cx="22" cy="24" r="5" fill="white" />
                <circle cx="42" cy="24" r="5" fill="white" />
              </svg>
            </span>
            <span className="brand-text">ND Trait Profile</span>
          </a>
          <nav className="nav" aria-label="Main">
            {nav.map((n) => (
              <a key={n.to} href={`#${n.to}`} aria-current={route === n.to ? 'page' : undefined}>
                {n.label}
              </a>
            ))}
            <button className="navbtn" onClick={() => setShowSettings((v) => !v)} aria-label="Display settings" aria-expanded={showSettings}>
              <GearIcon />
            </button>
          </nav>
          {showSettings && <Settings prefs={prefs} setPrefs={setPrefs} onClose={() => setShowSettings(false)} />}
        </div>
      </header>
      <main>{page}</main>
      <footer className="site">
        {content.testSet.meta.title} · test set v{content.testSet.meta.version} · type set v{content.typeSet.meta.version} · scoring v
        {content.scoring.meta.version} · {content.testSet.meta.status}
        <br />A self-reflection tool, not a diagnostic instrument. Answers stay in your browser.
      </footer>
    </div>
  );
}
