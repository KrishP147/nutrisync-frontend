import { useState } from 'react';
import { supabase } from '../supabaseClient';
import FoodSearchInput from './FoodSearchInput';

export default function ReplaceFoodModal({ food, onReplace, onClose }) {
  const [activeTab, setActiveTab] = useState('database'); // database, custom, create
  const [customFoods, setCustomFoods] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // For "Create New" tab
  const [newFoodName, setNewFoodName] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');
  const [newFiber, setNewFiber] = useState('');

  const loadCustomFoods = async () => {
    if (customFoods.length > 0) return; // Already loaded

    setLoadingCustom(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomFoods(data);
    }
    setLoadingCustom(false);
  };

  const handleDatabaseFoodSelect = (selectedFood) => {
    onReplace({
      name: selectedFood.name,
      base_calories: selectedFood.calories,
      base_protein_g: selectedFood.protein_g,
      base_carbs_g: selectedFood.carbs_g,
      base_fat_g: selectedFood.fat_g,
      base_fiber_g: selectedFood.fiber_g || 0,
      portion_size: food.portion_size, // Keep same portion
      portion_unit: 'g'
    });
  };

  const handleCustomFoodSelect = (customFood) => {
    onReplace({
      name: customFood.name,
      base_calories: customFood.base_calories,
      base_protein_g: customFood.base_protein_g,
      base_carbs_g: customFood.base_carbs_g,
      base_fat_g: customFood.base_fat_g,
      base_fiber_g: customFood.base_fiber_g,
      portion_size: food.portion_size, // Keep same portion
      portion_unit: 'g',
      custom_food_id: customFood.id
    });
  };

  const handleCreateNew = () => {
    if (!newFoodName || !newCalories) {
      alert('Please enter at least a name and calories');
      return;
    }

    onReplace({
      name: newFoodName,
      base_calories: parseInt(newCalories) || 0,
      base_protein_g: parseFloat(newProtein) || 0,
      base_carbs_g: parseFloat(newCarbs) || 0,
      base_fat_g: parseFloat(newFat) || 0,
      base_fiber_g: parseFloat(newFiber) || 0,
      portion_size: food.portion_size, // Keep same portion
      portion_unit: 'g'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Replace "{food.component_name || food.name}"
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Current portion: {Math.round(food.portion_size)}g • Will keep same portion size
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'database'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Database Foods
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              loadCustomFoods();
            }}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'custom'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            My Custom Foods
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'create'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
          {activeTab === 'database' && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Search USDA database for a food to replace with:
              </p>
              <FoodSearchInput onFoodSelect={handleDatabaseFoodSelect} />
            </div>
          )}

          {activeTab === 'custom' && (
            <div>
              {loadingCustom ? (
                <p className="text-center text-gray-500 py-8">Loading custom foods...</p>
              ) : customFoods.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">No custom foods saved yet</p>
                  <p className="text-sm text-gray-500">
                    Save custom foods by editing them and clicking "⭐ Save as Custom Food"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customFoods.map((customFood) => (
                    <button
                      key={customFood.id}
                      onClick={() => handleCustomFoodSelect(customFood)}
                      className="w-full text-left p-3 bg-purple-50 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-100 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">⭐ {customFood.name}</p>
                          {customFood.original_food_name && (
                            <p className="text-xs text-gray-500">Based on: {customFood.original_food_name}</p>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold text-purple-700">{customFood.base_calories} cal</p>
                          <p className="text-xs text-gray-600">per 100g</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-600">
                        <div>P: {customFood.base_protein_g}g</div>
                        <div>C: {customFood.base_carbs_g}g</div>
                        <div>F: {customFood.base_fat_g}g</div>
                        <div>Fiber: {customFood.base_fiber_g}g</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Create a new food (values per 100g):
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  value={newFoodName}
                  onChange={(e) => setNewFoodName(e.target.value)}
                  placeholder="e.g., Homemade Pizza"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories * (per 100g)
                  </label>
                  <input
                    type="number"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                    placeholder="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFat}
                    onChange={(e) => setNewFat(e.target.value)}
                    placeholder="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiber (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFiber}
                    onChange={(e) => setNewFiber(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateNew}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium mt-4"
              >
                ✅ Replace with This Food
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
