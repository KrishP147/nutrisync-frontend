import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import BubbleBackground from '../components/ui/BubbleBackground';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
      } else {
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
            <h1 className="text-4xl font-bold text-black mb-2">Forgot Password?</h1>
            <div className="w-16 h-1 bg-teal-500 mx-auto mb-4"></div>
            <p className="text-gray-700">
              {success 
                ? "Check your email for a password reset link" 
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your email and click the link to reset your password.
              </div>
              <Link
                to="/login"
                className="block text-center text-teal-600 hover:underline font-medium"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-700">
                Remember your password?{' '}
                <Link to="/login" className="text-teal-600 hover:underline font-medium">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </BubbleBackground>
  );
}
