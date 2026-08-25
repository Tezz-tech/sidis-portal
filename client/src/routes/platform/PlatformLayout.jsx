import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Tag, Receipt, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Organizations', icon: Building2, end: true },
  { to: '/admin/pricing', label: 'Pricing', icon: Tag },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
];

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-sheet flex">
      <aside className="fixed inset-y-0 left-0 w-[248px] bg-ink flex flex-col">
        <div className="h-16 flex items-center px-6">
          <span className="font-display text-paper text-[18px] tracking-wide">SIDIS</span>
          <span className="ml-2 text-label text-paper/50">platform</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-card text-body transition-colors duration-micro ${
                  isActive ? 'text-paper bg-white/5' : 'text-paper/60 hover:text-paper hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="platform-sidebar-active"
                      className="absolute left-0 top-1 bottom-1 w-[3px] bg-marker rounded-full"
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  <item.icon size={18} strokeWidth={1.5} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-small text-paper truncate">{user?.firstName} {user?.lastName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-card text-body text-paper/60 hover:text-paper hover:bg-white/5 transition-colors duration-micro"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[248px]">
        <div className="max-w-admin mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
