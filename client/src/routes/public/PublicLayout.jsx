import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import MarketingButton from './marketing/MarketingButton';
import sidisLogo from '../../assets/sidis-logo.png';

const NAV_LINKS = [
  { to: '/pricing', label: 'Pricing' },
  { to: '/login', label: 'Sign in' },
];

export default function PublicLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = ['/login', '/accept-invite', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black flex flex-col">
      {!isAuthPage && (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-950 via-gray-900 to-black backdrop-blur-xl bg-opacity-90 border-b border-orange-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="group flex items-center">
              <img src={sidisLogo} alt="Sidis" className="h-9 w-auto transition-transform duration-300 group-hover:scale-110" />
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              {NAV_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="relative group text-gray-300 hover:text-white font-medium transition-colors duration-300">
                  {item.label}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-pink-600 group-hover:w-full transition-all duration-500" />
                </Link>
              ))}
            </nav>

            <div className="hidden md:block">
              <MarketingButton to="/request-workspace" size="md">
                Request a workspace
              </MarketingButton>
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden overflow-hidden bg-gray-950/95 backdrop-blur-3xl border-t border-white/10"
              >
                <div className="px-4 py-6 space-y-3">
                  {NAV_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full text-center py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <MarketingButton to="/request-workspace" className="w-full" onClick={() => setMobileOpen(false)}>
                    Request a workspace
                  </MarketingButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="bg-gradient-to-t from-black via-gray-950 to-gray-900 border-t border-orange-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <img src={sidisLogo} alt="Sidis" className="h-9 w-auto mb-4" />
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                Turn a document into a finished, gradeable exam in minutes — powered by AI, built for real assessments.
              </p>
            </div>
            <div>
              <p className="text-orange-400 font-black tracking-wider text-sm uppercase mb-4">Product</p>
              <ul className="space-y-3 text-sm">
                <li><Link to="/pricing" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block">Pricing</Link></li>
                <li><Link to="/request-workspace" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block">Request a workspace</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-orange-400 font-black tracking-wider text-sm uppercase mb-4">Account</p>
              <ul className="space-y-3 text-sm">
                <li><Link to="/login" className="text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-block">Sign in</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400">
              <span>&copy; {new Date().getFullYear()} Sidis</span>
              <Link to="/terms" className="hover:text-white transition-colors duration-300">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors duration-300">Privacy</Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
