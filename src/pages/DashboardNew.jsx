import { useState } from 'react';
import Navigation from '../components/Navigation';
import DailySummaryNew from '../components/DailySummaryNew';
import WeeklyTrends from '../components/WeeklyTrends';
import Recommendations from '../components/Recommendations';
import MealList from '../components/MealList';
import FloatingLines from '../components/ui/FloatingLines';
import Prism from '../components/ui/Prism';
import { motion } from 'motion/react';

export default function DashboardNew() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-dark-primary relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          <FloatingLines
            linesGradient={['#22c55e', '#16a34a', '#15803d']}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={[8, 12, 10]}
            lineDistance={[6, 5, 7]}
            animationSpeed={0.4}
            interactive={true}
            bendRadius={5.0}
            bendStrength={-0.5}
          />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10">
          <Prism
            animationType="rotate"
            timeScale={0.3}
            height={3.5}
            baseWidth={5.5}
            scale={4}
            hueShift={2.5}
            colorFrequency={1}
            noise={0.3}
            glow={0.8}
          />
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-matrix-green-400 mb-2">
            Welcome to NutriSync
          </h1>
          <p className="text-dark-secondary text-lg">
            Your intelligent nutrition tracking companion
          </p>
        </motion.div>

        {/* Daily Summary */}
        <DailySummaryNew key={refreshTrigger} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-8"
          >
            <Recommendations key={refreshTrigger} />
          </motion.div>

          {/* Right Column - Analytics & Meals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-8"
          >
            <WeeklyTrends key={refreshTrigger} />
            <MealList refreshTrigger={refreshTrigger} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
