import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Tag, Receipt, ScrollText, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Organizations', icon: Building2, end: true },
  { to: '/admin/pricing', label: 'Pricing', icon: Tag },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
  { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
];

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <aside className="fixed inset-y-0 left-0 w-[248px] bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-6">
          <span className="text-lg font-black text-white tracking-tight">
            Sidis<span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">.</span>
          </span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">platform</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="platform-sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-pink-600/20 border border-orange-500/30"
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  <item.icon size={18} strokeWidth={1.75} className="relative" />
                  <span className="relative">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm text-white truncate">{user?.firstName} {user?.lastName}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors duration-200"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-[248px]">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
