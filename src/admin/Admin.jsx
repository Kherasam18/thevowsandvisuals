import { createContext, useContext, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useAdminStore } from './store';
import { Button } from './ui';
import SignIn from './SignIn';
import DashboardPanel from './panels/DashboardPanel';
import LibraryPanel from './panels/LibraryPanel';
import HomePanel from './panels/HomePanel';
import StoriesPanel from './panels/StoriesPanel';
import FilmsPanel from './panels/FilmsPanel';
import GalleriesPanel from './panels/GalleriesPanel';
import AboutPanel from './panels/AboutPanel';
import PagesPanel from './panels/PagesPanel';

const AdminContext = createContext(null);

export function useAdmin() {
  const store = useContext(AdminContext);
  if (!store) throw new Error('useAdmin must be used inside the admin');
  return store;
}

const NAV = [
  { to: '', label: 'Overview', end: true },
  { to: 'home', label: 'Home page' },
  { to: 'stories', label: 'Stories' },
  { to: 'films', label: 'Films' },
  { to: 'galleries', label: 'Galleries' },
  { to: 'about', label: 'About' },
  { to: 'pages', label: 'Enquire & Footer' },
  { to: 'library', label: 'All photos' },
];

function SaveState({ status, dirty, error }) {
  if (status === 'error') return <span className="text-sm text-red-600">Not saved — {error}</span>;
  if (status === 'saving') return <span className="text-sm text-neutral-500">Saving…</span>;
  if (dirty) return <span className="text-sm text-neutral-500">Unsaved changes…</span>;
  return <span className="text-sm text-neutral-400">All changes saved</span>;
}

export default function Admin() {
  const store = useAdminStore();
  const [publishState, setPublishState] = useState(null);

  const { content, status, error, meta, dirty, auth } = store;

  if (auth.status === 'checking') {
    return <div className="p-10 text-sm text-neutral-500">Loading…</div>;
  }

  if (auth.status === 'signed-out') {
    return <SignIn onSignIn={store.signIn} configured={auth.configured} />;
  }

  if (status === 'loading') {
    return <div className="p-10 text-sm text-neutral-500">Loading…</div>;
  }

  if (!content) {
    return (
      <div className="p-10">
        <h1 className="text-lg font-semibold text-neutral-900">The admin could not start</h1>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const onPublish = async () => {
    setPublishState('working');
    try {
      const published = await store.publish();
      setPublishState(`Published version ${published.version}`);
      setTimeout(() => setPublishState(null), 4000);
    } catch (err) {
      setPublishState(`Could not publish — ${err.message}`);
    }
  };

  const warnings = meta?.warnings ?? [];
  const canPublish = warnings.length === 0 && publishState !== 'working';

  return (
    <AdminContext.Provider value={store}>
      <div className="min-h-screen bg-neutral-100 text-neutral-900">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
            <div>
              <h1 className="text-sm font-semibold">The Vows and Visuals</h1>
              <p className="text-xs text-neutral-500">Website content</p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <SaveState status={status} dirty={dirty} error={error} />
              {meta?.hasUnpublishedChanges && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-800">
                  Not yet live
                </span>
              )}
              {/* Preview renders the real pages from the draft, so a change
                  can be checked before it reaches anyone. */}
              <a
                href="/?preview=draft"
                target="_blank"
                rel="noreferrer"
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                Preview changes
              </a>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                View live site
              </a>
              <Button variant="primary" onClick={onPublish} disabled={!canPublish}>
                {publishState === 'working' ? 'Publishing…' : 'Publish'}
              </Button>
              <Button
                variant="ghost"
                onClick={store.signOut}
                title={auth.email ? `Signed in as ${auth.email}` : undefined}
              >
                Sign out
              </Button>
            </div>
          </div>

          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-5 pb-2">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded px-3 py-1.5 text-sm transition-colors ${
                    isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {publishState && publishState !== 'working' && (
          <p className="bg-neutral-900 px-5 py-2 text-center text-sm text-white">{publishState}</p>
        )}

        {warnings.length > 0 && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5">
            <div className="mx-auto max-w-6xl text-sm text-amber-900">
              <strong className="font-medium">Fix before publishing:</strong>
              <ul className="mt-0.5 list-inside list-disc">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-5 py-6">
          <Routes>
            <Route index element={<DashboardPanel />} />
            <Route path="home" element={<HomePanel />} />
            <Route path="stories" element={<StoriesPanel />} />
            <Route path="films" element={<FilmsPanel />} />
            <Route path="galleries" element={<GalleriesPanel />} />
            <Route path="about" element={<AboutPanel />} />
            <Route path="pages" element={<PagesPanel />} />
            <Route path="library" element={<LibraryPanel />} />
          </Routes>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
