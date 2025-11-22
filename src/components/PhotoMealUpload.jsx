import { useState } from 'react';
import { supabase } from '../supabaseClient';
import api from '../services/api';
import FoodSearchInput from './FoodSearchInput';

export default function PhotoMealUpload({ onMealAdded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [mealType, setMealType] = useState('');
  const [editableResult, setEditableResult] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [mealMultiplier, setMealMultiplier] = useState(1);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setMealType('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setMealType('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const analyzeImage = async () => {
    if (!selectedFile) return;
    if (!mealType) {
      setError('Please select a meal type first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setDebugInfo(`Starting... File: ${selectedFile.name}, Size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB, Type: ${selectedFile.type}`);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setDebugInfo('Uploading to backend...');

      const response = await api.post('/api/analyze-meal-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      setDebugInfo('Success!');

      // Transform API response to include base values and portions
      const transformedFoods = response.data.foods.map(food => ({
        ...food,
        base_calories: food.calories,
        base_protein_g: food.protein_g,
        base_carbs_g: food.carbs_g,
        base_fat_g: food.fat_g,
        base_fiber_g: food.fiber_g || 0,
        portion_size: 100, // Default to 100g
        portion_display: food.portion || '100g', // Use AI-estimated portion
        portion_unit: 'g',
      }));

      const resultData = {
        ...response.data,
        foods: transformedFoods,
        meal_type: mealType
      };

      setResult(resultData);
      setEditableResult(resultData);
    } catch (err) {
      const errorMsg = `Error: ${err.message}\nStatus: ${err.response?.status}\nDetail: ${err.response?.data?.detail || err.response?.data?.error || 'No detail'}\nBackend URL: ${err.config?.baseURL || 'unknown'}`;
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to analyze image');
      setDebugInfo(errorMsg);
      console.error('Full error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateFoodQuantity = (index, inputValue) => {
    const updated = { ...editableResult };
    const food = updated.foods[index];

    // Store the display value
    updated.foods[index] = { ...food, portion_display: inputValue };

    // Handle empty input
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      updated.foods[index].portion_size = 0;
      updated.foods[index].calories = 0;
      updated.foods[index].protein_g = 0;
      updated.foods[index].carbs_g = 0;
      updated.foods[index].fat_g = 0;
      updated.foods[index].fiber_g = 0;
      
      // Recalculate totals
      updated.total_nutrition = {
        calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
        protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
        carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
        fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
        fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
      };
      
      setEditableResult(updated);
      return;
    }

    // Smart input parsing: check if input contains letters (unit)
    const containsLetters = /[a-zA-Z]/.test(inputValue);
    let portionSize;

    if (containsLetters) {
      // Extract numeric value from input (e.g., "150g" -> 150)
      const numericValue = parseFloat(inputValue.replace(/[^\d.]/g, ''));
      portionSize = numericValue || 100;
    } else {
      // Pure number - treat as multiplier (e.g., "2" -> 200g)
      const multiplier = parseFloat(inputValue);
      portionSize = isNaN(multiplier) ? 100 : multiplier * 100;
    }

    const multiplier = (portionSize / 100) * mealMultiplier;

    // Update portion size and recalculate macros
    updated.foods[index].portion_size = portionSize;
    updated.foods[index].calories = Math.round(food.base_calories * multiplier);
    updated.foods[index].protein_g = parseFloat((food.base_protein_g * multiplier).toFixed(1));
    updated.foods[index].carbs_g = parseFloat((food.base_carbs_g * multiplier).toFixed(1));
    updated.foods[index].fat_g = parseFloat((food.base_fat_g * multiplier).toFixed(1));
    updated.foods[index].fiber_g = parseFloat((food.base_fiber_g * multiplier).toFixed(1));

    // Recalculate totals
    updated.total_nutrition = {
      calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };

    setEditableResult(updated);
  };

  const updateMealMultiplier = (multiplierValue) => {
    const multiplier = parseFloat(multiplierValue) || 1;
    setMealMultiplier(multiplier);

    if (!editableResult) return;

    const updated = { ...editableResult };

    // Apply multiplier to all foods
    updated.foods = updated.foods.map(food => ({
      ...food,
      calories: Math.round(food.base_calories * (food.portion_size / 100) * multiplier),
      protein_g: parseFloat((food.base_protein_g * (food.portion_size / 100) * multiplier).toFixed(1)),
      carbs_g: parseFloat((food.base_carbs_g * (food.portion_size / 100) * multiplier).toFixed(1)),
      fat_g: parseFloat((food.base_fat_g * (food.portion_size / 100) * multiplier).toFixed(1)),
      fiber_g: parseFloat((food.base_fiber_g * (food.portion_size / 100) * multiplier).toFixed(1)),
    }));

    // Recalculate totals
    updated.total_nutrition = {
      calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };

    setEditableResult(updated);
  };

  const updateFood = (index, field, value) => {
    const updated = { ...editableResult };
    updated.foods[index][field] = value;

    // If updating base values, recalculate current values
    if (field.startsWith('base_')) {
      const multiplier = updated.foods[index].portion_size / 100;
      const baseField = field.replace('base_', '');
      updated.foods[index][baseField] = parseFloat(value) * multiplier;
    }

    // Recalculate totals
    updated.total_nutrition = {
      calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };

    setEditableResult(updated);
  };

  const removeFood = (index) => {
    const updated = { ...editableResult };
    updated.foods.splice(index, 1);

    // Recalculate totals
    updated.total_nutrition = {
      calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };

    setEditableResult(updated);
  };

  const addManualFood = () => {
    setShowFoodSearch(true);
  };

  const handleFoodSelect = (food) => {
    const updated = { ...editableResult };
    updated.foods.push({
      name: food.name,
      portion: food.portion || '100g',
      portion_size: 100,
      portion_display: '1', // Default to "1" (representing 100g)
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
      confidence: 1.0,
    });

    // Recalculate totals
    updated.total_nutrition = {
      calories: updated.foods.reduce((sum, f) => sum + (parseFloat(f.calories) || 0), 0),
      protein_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.protein_g) || 0), 0),
      carbs_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.carbs_g) || 0), 0),
      fat_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fat_g) || 0), 0),
      fiber_g: updated.foods.reduce((sum, f) => sum + (parseFloat(f.fiber_g) || 0), 0),
    };

    setEditableResult(updated);
    setShowFoodSearch(false);
  };

  const saveMeal = async () => {
    if (!editableResult) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create the meal as a compound food
      // Calculate aggregate portion info for display in title
      const totalPortionSize = editableResult.foods.reduce((sum, f) => sum + (f.portion_size || 100), 0);
      
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert([
          {
            user_id: user.id,
            meal_name: editableResult.foods.map(f => f.name).join(', '),
            meal_type: editableResult.meal_type,
            total_calories: Math.round(editableResult.total_nutrition.calories),
            total_protein_g: parseFloat(editableResult.total_nutrition.protein_g.toFixed(1)),
            total_carbs_g: parseFloat(editableResult.total_nutrition.carbs_g.toFixed(1)),
            total_fat_g: parseFloat(editableResult.total_nutrition.fat_g.toFixed(1)),
            total_fiber_g: parseFloat(editableResult.total_nutrition.fiber_g.toFixed(1)),
            is_ai_analyzed: true,
            is_compound: editableResult.foods.length > 1,
            portion_size: totalPortionSize,
            portion_unit: 'g',
            notes: editableResult.recommendations,
          },
        ])
        .select();

      if (mealError) throw mealError;

      // Save individual components if it's a compound food
      if (editableResult.foods.length > 1 && mealData[0]) {
        const components = editableResult.foods.map(food => ({
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

        const { error: componentsError } = await supabase
          .from('meal_components')
          .insert(components);

        if (componentsError) {
          console.error('Failed to save components:', componentsError);
          // Continue anyway - meal is saved
        }
      }

      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setResult(null);
      setEditableResult(null);
      setMealType('');

      if (onMealAdded) onMealAdded(mealData[0]);
    } catch (e) {
      console.error(e);
      setError('Failed to save meal: ' + e.message);
    }
  };

  return (
    <div className="bg-white border-2 border-green-100 rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-black mb-4">📸 Photo Analysis</h2>

      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm mb-4 text-center">
          <p className="text-gray-700">🔄 Analyzing your meal...</p>
        </div>
      )}

      {!preview && !result && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-600 mb-2">Drop an image here or click to upload</p>
            <p className="text-sm text-gray-500">Supported: JPG, PNG, HEIC</p>
          </label>
        </div>
      )}

      {preview && !result && (
        <div>
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full rounded-lg mb-4 max-h-64 object-cover" />
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
                setMealType('');
              }}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition shadow-lg"
              title="Remove photo"
            >
              ✕
            </button>
          </div>

          {/* Meal Type Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Meal Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`py-2 px-4 rounded-lg border-2 transition capitalize ${
                    mealType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-blue-300 text-black'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={analyzeImage}
              disabled={analyzing || !mealType}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? '🔍 Analyzing...' : '📸 Analyze Photo'}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
                setMealType('');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}

      {editableResult && (
        <div className="space-y-4">
          <div className="relative">
            <img src={preview} alt="Analyzed" className="w-full rounded-lg max-h-48 object-cover" />
            <button
              onClick={() => {
                setResult(null);
                setEditableResult(null);
                setSelectedFile(null);
                setPreview(null);
                setMealType('');
              }}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition shadow-lg"
              title="Remove photo"
            >
              ✕
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Detected Foods:</h3>
              <button
                onClick={addManualFood}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                + Add Food
              </button>
            </div>

            {/* Meal Multiplier */}
            <div className="mb-3 bg-white p-3 rounded border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Meal Multiplier:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={mealMultiplier}
                  onChange={(e) => updateMealMultiplier(e.target.value)}
                  placeholder="1"
                  className="flex-1 px-3 py-1.5 border border-purple-300 rounded focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <span className="text-xs text-gray-600 whitespace-nowrap">(×{mealMultiplier} of all items)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use this to multiply the entire meal (e.g., 2 = double all portions, 0.5 = half)
              </p>
            </div>

            {showFoodSearch && (
              <div className="mb-3">
                <FoodSearchInput onFoodSelect={handleFoodSelect} />
                <button
                  onClick={() => setShowFoodSearch(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}

            <ul className="space-y-2">
              {editableResult.foods.map((food, idx) => (
                <li key={idx} className="bg-white p-3 rounded border border-blue-200">
                  {editingIndex === idx ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={food.name}
                        onChange={(e) => updateFood(idx, 'name', e.target.value)}
                        placeholder="Food name"
                        className="w-full px-2 py-1 border rounded"
                      />
                      <p className="text-xs text-gray-600">Edit base values (per 100{food.portion_unit}):</p>
                      <div className="grid grid-cols-5 gap-2">
                        <input
                          type="number"
                          value={food.base_calories}
                          onChange={(e) => updateFood(idx, 'base_calories', parseFloat(e.target.value) || 0)}
                          placeholder="Cal"
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={food.base_protein_g}
                          onChange={(e) => updateFood(idx, 'base_protein_g', parseFloat(e.target.value) || 0)}
                          placeholder="Protein"
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={food.base_carbs_g}
                          onChange={(e) => updateFood(idx, 'base_carbs_g', parseFloat(e.target.value) || 0)}
                          placeholder="Carbs"
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={food.base_fat_g}
                          onChange={(e) => updateFood(idx, 'base_fat_g', parseFloat(e.target.value) || 0)}
                          placeholder="Fat"
                          className="px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={food.base_fiber_g}
                          onChange={(e) => updateFood(idx, 'base_fiber_g', parseFloat(e.target.value) || 0)}
                          placeholder="Fiber"
                          className="px-2 py-1 border rounded text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => removeFood(idx)}
                          className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-500">
                            Base: {food.base_calories} cal per 100{food.portion_unit}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingIndex(idx)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit Manually
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600 w-24">Count (g or x):</label>
                        <input
                          type="text"
                          value={food.portion_display || '1'}
                          onChange={(e) => updateFoodQuantity(idx, e.target.value)}
                          placeholder="e.g., 150g or 2"
                          className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                        <p className="font-medium">{food.calories} cal</p>
                        <p className="text-xs">P: {food.protein_g}g | C: {food.carbs_g}g | F: {food.fat_g}g | Fiber: {food.fiber_g}g</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="text-center p-3 bg-blue-50 rounded">
              <p className="text-xl font-bold text-blue-600">{Math.round(editableResult.total_nutrition.calories)}</p>
              <p className="text-xs text-gray-600">Calories</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <p className="text-xl font-bold text-green-600">{editableResult.total_nutrition.protein_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Protein</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <p className="text-xl font-bold text-yellow-600">{editableResult.total_nutrition.carbs_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Carbs</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded">
              <p className="text-xl font-bold text-orange-600">{editableResult.total_nutrition.fat_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Fat</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <p className="text-xl font-bold text-purple-600">{editableResult.total_nutrition.fiber_g.toFixed(1)}g</p>
              <p className="text-xs text-gray-600">Fiber</p>
            </div>
          </div>

          {editableResult.recommendations && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">💡 {editableResult.recommendations}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveMeal}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              ✅ Save Meal
            </button>
            <button
              onClick={() => {
                setResult(null);
                setEditableResult(null);
                setSelectedFile(null);
                setPreview(null);
                setMealType('');
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Try Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
