import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-6 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/assets/nutrisync-logo.png" alt="NutriSync Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-black">NutriSync</h1>
          </Link>
          <Link to="/login" className="text-gray-700 hover:text-gray-900 text-sm">
            Back to Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-4 py-12"
      >
        <h1 className="text-4xl font-bold text-black mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Introduction</h2>
            <p className="leading-relaxed">
              Welcome to NutriSync. We are committed to protecting your privacy and being transparent about how we use your data. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Information We Collect</h2>
            <p className="leading-relaxed mb-3">
              When you use NutriSync, we collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you sign up using Google OAuth, we collect your email address and basic profile information (name, profile picture) from your Google account. This information is used solely for authentication purposes.</li>
              <li><strong>Nutrition Data:</strong> Meal logs, nutritional information, food photos you upload, and your personal nutrition goals.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our service, including pages visited and features used.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">How We Use Your Information</h2>
            <p className="leading-relaxed mb-3">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authentication:</strong> Your Google account information is used only to verify your identity and allow you to securely access your NutriSync account.</li>
              <li><strong>Service Delivery:</strong> To provide you with nutrition tracking, meal analysis, and personalized insights.</li>
              <li><strong>AI Analysis:</strong> Food photos you upload are analyzed using Google Gemini AI to provide nutritional estimates. These images are processed temporarily and are not stored permanently by the AI service.</li>
              <li><strong>Improvement:</strong> To improve our services and develop new features based on usage patterns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Google Data Usage</h2>
            <p className="leading-relaxed">
              <strong>We use Google OAuth exclusively for authentication purposes.</strong> When you sign in with Google, we access only your basic profile information (email, name, profile picture) to create and authenticate your account. We do not access, store, or use any other Google services data (Gmail, Drive, Calendar, etc.). Your Google credentials are never stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Data Storage and Security</h2>
            <p className="leading-relaxed">
              Your data is stored securely using Supabase, a secure cloud database service. We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your information from unauthorized access, disclosure, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Data Sharing</h2>
            <p className="leading-relaxed mb-3">
              We do not sell, rent, or share your personal information with third parties for their marketing purposes. We only share your data in the following limited circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> We use trusted third-party services (Supabase for database, Google Gemini for AI analysis) that help us operate our service. These providers are contractually obligated to protect your data.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required by law or in response to valid legal requests.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> You can view all your stored data within your account dashboard.</li>
              <li><strong>Correction:</strong> You can update or correct your information at any time through your profile settings.</li>
              <li><strong>Deletion:</strong> You can delete your account and all associated data at any time through the account settings.</li>
              <li><strong>Export:</strong> You can request a copy of your data by contacting us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use essential cookies to maintain your login session and provide core functionality. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Children's Privacy</h2>
            <p className="leading-relaxed">
              NutriSync is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting a notice on our website or sending you an email. Your continued use of NutriSync after such changes constitutes your acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black mb-3">Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="mt-3 font-medium text-black">
              Email: krishnet1@hotmail.com
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            to="/"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-20">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 NutriSync. Built for better nutrition.</p>
        </div>
      </footer>
    </div>
  );
}
