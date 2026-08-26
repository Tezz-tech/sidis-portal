import { Link, Outlet, useLocation } from 'react-router-dom';
import MarketingButton from './marketing/MarketingButton';

export default function PublicLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/accept-invite', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {!isAuthPage && (
        <header className="sticky top-0 z-40 bg-void/70 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-admin mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="font-grotesk text-[20px] font-bold tracking-tight text-white">
              Sidis<span className="text-lime">.</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-[15px] font-inter text-white/70">
              {[{ to: '/pricing', label: 'Pricing' }, { to: '/login', label: 'Sign in' }].map((item) => (
                <Link key={item.to} to={item.to} className="relative group py-1">
                  {item.label}
                  <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-lime transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>
            <MarketingButton as={Link} to="/request-workspace" size="md">
              Request a workspace
            </MarketingButton>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="bg-void border-t border-white/10">
          <div className="max-w-admin mx-auto px-6 py-16 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <p className="font-grotesk text-[20px] font-bold text-white mb-3">
                Sidis<span className="text-lime">.</span>
              </p>
              <p className="text-[14px] font-inter text-white/50 max-w-xs leading-relaxed">
                Turn a document into a finished, gradeable exam in minutes — powered by AI, built for real assessments.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-inter font-semibold tracking-widest text-white/40 uppercase mb-4">Product</p>
              <ul className="space-y-3 text-[14px] font-inter text-white/60">
                <li><Link to="/pricing" className="hover:text-white transition-colors duration-200">Pricing</Link></li>
                <li><Link to="/request-workspace" className="hover:text-white transition-colors duration-200">Request a workspace</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[12px] font-inter font-semibold tracking-widest text-white/40 uppercase mb-4">Account</p>
              <ul className="space-y-3 text-[14px] font-inter text-white/60">
                <li><Link to="/login" className="hover:text-white transition-colors duration-200">Sign in</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10">
            <div className="max-w-admin mx-auto px-6 py-6 text-[13px] font-inter text-white/40">
              &copy; {new Date().getFullYear()} Sidis
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
