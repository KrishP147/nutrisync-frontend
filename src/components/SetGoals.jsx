import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function SetGoals({ onGoalsUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67
  });

  const [tempGoals, setTempGoals] = useState(goals);

  useEffect(() => {
    // Load goals from localStorage
    const savedGoals = localStorage.getItem('nutriSyncGoals');
    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoals(parsed);
      setTempGoals(parsed);
      if (onGoalsUpdate) onGoalsUpdate(parsed);
    }
  }, []);

  const handleSave = () => {
    setGoals(tempGoals);
    localStorage.setItem('nutriSyncGoals', JSON.stringify(tempGoals));
    if (onGoalsUpdate) onGoalsUpdate(tempGoals);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempGoals(goals);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-500 rounded-xl p-6 shadow-xl mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-black">Daily Goals</h2>
          <p className="text-sm text-gray-600 mt-1">Set your daily nutrition targets</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Edit Goals
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calories
              </label>
              <input
                type="number"
                step="100"
                value={tempGoals.calories}
                onChange={(e) => setTempGoals({ ...tempGoals, calories: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                step="20"
                value={tempGoals.protein}
                onChange={(e) => setTempGoals({ ...tempGoals, protein: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carbs (g)
              </label>
              <input
                type="number"
                step="20"
                value={tempGoals.carbs}
                onChange={(e) => setTempGoals({ ...tempGoals, carbs: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fat (g)
              </label>
              <input
                type="number"
                step="20"
                value={tempGoals.fat}
                onChange={(e) => setTempGoals({ ...tempGoals, fat: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Save Goals
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-300">
            <p className="text-3xl font-bold text-purple-600">{goals.calories}</p>
            <p className="text-sm text-gray-600 mt-1">Calories</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-300">
            <p className="text-3xl font-bold text-blue-600">{goals.protein}g</p>
            <p className="text-sm text-gray-600 mt-1">Protein</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-300">
            <p className="text-3xl font-bold text-orange-500">{goals.carbs}g</p>
            <p className="text-sm text-gray-600 mt-1">Carbs</p>
          </div>

          <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-300">
            <p className="text-3xl font-bold text-purple-600">{goals.fat}g</p>
            <p className="text-sm text-gray-600 mt-1">Fat</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

