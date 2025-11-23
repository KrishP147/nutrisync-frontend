import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { supabase } from '../supabaseClient';

export default function FoodSearchInput({ onFoodSelect, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setCustomFoods([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      console.log('[FoodSearch] Searching for:', query);
      try {
        // Search both database foods AND user's custom foods
        const [dbResponse, customResponse] = await Promise.all([
          api.get(`/api/search-food?query=${encodeURIComponent(query)}`),
          searchCustomFoods(query)
        ]);

        console.log('[FoodSearch] DB Response:', dbResponse.data);
        console.log('[FoodSearch] Custom foods:', customResponse);

        setResults(dbResponse.data.foods || []);
        setCustomFoods(customResponse);
        setShowDropdown(true);
      } catch (error) {
        console.error('[FoodSearch] Search failed:', error);
        console.error('[FoodSearch] Error details:', error.response?.data);
        setResults([]);
        setCustomFoods([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const searchCustomFoods = async (searchQuery) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${searchQuery}%`)
      .limit(5);

    if (error) {
      console.error('[FoodSearch] Custom foods error:', error);
      return [];
    }

    // Transform custom foods to match the expected format
    return (data || []).map(food => ({
      name: food.name,
      portion: '100g',
      calories: food.base_calories,
      protein_g: food.base_protein_g,
      carbs_g: food.base_carbs_g,
      fat_g: food.base_fat_g,
      fiber_g: food.base_fiber_g,
      isCustom: true,
      customFoodId: food.id
    }));
  };

  const handleSelect = (food) => {
    // Calculate nutrition based on quantity
    const multipliedFood = {
      ...food,
      portion: `${quantity} x ${food.portion}`,
      calories: Math.round(food.calories * quantity),
      protein_g: parseFloat((food.protein_g * quantity).toFixed(1)),
      carbs_g: parseFloat((food.carbs_g * quantity).toFixed(1)),
      fat_g: parseFloat((food.fat_g * quantity).toFixed(1)),
      fiber_g: parseFloat((food.fiber_g * quantity).toFixed(1)),
    };

    // Update the input field to show what was selected
    setQuery(food.name);
    onFoodSelect(multipliedFood);
    setResults([]);
    setShowDropdown(false);
    setQuantity(1);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
          min="0.1"
          step="0.1"
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
          placeholder="Qty"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search food (e.g., eggs, chicken breast, banana)..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
        />
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm z-10">
          Searching...
        </div>
      )}

      {showDropdown && (customFoods.length > 0 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
          {/* Custom Foods Section */}
          {customFoods.length > 0 && (
            <>
              <div className="px-4 py-2 bg-purple-50 border-b border-purple-200 text-xs font-semibold text-purple-700">
                ⭐ MY CUSTOM FOODS
              </div>
              {customFoods.map((food, idx) => (
                <button
                  key={`custom-${idx}`}
                  onClick={() => handleSelect(food)}
                  className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{food.name}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">My Food</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {Math.round(food.calories * quantity)} cal |
                    P: {(food.protein_g * quantity).toFixed(1)}g |
                    C: {(food.carbs_g * quantity).toFixed(1)}g |
                    F: {(food.fat_g * quantity).toFixed(1)}g
                    <span className="text-gray-400 ml-2">({quantity} x {food.portion})</span>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Database Foods Section */}
          {results.length > 0 && (
            <>
              {customFoods.length > 0 && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                  DATABASE FOODS
                </div>
              )}
              {results.map((food, idx) => (
                <button
                  key={`db-${idx}`}
                  onClick={() => handleSelect(food)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition"
                >
                  <div className="font-medium text-gray-800">{food.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {Math.round(food.calories * quantity)} cal |
                    P: {(food.protein_g * quantity).toFixed(1)}g |
                    C: {(food.carbs_g * quantity).toFixed(1)}g |
                    F: {(food.fat_g * quantity).toFixed(1)}g
                    <span className="text-gray-400 ml-2">({quantity} x {food.portion})</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {showDropdown && !loading && results.length === 0 && customFoods.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
          <p className="text-center text-gray-500 text-sm mb-2">
            No foods found. Try a different search term or add manually:
          </p>
          <button
            onClick={() => {
              const manualFood = {
                name: query,
                portion: `${quantity} serving`,
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: 0,
              };
              onFoodSelect(manualFood);
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add "{query}" manually (enter nutrition later)
          </button>
        </div>
      )}
    </div>
  );
}
