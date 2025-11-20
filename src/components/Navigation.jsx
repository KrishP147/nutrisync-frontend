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
    <nav className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-500 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">NutriSync</span>
          </Link>

          {/* Nav Links + Logout */}
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
                      ? 'bg-purple-200 text-purple-900 font-medium'
                      : 'text-gray-700 hover:text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </motion.div>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                  />
                )}
              </Link>
            ))}

            {/* Logout Button - Small & Red */}
            <button
              onClick={handleLogout}
              className="ml-6 text-red-600 hover:text-red-700 font-medium text-sm transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
