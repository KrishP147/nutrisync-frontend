import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  TrendingUp, 
  BarChart3, 
  Lightbulb,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/logging', label: 'Log Meals', icon: UtensilsCrossed },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/recommendations', label: 'AI Insights', icon: Lightbulb },
];

const bottomItems = [
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative
          ${active 
            ? 'text-white bg-primary-700/10' 
            : 'text-white/60 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-700 rounded-r"
          />
        )}
        <Icon size={20} strokeWidth={2} className="flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#0a0a0a] border border-white/10 text-white"
      >
        <Menu size={24} strokeWidth={2} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/80 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 260,
          x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -260 : 0
        }}
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto
          bg-[#0a0a0a] border-r border-white/10 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <img src="/logo.svg" alt="NutriSync" className="w-10 h-10 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-xl font-heading font-bold text-white whitespace-nowrap overflow-hidden"
                >
                  NutriSync
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/10 space-y-1">
          {bottomItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={20} strokeWidth={2} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/10 items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 lg:ml-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
