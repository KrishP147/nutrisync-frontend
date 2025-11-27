import { useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { motion, AnimatePresence } from 'motion/react';
import { Target, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import UserProfile from './UserProfile';

export default function SetGoals() {
  const { goals, updateGoals } = useGoals();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempGoals, setTempGoals] = useState({
    calories: goals.calories || 2000,
    protein: goals.protein || 150,
    carbs: goals.carbs || 250,
    fat: goals.fat || 65,
    fiber: goals.fiber || 30,
  });

  const handleSave = async () => {
    await updateGoals(tempGoals);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTempGoals({
      calories: goals.calories || 2000,
      protein: goals.protein || 150,
      carbs: goals.carbs || 250,
      fat: goals.fat || 65,
      fiber: goals.fiber || 30,
    });
    setIsExpanded(false);
  };

  return (
    <div className="card overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
            <Target size={20} className="text-primary-500" strokeWidth={2} />
          </div>
          <div className="text-left">
            <h3 className="font-heading font-semibold text-white">Daily Goals</h3>
            <p className="text-white/50 text-sm">
              {goals.calories} kcal | {goals.protein}g P | {goals.carbs}g C | {goals.fat}g F | {goals.fiber}g Fiber
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <UserProfile />
          <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} className="text-white/60" />
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 border-t border-white/10">
              <p className="text-white/50 text-sm mb-6">
                Set your daily nutrition targets manually, or use the Profile button above to calculate them automatically.
              </p>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {/* Calories */}
                <div>
                  <label className="input-label">Calories</label>
                  <input
                    type="number"
                    min="0"
                    value={tempGoals.calories}
                    onChange={(e) => setTempGoals({ ...tempGoals, calories: parseInt(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </div>

                {/* Protein */}
                <div>
                  <label className="input-label">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempGoals.protein}
                    onChange={(e) => setTempGoals({ ...tempGoals, protein: parseInt(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </div>

                {/* Carbs */}
                <div>
                  <label className="input-label">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempGoals.carbs}
                    onChange={(e) => setTempGoals({ ...tempGoals, carbs: parseInt(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </div>

                {/* Fat */}
                <div>
                  <label className="input-label">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempGoals.fat}
                    onChange={(e) => setTempGoals({ ...tempGoals, fat: parseInt(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </div>

                {/* Fiber */}
                <div>
                  <label className="input-label">Fiber (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={tempGoals.fiber}
                    onChange={(e) => setTempGoals({ ...tempGoals, fiber: parseInt(e.target.value) || 0 })}
                    className="input text-center font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={handleSave} className="btn-primary">
                  <Save size={18} />
                  Save Goals
                </button>
                <button onClick={handleCancel} className="btn-ghost">
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
