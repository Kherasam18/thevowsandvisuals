import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Stories from './pages/Stories';
import StoryDetail from './pages/StoryDetail';
import Films from './pages/Films';
import Galleries from './pages/Galleries';
import Enquiry from './pages/Enquiry';
import About from './pages/About';
import { useContentStatus } from './content/ContentProvider';

// Split out of the public bundle: only the studio ever opens it.
const Admin = lazy(() => import('./admin/Admin.jsx'));

/** Where the admin actually runs. Only set on the public deployment. */
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? '';

/**
 * The admin, or a redirect to where it works.
 *
 * The same bundle is served by two hosts, but only one of them has the API
 * behind it. On the public site /admin would otherwise render a sign-in form
 * that cannot possibly succeed — the request for the session comes back as the
 * HTML page, and the failure reads like a bug rather than a wrong address.
 */
function AdminRoute() {
  if (ADMIN_URL) {
    try {
      const target = new URL(ADMIN_URL);
      if (target.host !== window.location.host) {
        window.location.replace(`${target.origin}/admin`);
        return null;
      }
    } catch {
      // A malformed value should not lock anyone out; fall through and load it.
    }
  }

  return (
    <Suspense fallback={<div className="p-8 font-sans text-sm text-neutral-500">Loading…</div>}>
      <Admin />
    </Suspense>
  );
}

/** Shown if the content document cannot be fetched at all. */
function ContentUnavailable({ error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
      <div>
        <h1 className="font-display text-2xl text-ink">The site content could not be loaded</h1>
        <p className="mx-auto mt-3 max-w-[48ch] font-serif text-[15px] leading-relaxed text-ink/70">
          {error?.message ?? 'Unknown error'}
        </p>
      </div>
    </div>
  );
}

/**
 * Marks a page being viewed from unpublished content.
 *
 * Without it a draft preview is indistinguishable from the live site, which is
 * how someone ends up believing a change is published when it is not.
 */
function PreviewBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-maroon px-4 py-2 text-center font-serif text-[13px] text-white">
      <span>You are viewing unpublished changes — visitors still see the live site.</span>
      <a href="/admin" className="underline underline-offset-2">
        Back to the dashboard
      </a>
      <a href={window.location.pathname} className="underline underline-offset-2">
        View the live version
      </a>
    </div>
  );
}

export default function App() {
  const { status, error, preview } = useContentStatus();

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminRoute />} />

      <Route
        element={
          status === 'error' ? (
            <ContentUnavailable error={error} />
          ) : (
            <>
              <Layout />
              {preview && <PreviewBar />}
            </>
          )
        }
      >
        <Route index element={<Home />} />
        <Route path="stories" element={<Stories />} />
        <Route path="stories/:slug" element={<StoryDetail />} />
        <Route path="films" element={<Films />} />
        <Route path="galleries" element={<Galleries />} />
        <Route path="enquiry" element={<Enquiry />} />
        <Route path="about" element={<About />} />
        {/* Unknown paths fall back to Home, mirroring the live site's behaviour. */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
