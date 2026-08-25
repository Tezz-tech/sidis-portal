import { Link, Outlet, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';

export default function PublicLayout() {
  const location = useLocation();
  const isAuthPage = ['/login', '/accept-invite', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-sheet flex flex-col">
      {!isAuthPage && (
        <header className="border-b border-rule bg-paper">
          <div className="max-w-admin mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="font-display text-[20px] text-ink tracking-wide">SIDIS</Link>
            <nav className="hidden md:flex items-center gap-8 text-body text-graphite">
              <Link to="/pricing" className="hover:text-ink transition-colors duration-micro">Pricing</Link>
              <Link to="/login" className="hover:text-ink transition-colors duration-micro">Sign in</Link>
            </nav>
            <Button as={Link} to="/request-workspace" variant="marker" size="sm">
              Request a workspace
            </Button>
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {!isAuthPage && (
        <footer className="border-t border-rule bg-paper">
          <div className="max-w-admin mx-auto px-6 py-8 flex items-center justify-between text-small text-pencil">
            <span>Sidis</span>
            <span>&copy; {new Date().getFullYear()} Sidis</span>
          </div>
        </footer>
      )}
    </div>
  );
}
