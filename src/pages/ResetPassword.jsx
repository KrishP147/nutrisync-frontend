import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BubbleBackground from '../components/ui/BubbleBackground';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };
    
    checkSession();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must include at least one special character');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
      } else {
        // Sign out the user so they can log in with new password
        await supabase.auth.signOut();
        setSuccess(true);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <BubbleBackground interactive={true}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm border-2 border-teal-300 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-black mb-2">Reset Password</h1>
            <div className="w-16 h-1 bg-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Enter your new password below</p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                ✓ Password updated successfully!
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition font-medium shadow-lg hover:shadow-xl"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black bg-white"
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Must be at least 8 characters with a special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black bg-white"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </BubbleBackground>
  );
}
