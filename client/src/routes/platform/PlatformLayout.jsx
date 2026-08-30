import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Tag, Receipt, ScrollText, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import sidisLogo from '../../assets/sidis-logo.png';

const NAV_ITEMS = [
  { to: '/admin', label: 'Organizations', icon: Building2, end: true },
  { to: '/admin/pricing', label: 'Pricing', icon: Tag },
  { to: '/admin/payments', label: 'Payments', icon: Receipt },
  { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
];

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-4 bg-white/5 backdrop-blur-2xl border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src={sidisLogo} alt="Sidis" className="h-8 w-auto" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">platform</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-2 px-6">
          <img src={sidisLogo} alt="Sidis" className="h-8 w-auto" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">platform</span>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
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

      <main className="flex-1 ml-0 md:ml-[248px] pt-16 md:pt-0">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
