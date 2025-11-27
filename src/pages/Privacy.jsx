import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Shield, Database, Lock, Eye, UserCheck, Mail } from 'lucide-react';

export default function Privacy() {
  const sections = [
    {
      icon: Shield,
      title: 'Introduction',
      content: 'Welcome to NutriSync. We are committed to protecting your privacy and being transparent about how we use your data. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal information.'
    },
    {
      icon: Database,
      title: 'Information We Collect',
      content: 'When you use NutriSync, we collect the following types of information:',
      list: [
        { label: 'Account Information', text: 'When you sign up using Google OAuth, we collect your email address and basic profile information (name, profile picture) from your Google account. This information is used solely for authentication purposes.' },
        { label: 'Nutrition Data', text: 'Meal logs, nutritional information, food photos you upload, and your personal nutrition goals.' },
        { label: 'Usage Data', text: 'Information about how you interact with our service, including pages visited and features used.' }
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: 'We use your information for the following purposes:',
      list: [
        { label: 'Authentication', text: 'Your Google account information is used only to verify your identity and allow you to securely access your NutriSync account.' },
        { label: 'Service Delivery', text: 'To provide you with nutrition tracking, meal analysis, and personalized insights.' },
        { label: 'AI Analysis', text: 'Food photos you upload are analyzed using Google Gemini AI to provide nutritional estimates. These images are processed temporarily and are not stored permanently by the AI service.' },
        { label: 'Improvement', text: 'To improve our services and develop new features based on usage patterns.' }
      ]
    },
    {
      icon: Lock,
      title: 'Google Data Usage',
      content: 'We use Google OAuth exclusively for authentication purposes. When you sign in with Google, we access only your basic profile information (email, name, profile picture) to create and authenticate your account. We do not access, store, or use any other Google services data (Gmail, Drive, Calendar, etc.). Your Google credentials are never stored on our servers.'
    },
    {
      icon: Database,
      title: 'Data Storage and Security',
      content: 'Your data is stored securely using Supabase, a secure cloud database service. We implement industry-standard security measures including encryption, secure authentication, and regular security audits to protect your information from unauthorized access, disclosure, alteration, or destruction.'
    },
    {
      icon: UserCheck,
      title: 'Your Rights',
      content: 'You have the following rights regarding your personal data:',
      list: [
        { label: 'Access', text: 'You can view all your stored data within your account dashboard.' },
        { label: 'Correction', text: 'You can update or correct your information at any time through your profile settings.' },
        { label: 'Deletion', text: 'You can delete your account and all associated data at any time through the account settings.' },
        { label: 'Export', text: 'You can request a copy of your data by contacting us.' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-heading font-bold text-white">NutriSync</span>
          </Link>
          <Link to="/login" className="btn-ghost text-sm">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 py-16"
      >
        <div className="mb-12">
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/50">Last updated: January 2025</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.section
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary-500" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-heading font-semibold text-white">{section.title}</h2>
                </div>
                <p className="text-white/70 leading-relaxed">{section.content}</p>
                {section.list && (
                  <ul className="mt-4 space-y-3">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-white">{item.label}:</span>
                          <span className="text-white/60 ml-1">{item.text}</span>
                        </div>
                      </li>
                    ))}
            </ul>
                )}
              </motion.section>
            );
          })}

          {/* Additional Sections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="card p-6"
          >
            <h2 className="text-xl font-heading font-semibold text-white mb-4">Data Sharing</h2>
            <p className="text-white/70 leading-relaxed mb-4">
              We do not sell, rent, or share your personal information with third parties for their marketing purposes. We only share your data in limited circumstances:
            </p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 mt-2 flex-shrink-0" />
                <div>
                  <span className="font-medium text-white">Service Providers:</span>
                  <span className="text-white/60 ml-1">We use trusted third-party services (Supabase for database, Google Gemini for AI analysis) that help us operate our service.</span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 mt-2 flex-shrink-0" />
                <div>
                  <span className="font-medium text-white">Legal Requirements:</span>
                  <span className="text-white/60 ml-1">We may disclose your information if required by law or in response to valid legal requests.</span>
                </div>
              </li>
            </ul>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Mail size={20} className="text-amber-400" strokeWidth={2} />
              </div>
              <h2 className="text-xl font-heading font-semibold text-white">Contact Us</h2>
            </div>
            <p className="text-white/70 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <a href="mailto:krishnet1@hotmail.com" className="text-primary-500 hover:text-primary-400 font-medium">
              krishnet1@hotmail.com
            </a>
          </motion.section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link to="/" className="btn-primary">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-white/40">
          <p>2025 NutriSync. Professional nutrition tracking.</p>
        </div>
      </footer>
    </div>
  );
}
