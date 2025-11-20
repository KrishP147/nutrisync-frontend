import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useGoals } from '../contexts/GoalsContext';
import UserProfile from './UserProfile';

export default function SetGoals() {
  const { goals, updateGoals, loading } = useGoals();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempGoals, setTempGoals] = useState(goals);

  // Update tempGoals when goals change from context
  useEffect(() => {
    setTempGoals(goals);
  }, [goals]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateGoals(tempGoals);
      
      if (success) {
        setIsEditing(false);
      } else {
        alert('Failed to save goals. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <p className="text-sm text-gray-600 mt-1">Set your daily nutrition targets manually or calculate from profile</p>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <UserProfile />
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              ✏️ Edit Manually
            </button>
          </div>
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
                value={tempGoals.calories === 0 ? '' : tempGoals.calories}
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
                value={tempGoals.protein === 0 ? '' : tempGoals.protein}
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
                value={tempGoals.carbs === 0 ? '' : tempGoals.carbs}
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
                value={tempGoals.fat === 0 ? '' : tempGoals.fat}
                onChange={(e) => setTempGoals({ ...tempGoals, fat: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-black"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Goals'}
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

