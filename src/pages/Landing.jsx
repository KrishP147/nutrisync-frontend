import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import FloatingLines from '../components/ui/FloatingLines';

export default function Landing() {
  const features = [
    {
      title: "Track your meals in one place",
      description: "Log everything you eat with detailed nutritional information"
    },
    {
      title: "Analyze your meals with photos",
      description: "Snap a photo and get instant nutritional breakdowns"
    },
    {
      title: "Visualize your progress",
      description: "See your nutrition trends over time with beautiful charts"
    },
    {
      title: "Get personalized insights",
      description: "Receive smart recommendations based on your eating habits"
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle green lines background */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <FloatingLines
          linesGradient={['#86efac', '#4ade80', '#22c55e']}
          enabledWaves={['top', 'middle']}
          lineCount={[6, 8]}
          lineDistance={[8, 10]}
          animationSpeed={0.2}
          interactive={false}
          bendRadius={3.0}
          bendStrength={-0.3}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/assets/nutrisync-logo.png" alt="NutriSync Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-black">NutriSync</h1>
          </div>
          <Link to="/login" className="text-black hover:text-gray-700 text-sm text-right leading-tight">
            <span className="hidden sm:inline">Already have an account? Click here to login</span>
            <span className="sm:hidden">Already have<br />an account?</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center"
      >
        <h2 className="text-6xl md:text-7xl font-bold text-black mb-6">
          Your Nutrition,
          <br />
          <span className="text-green-500">Simplified</span>
        </h2>
        <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
          Track, analyze, and optimize your meals with intelligent nutrition tracking
        </p>
        <Link
          to="/register"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition shadow-lg hover:shadow-xl"
        >
          Get Started Free
        </Link>
      </motion.section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white border-2 border-green-100 rounded-xl p-8 hover:border-green-300 transition shadow-sm hover:shadow-md"
            >
              <div className="w-12 h-1 bg-green-500 mb-4"></div>
              <h3 className="text-2xl font-bold text-black mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center"
      >
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-12 border-2 border-green-200">
          <h3 className="text-4xl font-bold text-black mb-4">
            Ready to start your journey?
          </h3>
          <p className="text-xl text-gray-700 mb-8">
            Join thousands tracking their nutrition smarter
          </p>
          <Link
            to="/register"
            className="inline-block bg-black hover:bg-gray-800 text-white font-semibold px-10 py-4 rounded-lg text-lg transition"
          >
            Sign Up Now
          </Link>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 NutriSync. Built for better nutrition.</p>
        </div>
      </footer>
    </div>
  );
}

