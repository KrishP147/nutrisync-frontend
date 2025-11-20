import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function AccountMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!confirmDelete) {
      setError('Please confirm deletion by checking the box');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Re-authenticate user before deletion
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: deleteEmail,
        password: deletePassword,
      });

      if (signInError) {
        setError('Invalid credentials. Please enter correct email and password.');
        setLoading(false);
        return;
      }

      // Delete all user data first (meals, goals, etc.)
      await supabase.from('meals').delete().eq('user_id', user.id);
      await supabase.from('user_goals').delete().eq('user_id', user.id);

      // Delete the user account
      const { error: deleteError } = await supabase.rpc('delete_user');

      if (deleteError) {
        // Fallback: Just sign out if RPC not available
        console.error('Error deleting account:', deleteError);
        setError('Account data deleted. Please contact support to fully remove your account.');
        await supabase.auth.signOut();
        navigate('/');
      } else {
        await supabase.auth.signOut();
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDelete = async () => {
    setError('For Google accounts, please re-authenticate first by logging out and logging back in with Google, then try deleting again.');
  };

  return (
    <>
      {/* Account Menu Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 sm:ml-6 text-gray-700 hover:text-purple-700 font-medium text-sm transition flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border-2 border-purple-200 overflow-hidden z-50"
            >
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={() => {
                  navigate('/change-password');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 transition flex items-center gap-2 border-t border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 transition flex items-center gap-2 border-t border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition flex items-center gap-2 border-t border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-red-500"
            >
              <h2 className="text-2xl font-bold text-black mb-4">Delete Account</h2>
              <p className="text-gray-600 mb-6">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={deleteEmail}
                    onChange={(e) => setDeleteEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-black"
                    required
                  />
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="confirmDelete"
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="confirmDelete" className="text-sm text-gray-700">
                    I understand this action is permanent and will delete all my data
                  </label>
                </div>

                <div className="my-4 flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleDelete}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Delete with Google
                </button>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteEmail('');
                      setDeletePassword('');
                      setConfirmDelete(false);
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
