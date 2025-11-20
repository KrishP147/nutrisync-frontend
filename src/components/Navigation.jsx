import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import TrueFocus from './ui/TrueFocus';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/logging', label: 'Log Meals', icon: '🍽️' },
    { path: '/progress', label: 'Progress', icon: '📈' },
  ];

  return (
    <nav className="glass-card sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="text-3xl"
            >
              🥗
            </motion.div>
            <TrueFocus
              sentence="NutriSync"
              separator=""
              manualMode={false}
              blurAmount={3}
              borderColor="#22c55e"
              glowColor="rgba(34, 197, 94, 0.6)"
              animationDuration={0.8}
              pauseBetweenAnimations={2}
            />
          </Link>

          {/* Nav Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-matrix-green-900/50 text-matrix-green-400'
                      : 'text-dark-secondary hover:text-matrix-green-400 hover:bg-dark-secondary/30'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </motion.div>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-matrix-green-400"
                  />
                )}
              </Link>
            ))}

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="ml-4 px-4 py-2 text-dark-secondary hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
            >
              🚪 Logout
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
