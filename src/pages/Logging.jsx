import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, PenLine } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import MealForm from '../components/MealForm';
import PhotoMealUpload from '../components/PhotoMealUpload';
import MealList from '../components/MealList';

export default function Logging() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('photo');

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-heading font-bold text-white"
          >
            Log Meals
          </motion.h1>
          <p className="text-white/50 mt-1">Track your nutrition throughout the day</p>
        </div>

        {/* Logging Method Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'photo' 
                ? 'bg-primary-700 text-white' 
                : 'bg-surface-300 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            <Camera size={20} strokeWidth={2} />
            Photo Analysis
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'manual' 
                ? 'bg-primary-700 text-white' 
                : 'bg-surface-300 text-white/60 hover:text-white border border-white/10'
            }`}
          >
            <PenLine size={20} strokeWidth={2} />
            Manual Entry
          </button>
        </div>

        {/* Logging Form */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'photo' ? (
            <PhotoMealUpload onMealAdded={handleMealAdded} />
          ) : (
            <MealForm onMealAdded={handleMealAdded} />
          )}
        </motion.div>

        {/* Logged Today Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-heading font-semibold text-white mb-4">Logged Today</h2>
          <div className="card p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            <MealList 
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealAdded}
              onMealUpdated={handleMealAdded}
              limit={20}
            />
          </div>
        </motion.div>
      </div>
    </Sidebar>
  );
}
