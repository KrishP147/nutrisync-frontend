import { useState } from 'react';
import { supabase } from '../supabaseClient';
import FoodSearchInput from './FoodSearchInput';

export default function MealForm({ onMealAdded }) {
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useAutocomplete, setUseAutocomplete] = useState(true);

  const handleFoodSelect = (food) => {
    // Auto-populate form with selected food
    setMealName(food.name);
    setCalories(food.calories.toString());
    setProtein(food.protein_g.toString());
    setCarbs(food.carbs_g.toString());
    setFat(food.fat_g.toString());
    setFiber(food.fiber_g.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('meals')
      .insert([
        {
          user_id: user.id,
          meal_name: mealName,
          meal_type: mealType,
          total_calories: parseInt(calories) || 0,
          total_protein_g: parseFloat(protein) || 0,
          total_carbs_g: parseFloat(carbs) || 0,
          total_fat_g: parseFloat(fat) || 0,
          total_fiber_g: parseFloat(fiber) || 0,
        },
      ])
      .select();

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Reset form
      setMealName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('');
      setLoading(false);

      if (onMealAdded) onMealAdded(data[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Log a Meal</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meal Type
          </label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        {useAutocomplete ? (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Search Food
              </label>
              <button
                type="button"
                onClick={() => setUseAutocomplete(false)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Enter manually
              </button>
            </div>
            <FoodSearchInput
              onFoodSelect={handleFoodSelect}
              initialValue={mealName}
            />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Meal Name
              </label>
              <button
                type="button"
                onClick={() => setUseAutocomplete(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Search database
              </button>
            </div>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g., Chicken breast with rice"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calories
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="500"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Protein (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="30"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carbs (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="50"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fat (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="15"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fiber (g) - Optional
            </label>
            <input
              type="number"
              step="0.1"
              value={fiber}
              onChange={(e) => setFiber(e.target.value)}
              placeholder="5"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Logging meal...' : 'Log Meal'}
        </button>
      </form>
    </div>
  );
}
