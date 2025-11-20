import { useState } from 'react';
import Navigation from '../components/Navigation';
import MealForm from '../components/MealForm';
import PhotoMealUpload from '../components/PhotoMealUpload';
import MealList from '../components/MealList';
import BackgroundBeamsWithCollision from '../components/ui/BackgroundBeamsWithCollision';
import { motion } from 'motion/react';

export default function Logging() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <BackgroundBeamsWithCollision>
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-black mb-2">Log Your Meals</h1>
          <p className="text-gray-600">Track your nutrition throughout the day</p>
        </motion.div>

        {/* Logging Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PhotoMealUpload onMealAdded={handleMealAdded} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MealForm onMealAdded={handleMealAdded} />
          </motion.div>
        </div>

        {/* Logged Today Section - Scrollable Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-black mb-4">Logged Today</h2>
          <div className="bg-gradient-to-br from-green-100 via-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-400 shadow-xl max-h-[600px] overflow-y-auto custom-scrollbar-light">
            <MealList 
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealAdded}
              onMealUpdated={handleMealAdded}
              limit={20}
              variant="light-purple"
            />
          </div>
        </motion.div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
