import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, UtensilsCrossed, TrendingUp, BarChart3, Lightbulb, User, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/logging', label: 'Log Meals', icon: UtensilsCrossed },
    { path: '/progress', label: 'Progress', icon: TrendingUp },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/recommendations', label: 'AI Tips', icon: Lightbulb },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-[#0a0a0a] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-heading font-bold text-white hidden sm:block">NutriSync</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'bg-primary-700/20 text-primary-500'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span className="hidden md:inline text-sm font-medium">{item.label}</span>
                  </motion.div>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                    />
                  )}
                </Link>
              );
            })}

            {/* Profile & Logout */}
            <Link
              to="/profile"
              className="ml-2 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              <User size={18} strokeWidth={2} />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
