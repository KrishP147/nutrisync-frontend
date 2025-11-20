import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import BubbleBackground from '../components/ui/BubbleBackground';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
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

        // Require at least one special character (non-alphanumeric).
        // Use regex.test — String.includes doesn't accept regex.
        if (!/[^A-Za-z0-9]/.test(password)) {
            setError('Password must include at least one special character');
            return;
        }

        setLoading(true);
        try {
                    const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                setError(signUpError.message);
                setLoading(false);
            } else {
                alert('Registration successful! Please check your email to confirm your account.');
                navigate('/login');
            }

            /*// On success, you might want to require email confirmation.
            // Redirecting to dashboard for now.
            navigate('/dashboard'); */

        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BubbleBackground interactive={true}>
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white/95 backdrop-blur-sm border-2 border-teal-300 p-8 rounded-2xl shadow-2xl max-w-md w-full">
                    <div className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-black mb-2">Create an account</h1>
                        <div className="w-16 h-1 bg-teal-500 mx-auto mb-4"></div>
                        <p className="text-gray-700">Start tracking your nutrition today with NutriSync</p>
                    </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black bg-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black bg-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-black bg-white"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-medium shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-700">
                    Already have an account?{' '}
                    <Link to="/login" className="text-teal-600 hover:underline font-medium">
                        Log in
                    </Link>
                </p>
                </div>
            </div>
        </BubbleBackground>
    );
}