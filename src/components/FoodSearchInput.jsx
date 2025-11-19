import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function FoodSearchInput({ onFoodSelect, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
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
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/search-food?query=${encodeURIComponent(query)}`);
        setResults(response.data.foods || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Food search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

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

    onFoodSelect(multipliedFood);
    setQuery('');
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
          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Qty"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search food (e.g., eggs, chicken breast, banana)..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm z-10">
          Searching...
        </div>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
          {results.map((food, idx) => (
            <button
              key={idx}
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
        </div>
      )}

      {showDropdown && !loading && results.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm z-10">
          No foods found. Try a different search term.
        </div>
      )}
    </div>
  );
}
