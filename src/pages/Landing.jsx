import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Camera, 
  BarChart3, 
  Target, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Utensils
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Camera,
      title: "AI-Powered Photo Analysis",
      description: "Simply snap a photo of your meal and let our AI instantly analyze nutritional content with clinical precision.",
      color: "primary"
    },
    {
      icon: BarChart3,
      title: "Visual Analytics Dashboard",
      description: "Transform your nutrition data into actionable insights with professional-grade charts and trend analysis.",
      color: "secondary"
    },
    {
      icon: Target,
      title: "Personalized Goals",
      description: "Set and track custom nutrition targets based on your health objectives and lifestyle requirements.",
      color: "amber"
    },
    {
      icon: Zap,
      title: "Smart Recommendations",
      description: "Receive AI-driven suggestions to optimize your diet and fill nutritional gaps automatically.",
      color: "primary"
    }
  ];

  const stats = [
    { value: "10k+", label: "Meals Tracked", color: "text-primary-500" },
    { value: "95%", label: "Accuracy Rate", color: "text-secondary-500" },
    { value: "24/7", label: "AI Analysis", color: "text-amber-500" }
  ];

  const benefits = [
    "Track macros and micronutrients with precision",
    "AI-powered meal recognition and analysis",
    "Comprehensive progress visualization",
    "Personalized dietary recommendations",
    "Secure cloud sync across all devices",
    "Export detailed nutrition reports"
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-heading font-bold text-white">NutriSync</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-white/70 hover:text-white transition-colors font-medium">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Full viewport with background image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/stock photo 1.jpg"
            alt="Healthy nutrition"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-700/10 border border-primary-700/30 text-primary-500 text-sm font-medium mb-8">
              <Zap size={16} />
              Professional Nutrition Tracking
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-white mb-6 leading-tight">
              Your Nutrition,
              <br />
              <span className="text-primary-500">Visualized</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Medical-grade meal tracking and analysis. Transform your nutrition data into actionable health insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-4xl md:text-5xl font-mono font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-white/50 text-sm mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-surface-300">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Powerful Features
            </h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Everything you need to track, analyze, and optimize your nutrition journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const colorClasses = {
                primary: 'bg-primary-700/10 text-primary-500 border-primary-700/30',
                secondary: 'bg-secondary-500/10 text-secondary-400 border-secondary-500/30',
                amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              };

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card-hover p-8"
                >
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 border ${colorClasses[feature.color]}`}>
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-heading font-semibold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Image Section - Track Progress */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/stock photo 2.jpg"
            alt="Fresh healthy food"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 max-w-7xl mx-auto px-6"
        >
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-primary-700/20 border border-primary-700/30 text-primary-500 text-sm font-medium mb-6">
              <TrendingUp size={16} />
              Progress Tracking
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Track Your Progress
            </h2>
            <p className="text-xl text-white/70 leading-relaxed mb-8">
              Monitor your nutrition metrics in real-time. See exactly how your diet impacts your health goals with comprehensive data visualization and trend analysis.
            </p>
            <Link to="/register" className="btn-primary">
              Start Tracking
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
                Everything You Need for
                <span className="text-secondary-500"> Data-Driven </span>
                Nutrition
              </h2>
              <p className="text-xl text-white/60 mb-10 leading-relaxed">
                NutriSync provides professional-grade tools to understand your eating patterns, identify nutritional gaps, and optimize your diet for peak performance.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary-700/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-primary-500" />
                    </div>
                    <span className="text-white/80">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock dashboard preview */}
              <div className="card p-6 glow-green">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary-700/20 flex items-center justify-center">
                    <Utensils size={24} className="text-primary-500" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Today's Nutrition</h4>
                    <p className="text-white/50 text-sm">2,150 / 2,400 kcal</p>
                  </div>
                </div>
                
                {/* Mock progress bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Protein</span>
                      <span className="text-primary-500 font-mono">145g / 180g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-primary-700" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Carbs</span>
                      <span className="text-amber-500 font-mono">220g / 280g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-amber-500" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Fat</span>
                      <span className="text-secondary-500 font-mono">65g / 80g</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill bg-secondary-500" style={{ width: '81%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-surface-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="card p-12 md:p-16 border-primary-700/30 glow-green">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Ready to Transform Your Nutrition?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Join thousands of users who track their nutrition with professional-grade precision
            </p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4">
              Get Started Free
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white/60 text-sm">
              2025 NutriSync. Professional nutrition tracking.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>|</span>
            <a href="mailto:support@nutrisync.app" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
