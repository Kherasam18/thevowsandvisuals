import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Shared page chrome. The Home hero sits *behind* the header, so Home renders
 * its own overlay Navbar and opts out of the one here.
 */
export default function Layout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  // Restore top-of-page on client-side navigation, matching real page loads.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      {!isHome && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
