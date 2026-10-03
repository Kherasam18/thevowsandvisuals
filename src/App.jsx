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

export default function App() {
  const { status, error } = useContentStatus();

  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="p-8 font-sans text-sm text-neutral-500">Loading…</div>}>
            <Admin />
          </Suspense>
        }
      />

      <Route
        element={
          status === 'error' ? <ContentUnavailable error={error} /> : <Layout />
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
