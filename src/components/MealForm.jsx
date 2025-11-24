import { useState } from 'react';
import { supabase } from '../supabaseClient';
import FoodSearchInput from './FoodSearchInput';

export default function MealForm({ onMealAdded }) {
  const [mealType, setMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useAutocomplete, setUseAutocomplete] = useState(true);
  const [foods, setFoods] = useState([]);
  const [showFoodSearch, setShowFoodSearch] = useState(true);

  // For manual entry mode (single food, no autocomplete)
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [notes, setNotes] = useState('');
  const [saveAsCustom, setSaveAsCustom] = useState(false);

  const handleFoodSelect = (food) => {
    const newFood = {
      id: `food-${Date.now()}`,
      name: food.name,
      portion_size: 100,
      portion_display: '1',
      portion_unit: 'g',
      base_calories: food.calories,
      base_protein_g: food.protein_g,
      base_carbs_g: food.carbs_g,
      base_fat_g: food.fat_g,
      base_fiber_g: food.fiber_g || 0,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fat_g: food.fat_g,
      fiber_g: food.fiber_g || 0,
    };

    setFoods([...foods, newFood]);
    setShowFoodSearch(false);
  };

  const updateFoodQuantity = (index, inputValue) => {
    const updated = [...foods];
    const food = updated[index];

    updated[index] = { ...food, portion_display: inputValue };

    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      updated[index].portion_size = 0;
      updated[index].calories = 0;
      updated[index].protein_g = 0;
      updated[index].carbs_g = 0;
      updated[index].fat_g = 0;
      updated[index].fiber_g = 0;
      setFoods(updated);
      return;
    }

    const containsLetters = /[a-zA-Z]/.test(inputValue);
    let portionSize;

    if (containsLetters) {
      const numericValue = parseFloat(inputValue.replace(/[^\d.]/g, ''));
      portionSize = numericValue || 100;
    } else {
      const multiplier = parseFloat(inputValue);
      portionSize = isNaN(multiplier) ? 100 : multiplier * 100;
    }

    const multiplier = portionSize / 100;

    updated[index].portion_size = portionSize;
    updated[index].calories = Math.round(food.base_calories * multiplier);
    updated[index].protein_g = parseFloat((food.base_protein_g * multiplier).toFixed(1));
    updated[index].carbs_g = parseFloat((food.base_carbs_g * multiplier).toFixed(1));
    updated[index].fat_g = parseFloat((food.base_fat_g * multiplier).toFixed(1));
    updated[index].fiber_g = parseFloat((food.base_fiber_g * multiplier).toFixed(1));

    setFoods(updated);
  };

  const removeFood = (index) => {
    const updated = [...foods];
    updated.splice(index, 1);
    setFoods(updated);
    if (updated.length === 0) {
      setShowFoodSearch(true);
    }
  };

  const calculateTotals = () => {
    return {
      calories: foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (useAutocomplete && foods.length > 0) {
      // Multi-food mode with autocomplete
      const totals = calculateTotals();
      const isCompound = foods.length >= 2;
      
      // Calculate aggregate portion info for display in title
      const totalPortionSize = foods.reduce((sum, f) => sum + (f.portion_size || 100), 0);

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert([
          {
            user_id: user.id,
            meal_name: foods.map(f => f.name).join(', '),
            meal_type: mealType,
            total_calories: Math.round(totals.calories),
            total_protein_g: parseFloat(totals.protein_g.toFixed(1)),
            total_carbs_g: parseFloat(totals.carbs_g.toFixed(1)),
            total_fat_g: parseFloat(totals.fat_g.toFixed(1)),
            total_fiber_g: parseFloat(totals.fiber_g.toFixed(1)),
            is_compound: isCompound,
            portion_size: totalPortionSize,
            portion_unit: 'g',
            notes: notes || null,
          },
        ])
        .select();

      if (mealError) {
        setError(mealError.message);
        setLoading(false);
        return;
      }

      // Save components if compound
      if (isCompound && mealData[0]) {
        const components = foods.map(food => ({
          meal_id: mealData[0].id,
          component_name: food.name,
          portion_size: food.portion_size || 100,
          portion_unit: food.portion_unit || 'g',
          base_calories: food.base_calories,
          base_protein_g: food.base_protein_g,
          base_carbs_g: food.base_carbs_g,
          base_fat_g: food.base_fat_g,
          base_fiber_g: food.base_fiber_g || 0,
        }));

        await supabase.from('meal_components').insert(components);
      }

      // Reset form
      setFoods([]);
      setShowFoodSearch(true);
      setNotes('');
      setLoading(false);

      if (onMealAdded) onMealAdded(mealData[0]);
    } else {
      // Manual entry mode (single food)

      // Save as custom food if checkbox is checked
      if (saveAsCustom) {
        const { error: customFoodError } = await supabase
          .from('user_foods')
          .insert([{
            user_id: user.id,
            name: mealName,
            base_calories: parseInt(calories) || 0,
            base_protein_g: parseFloat(protein) || 0,
            base_carbs_g: parseFloat(carbs) || 0,
            base_fat_g: parseFloat(fat) || 0,
            base_fiber_g: parseFloat(fiber) || 0,
            source: 'manual_entry',
          }]);

        if (customFoodError) {
          console.error('Failed to save as custom food:', customFoodError);
          // Continue with meal logging even if custom food save fails
        }
      }

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
            notes: notes || null,
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
        setNotes('');
        setSaveAsCustom(false);
        setLoading(false);

        if (onMealAdded) onMealAdded(data[0]);
      }
    }
  };

  return (
    <div className="bg-white border-2 border-green-100 rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-black mb-4">Log a Meal</h2>

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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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

            {/* Show existing foods */}
            {foods.length > 0 && (
              <div className="space-y-2 mb-3">
                {foods.map((food, idx) => (
                  <div key={food.id} className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{food.name}</p>
                        <p className="text-xs text-gray-600">
                          Base: {food.base_calories} cal per 100g
                        </p>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs text-gray-600 mb-1">
                          Count (g or x)
                        </label>
                        <input
                          type="text"
                          value={food.portion_display}
                          onChange={(e) => updateFoodQuantity(idx, e.target.value)}
                          placeholder="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 text-black bg-white"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          {Math.round(food.calories)} cal
                        </p>
                        <p className="text-xs text-gray-600">
                          P: {food.protein_g.toFixed(1)}g
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFood(idx)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Totals display */}
                {foods.length >= 2 && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-700 mb-2">Total (Compound Meal):</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="font-semibold text-purple-900">{Math.round(calculateTotals().calories)}</p>
                        <p className="text-purple-600">Calories</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{calculateTotals().protein_g.toFixed(1)}g</p>
                        <p className="text-purple-600">Protein</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{calculateTotals().carbs_g.toFixed(1)}g</p>
                        <p className="text-purple-600">Carbs</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">{calculateTotals().fat_g.toFixed(1)}g</p>
                        <p className="text-purple-600">Fat</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add food button or search */}
            {showFoodSearch ? (
              <FoodSearchInput onFoodSelect={handleFoodSelect} />
            ) : (
              <button
                type="button"
                onClick={() => setShowFoodSearch(true)}
                className="w-full py-2 px-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-sm font-medium"
              >
                + Add Food
              </button>
            )}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              required
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
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
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="30"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
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
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
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
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
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
                  min="0"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                />
              </div>
            </div>

            {/* Save as Custom Food Checkbox */}
            <div className="mt-3 bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsCustom}
                  onChange={(e) => setSaveAsCustom(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-800">
                  ⭐ Save as Custom Food (reusable in future)
                </span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-6">
                This will save "{mealName || 'this food'}" to your custom foods library for quick access later
              </p>
            </div>
          </div>
        )}

        {/* Meal Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this meal..."
            maxLength={500}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {notes.length}/500 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || (useAutocomplete && foods.length === 0)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
        >
          {loading ? 'Logging meal...' : 'Log Meal'}
        </button>
      </form>
    </div>
  );
}
