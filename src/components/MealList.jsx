import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ReplaceFoodModal from './ReplaceFoodModal';

export default function MealList({ refreshTrigger, onMealDeleted, onMealUpdated, limit, variant = 'purple', specificDate }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editComponents, setEditComponents] = useState([]);
  const [mealMultiplier, setMealMultiplier] = useState(1);
  const [originalComponents, setOriginalComponents] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [editingComponentIndex, setEditingComponentIndex] = useState(null);
  const [replacingComponentIndex, setReplacingComponentIndex] = useState(null);
  const [replacingSimpleMeal, setReplacingSimpleMeal] = useState(null);
  const [editMealType, setEditMealType] = useState('');
  const [editConsumedAt, setEditConsumedAt] = useState('');
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState(null);

  // Define color schemes based on variant
  const colorSchemes = {
    'purple': {
      cardBg: 'bg-purple-900/90',
      cardBorder: 'border-purple-500',
      textPrimary: 'text-white',
      textSecondary: 'text-purple-200',
      inputBg: 'bg-purple-700',
      inputBorder: 'border-purple-500',
      componentBg: 'bg-purple-800',
      componentBorder: 'border-purple-600',
      accentColor: 'text-purple-300',
      buttonPrimary: 'bg-purple-600 hover:bg-purple-700',
      buttonSecondary: 'bg-purple-800 hover:bg-purple-700',
    },
    'light-purple': {
      cardBg: 'bg-gradient-to-br from-purple-100 to-fuchsia-100',
      cardBorder: 'border-purple-300',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700',
      inputBg: 'bg-purple-50',
      inputBorder: 'border-purple-200',
      componentBg: 'bg-purple-50',
      componentBorder: 'border-purple-200',
      accentColor: 'text-purple-800',
      buttonPrimary: 'bg-purple-500 hover:bg-purple-600',
      buttonSecondary: 'bg-purple-300 hover:bg-purple-400',
    },
    'light-green': {
      cardBg: 'bg-gradient-to-br from-green-100 to-emerald-100',
      cardBorder: 'border-green-300',
      textPrimary: 'text-gray-900',
      textSecondary: 'text-gray-700',
      inputBg: 'bg-green-50',
      inputBorder: 'border-green-200',
      componentBg: 'bg-green-50',
      componentBorder: 'border-green-200',
      accentColor: 'text-green-800',
      buttonPrimary: 'bg-green-500 hover:bg-green-600',
      buttonSecondary: 'bg-green-300 hover:bg-green-400',
    }
  };

  const colors = colorSchemes[variant] || colorSchemes.purple;

  useEffect(() => {
    fetchMeals();
  }, [refreshTrigger]);

  const fetchMeals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id);

    // If specificDate is provided, filter by that date
    if (specificDate) {
      // Parse date string as local time (not UTC) to avoid timezone issues
      const [year, month, day] = specificDate.split('-').map(Number);
      const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      query = query
        .gte('consumed_at', dayStart.toISOString())
        .lte('consumed_at', dayEnd.toISOString());
    }

    query = query.order('consumed_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (!error) {
      setMeals(data || []);
    }
    setLoading(false);
  };

  const fetchMealComponents = async (mealId) => {
    const { data, error } = await supabase
      .from('meal_components')
      .select('*')
      .eq('meal_id', mealId);

    if (!error && data) {
      return data;
    }
    return [];
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meal?')) return;

    // Find the meal to get photo_url
    const meal = meals.find(m => m.id === id);

    // Delete photo from storage if it exists
    if (meal?.photo_url) {
      try {
        // Extract filename from URL
        const urlParts = meal.photo_url.split('/');
        const filename = urlParts.slice(-2).join('/'); // user_id/timestamp.ext

        await supabase.storage
          .from('meal-photos')
          .remove([filename]);
      } catch (err) {
        console.error('Error deleting photo:', err);
        // Continue with meal deletion even if photo deletion fails
      }
    }

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);

    if (!error) {
      setMeals(meals.filter(m => m.id !== id));
      if (onMealDeleted) onMealDeleted();
    }
  };

  const startEditing = async (meal) => {
    setEditingMealId(meal.id);
    setEditNotes(meal.notes || '');
    setEditMealType(meal.meal_type);

    // Format datetime-local input value
    const date = new Date(meal.consumed_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setEditConsumedAt(`${year}-${month}-${day}T${hours}:${minutes}`);

    // Extract multiplier from meal name if it exists
    // Format: "Food1, Food2 (2x)" or "Food1, Food2 (250g)"
    const multiplierMatch = meal.meal_name.match(/\(([0-9.]+[xg]*)\)$/);
    if (multiplierMatch) {
      setMealMultiplier(multiplierMatch[1]);
    } else {
      setMealMultiplier(1);
    }

    // Set the initial quantity display based on the meal's actual portion_size
    if (meal.portion_size && meal.portion_unit) {
      const portionSize = meal.portion_size;

      // If it's a multiple of 100, show as multiplier (e.g., "2")
      if (portionSize % 100 === 0 && meal.portion_unit === 'g') {
        setEditQuantity((portionSize / 100).toString());
      } else {
        // Show as grams (e.g., "150g")
        setEditQuantity(`${portionSize}${meal.portion_unit}`);
      }
    } else {
      // Default to "1" if no portion info saved
      setEditQuantity('1');
    }

    // Fetch components if it's a compound food
    if (meal.is_compound) {
      const components = await fetchMealComponents(meal.id);
      // Set each component's display based on current portion_size
      const componentsWithDisplay = components.map(c => {
        // Calculate display value from portion_size
        const portionSize = c.portion_size || 100;
        let displayValue;

        // If it's a multiple of 100, show as multiplier (e.g., "2")
        if (portionSize % 100 === 0) {
          displayValue = (portionSize / 100).toString();
        } else {
          // Show as grams (e.g., "150g")
          displayValue = `${portionSize}g`;
        }

        return {
          ...c,
          portion_display: displayValue
        };
      });
      setEditComponents(componentsWithDisplay);
      setOriginalComponents(JSON.parse(JSON.stringify(componentsWithDisplay))); // Store original for reset
    } else {
      setEditComponents([]);
      setOriginalComponents([]);
    }
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditQuantity('1');
    setEditComponents([]);
    setMealMultiplier(1);
    setOriginalComponents([]);
    setEditNotes('');
  };

  const getTotalCompoundWeight = () => {
    if (!editComponents || editComponents.length === 0) return 0;
    return editComponents.reduce((sum, c) => sum + (c.portion_size || 100), 0);
  };

  const updateMealMultiplier = (inputValue) => {
    // Allow empty input for backspace
    if (inputValue === '') {
      setMealMultiplier('');
      return;
    }

    if (originalComponents.length === 0) return;

    // Calculate ORIGINAL total weight
    const originalTotalWeight = originalComponents.reduce((sum, c) => sum + (c.portion_size || 100), 0);

    const containsLetters = /[a-zA-Z]/.test(inputValue);
    let multiplier;

    if (containsLetters) {
      // Extract numeric value and divide by ORIGINAL total weight
      // e.g., "250g" with originalTotalWeight 350 -> 250/350 = 0.714
      const gramAmount = parseFloat(inputValue.replace(/[^\d.]/g, ''));
      multiplier = gramAmount / originalTotalWeight;
    } else {
      // Pure number - use as direct multiplier
      multiplier = parseFloat(inputValue) || 1;
    }

    setMealMultiplier(inputValue);

    // Apply multiplier to ORIGINAL components, not current state
    const updated = originalComponents.map(component => {
      const newPortionSize = component.portion_size * multiplier;

      return {
        ...component,
        portion_size: newPortionSize,
        portion_display: `${Math.round(newPortionSize)}g`
      };
    });

    setEditComponents(updated);
  };

  const formatMealTitle = (meal) => {
    // Format meal name with portion info in brackets
    let portionText = '';
    
    if (meal.portion_size && meal.portion_unit) {
      // Check if portion_size is a multiple of 100 (multiplier-based)
      if (meal.portion_size % 100 === 0 && meal.portion_unit === 'g') {
        const multiplier = meal.portion_size / 100;
        portionText = ` (${multiplier}x)`;
      } else {
        // Show exact gram amount
        portionText = ` (${meal.portion_size}${meal.portion_unit})`;
      }
    }
    
    return meal.meal_name + portionText;
  };

  const updateComponentQuantity = (index, inputValue) => {
    const updated = [...editComponents];
    const component = updated[index];

    // Store the display value
    updated[index] = { ...component, portion_display: inputValue };

    // Handle empty input
    if (inputValue === '' || inputValue === null || inputValue === undefined) {
      updated[index].portion_size = 0;
      setEditComponents(updated);
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

    updated[index].portion_size = portionSize;
    setEditComponents(updated);
  };

  const updateComponentNutrition = (index, field, value) => {
    const updated = [...editComponents];
    updated[index][field] = parseFloat(value) || 0;
    setEditComponents(updated);
  };

  const saveComponentAsCustomFood = async (index) => {
    const component = editComponents[index];
    const foodName = prompt(`Save "${component.component_name}" as custom food? Enter a name:`, component.component_name);

    if (!foodName) return; // User cancelled

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_foods')
        .insert([{
          user_id: user.id,
          name: foodName,
          base_calories: component.base_calories,
          base_protein_g: component.base_protein_g,
          base_carbs_g: component.base_carbs_g,
          base_fat_g: component.base_fat_g,
          base_fiber_g: component.base_fiber_g,
          source: 'edited_from_meal',
          original_food_name: component.component_name
        }]);

      if (error) {
        alert('Failed to save custom food: ' + error.message);
      } else {
        alert(`✅ "${foodName}" saved as custom food!`);
      }
    } catch (err) {
      alert('Failed to save custom food: ' + err.message);
    }
  };

  const handleReplaceFood = (index, newFoodData) => {
    const updated = [...editComponents];
    updated[index] = {
      ...updated[index],
      component_name: newFoodData.name,
      base_calories: newFoodData.base_calories,
      base_protein_g: newFoodData.base_protein_g,
      base_carbs_g: newFoodData.base_carbs_g,
      base_fat_g: newFoodData.base_fat_g,
      base_fiber_g: newFoodData.base_fiber_g,
      portion_size: newFoodData.portion_size,
      portion_unit: newFoodData.portion_unit,
      custom_food_id: newFoodData.custom_food_id || null
    };
    setEditComponents(updated);
    setReplacingComponentIndex(null);
  };

  const handleReplaceSimpleMeal = async (newFoodData) => {
    // Update the meal in the meals list
    const meal = meals.find(m => m.id === replacingSimpleMeal);
    if (!meal) return;

    // Calculate new macros based on portion size
    const multiplier = newFoodData.portion_size / 100;
    const updatedMeal = {
      ...meal,
      meal_name: newFoodData.name,
      portion_size: newFoodData.portion_size,
      portion_unit: newFoodData.portion_unit,
      total_calories: Math.round(newFoodData.base_calories * multiplier),
      total_protein_g: parseFloat((newFoodData.base_protein_g * multiplier).toFixed(1)),
      total_carbs_g: parseFloat((newFoodData.base_carbs_g * multiplier).toFixed(1)),
      total_fat_g: parseFloat((newFoodData.base_fat_g * multiplier).toFixed(1)),
      total_fiber_g: parseFloat((newFoodData.base_fiber_g * multiplier).toFixed(1))
    };

    // Persist to database
    await supabase
      .from('meals')
      .update({
        meal_name: updatedMeal.meal_name,
        portion_size: updatedMeal.portion_size,
        portion_unit: updatedMeal.portion_unit,
        total_calories: updatedMeal.total_calories,
        total_protein_g: updatedMeal.total_protein_g,
        total_carbs_g: updatedMeal.total_carbs_g,
        total_fat_g: updatedMeal.total_fat_g,
        total_fiber_g: updatedMeal.total_fiber_g
      })
      .eq('id', meal.id);

    setMeals(meals.map(m => m.id === meal.id ? updatedMeal : m));
    setReplacingSimpleMeal(null);
  };

  const saveEdit = async (meal) => {
    // Parse editQuantity with smart input parsing
    let portionSize;
    const containsLetters = /[a-zA-Z]/.test(editQuantity);
    
    if (containsLetters) {
      // Extract numeric value (e.g., "150g" -> 150)
      const numericValue = parseFloat(editQuantity.replace(/[^\d.]/g, ''));
      portionSize = numericValue || 100;
    } else {
      // Pure number - treat as multiplier (e.g., "2" -> 200g)
      const multiplier = parseFloat(editQuantity) || 1;
      portionSize = multiplier * 100;
    }

    if (meal.is_compound && editComponents.length > 0) {
      // Update each component (both portion and nutrition if edited)
      for (const component of editComponents) {
        await supabase
          .from('meal_components')
          .update({
            portion_size: component.portion_size,
            base_calories: component.base_calories,
            base_protein_g: component.base_protein_g,
            base_carbs_g: component.base_carbs_g,
            base_fat_g: component.base_fat_g,
            base_fiber_g: component.base_fiber_g
          })
          .eq('id', component.id);
      }

      // Recalculate total macros from components
      const totalCalories = editComponents.reduce((sum, c) => {
        const multiplier = c.portion_size / 100;
        return sum + (c.base_calories * multiplier);
      }, 0);

      const totalProtein = editComponents.reduce((sum, c) => {
        const multiplier = c.portion_size / 100;
        return sum + (c.base_protein_g * multiplier);
      }, 0);

      const totalCarbs = editComponents.reduce((sum, c) => {
        const multiplier = c.portion_size / 100;
        return sum + (c.base_carbs_g * multiplier);
      }, 0);

      const totalFat = editComponents.reduce((sum, c) => {
        const multiplier = c.portion_size / 100;
        return sum + (c.base_fat_g * multiplier);
      }, 0);

      const totalFiber = editComponents.reduce((sum, c) => {
        const multiplier = c.portion_size / 100;
        return sum + (c.base_fiber_g * multiplier);
      }, 0);

      // Generate meal name with multiplier suffix
      // First remove any existing multiplier suffix from current name
      let baseMealName = meal.meal_name.replace(/\s*\([0-9.]+[xg]*\)$/, '');

      // Calculate total portion size for compound meals
      const totalCompoundWeight = editComponents.reduce((sum, c) => sum + (c.portion_size || 100), 0);

      // Update meal totals, name, portion_size, notes, meal_type, and consumed_at
      const { error } = await supabase
        .from('meals')
        .update({
          meal_name: baseMealName,
          portion_size: totalCompoundWeight,
          portion_unit: 'g',
          total_calories: Math.round(totalCalories),
          total_protein_g: parseFloat(totalProtein.toFixed(1)),
          total_carbs_g: parseFloat(totalCarbs.toFixed(1)),
          total_fat_g: parseFloat(totalFat.toFixed(1)),
          total_fiber_g: parseFloat(totalFiber.toFixed(1)),
          notes: editNotes || null,
          meal_type: editMealType,
          consumed_at: new Date(editConsumedAt).toISOString(),
        })
        .eq('id', meal.id);

      if (!error) {
        await fetchMeals();
        setEditingMealId(null);
        setEditComponents([]);
        if (onMealUpdated) onMealUpdated();
      }
    } else {
      // Simple food - use smart parsed portion size
      // Get base values (assuming stored values are for portion_size or default 100g)
      const baseMultiplier = meal.portion_size ? (meal.portion_size / 100) : 1;
      const baseCalories = meal.total_calories / baseMultiplier;
      const baseProtein = meal.total_protein_g / baseMultiplier;
      const baseCarbs = meal.total_carbs_g / baseMultiplier;
      const baseFat = meal.total_fat_g / baseMultiplier;
      const baseFiber = meal.total_fiber_g / baseMultiplier;

      const multiplier = portionSize / 100;

      const { error } = await supabase
        .from('meals')
        .update({
          portion_size: portionSize,
          portion_unit: 'g',
          total_calories: Math.round(baseCalories * multiplier),
          total_protein_g: parseFloat((baseProtein * multiplier).toFixed(1)),
          total_carbs_g: parseFloat((baseCarbs * multiplier).toFixed(1)),
          total_fat_g: parseFloat((baseFat * multiplier).toFixed(1)),
          total_fiber_g: parseFloat((baseFiber * multiplier).toFixed(1)),
          notes: editNotes || null,
          meal_type: editMealType,
          consumed_at: new Date(editConsumedAt).toISOString(),
        })
        .eq('id', meal.id);

      if (!error) {
        setMeals(meals.map(m =>
          m.id === meal.id
            ? {
                ...m,
                portion_size: portionSize,
                portion_unit: 'g',
                total_calories: Math.round(baseCalories * multiplier),
                total_protein_g: parseFloat((baseProtein * multiplier).toFixed(1)),
                total_carbs_g: parseFloat((baseCarbs * multiplier).toFixed(1)),
                total_fat_g: parseFloat((baseFat * multiplier).toFixed(1)),
                total_fiber_g: parseFloat((baseFiber * multiplier).toFixed(1)),
              }
            : m
        ));
        setEditingMealId(null);
        setEditQuantity('1');
        if (onMealUpdated) onMealUpdated();
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading meals...</div>;
  }

  if (meals.length === 0) {
    return (
      <div className={`${colors.cardBg} border-2 ${colors.cardBorder} rounded-xl p-8 text-center shadow-md`}>
        <p className={colors.textSecondary}>
          {specificDate ? 'Nothing was logged today.' : 'No meals logged yet. Start by adding your first meal!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <div key={meal.id} className={`${colors.cardBg} border-2 ${colors.cardBorder} rounded-xl p-6 hover:shadow-lg transition shadow-md`}>
          {editingMealId === meal.id ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-semibold ${colors.textPrimary} mb-2`}>{meal.meal_name}</h3>
              </div>

              {/* Meal Type and Time Selectors */}
              <div className={`${colors.inputBg} p-3 rounded-lg border-2 ${colors.inputBorder} space-y-3`}>
                <div>
                  <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                    Meal Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setEditMealType(type)}
                        className={`py-2 px-3 rounded-lg border-2 transition capitalize text-sm ${
                          editMealType === type
                            ? 'border-purple-500 bg-purple-500 text-white font-semibold'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editConsumedAt}
                    onChange={(e) => setEditConsumedAt(e.target.value)}
                    max={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              {meal.is_compound && editComponents.length > 0 ? (
                // Compound food - edit each component
                <div className="space-y-3">
                  {/* Meal Multiplier */}
                  <div className={`${colors.inputBg} p-3 rounded-lg border-2 ${colors.inputBorder}`}>
                    <div className="flex items-center gap-3 mb-1">
                      <label className={`text-sm font-medium ${colors.textPrimary} whitespace-nowrap`}>Meal Multiplier:</label>
                      <input
                        type="text"
                        value={mealMultiplier}
                        onChange={(e) => updateMealMultiplier(e.target.value)}
                        placeholder="1 or 2x or 250g"
                        className={`flex-1 px-3 py-1.5 border ${colors.inputBorder} rounded focus:ring-2 focus:ring-purple-500 text-sm text-gray-900 max-w-28`}
                      />
                      <span className={`text-xs font-semibold ${colors.accentColor} whitespace-nowrap bg-opacity-20 bg-white px-2 py-1 rounded`}>
                        Total: {Math.round(getTotalCompoundWeight())}g
                      </span>
                    </div>
                    <p className={`text-xs ${colors.textSecondary}`}>
                      Enter a number (e.g., 2) to multiply all portions, or grams (e.g., 250g) to scale to that weight
                    </p>
                  </div>

                  <p className={`text-sm font-medium ${colors.textSecondary}`}>Edit Components:</p>
                  {editComponents.map((component, idx) => (
                    <div key={component.id} className={`${colors.componentBg} p-3 rounded-lg border ${colors.componentBorder}`}>
                      {editingComponentIndex === idx ? (
                        // Edit mode - show nutrition inputs
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className={`text-sm font-medium ${colors.textPrimary}`}>{component.component_name}</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingComponentIndex(null)}
                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                              >
                                Done
                              </button>
                              <button
                                onClick={() => saveComponentAsCustomFood(idx)}
                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                              >
                                ⭐ Save
                              </button>
                            </div>
                          </div>
                          <p className={`text-xs ${colors.textSecondary}`}>Edit base nutrition values (per 100{component.portion_unit}):</p>
                          <div className="grid grid-cols-5 gap-2">
                            <div>
                              <label className="text-xs text-gray-300 block mb-0.5">Calories</label>
                              <input
                                type="number"
                                value={component.base_calories}
                                onChange={(e) => updateComponentNutrition(idx, 'base_calories', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-0.5">Protein (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={component.base_protein_g}
                                onChange={(e) => updateComponentNutrition(idx, 'base_protein_g', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-0.5">Carbs (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={component.base_carbs_g}
                                onChange={(e) => updateComponentNutrition(idx, 'base_carbs_g', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-0.5">Fat (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={component.base_fat_g}
                                onChange={(e) => updateComponentNutrition(idx, 'base_fat_g', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-0.5">Fiber (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={component.base_fiber_g}
                                onChange={(e) => updateComponentNutrition(idx, 'base_fiber_g', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${colors.textPrimary}`}>{component.component_name}</p>
                              <p className={`text-xs ${colors.textSecondary}`}>
                                Base: {component.base_calories} cal per 100{component.portion_unit}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setReplacingComponentIndex(idx)}
                                className="text-xs bg-orange-500 text-white px-2 py-1 rounded hover:bg-orange-600"
                              >
                                🔄 Replace
                              </button>
                              <button
                                onClick={() => setEditingComponentIndex(idx)}
                                className={`text-xs ${colors.accentColor} hover:opacity-80`}
                              >
                                Edit Manually
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32">
                              <label className={`block text-xs ${colors.textSecondary} mb-1`}>
                                Count (g or x)
                              </label>
                              <input
                                type="text"
                                value={component.portion_display ?? ''}
                                onChange={(e) => updateComponentQuantity(idx, e.target.value)}
                                placeholder="e.g., 150g or 2"
                                className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} text-gray-900 rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm`}
                              />
                            </div>
                            <div className="flex-1 ml-2">
                              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                                <div>
                                  <p className="font-bold text-blue-600">{Math.round(component.base_calories * (component.portion_size / 100))}</p>
                                  <p className={`text-xs ${colors.textSecondary}`}>cal</p>
                                </div>
                                <div>
                                  <p className="font-bold text-green-600">{(component.base_protein_g * (component.portion_size / 100)).toFixed(1)}g</p>
                                  <p className={`text-xs ${colors.textSecondary}`}>P</p>
                                </div>
                                <div>
                                  <p className="font-bold text-yellow-600">{(component.base_carbs_g * (component.portion_size / 100)).toFixed(1)}g</p>
                                  <p className={`text-xs ${colors.textSecondary}`}>C</p>
                                </div>
                                <div>
                                  <p className="font-bold text-orange-600">{(component.base_fat_g * (component.portion_size / 100)).toFixed(1)}g</p>
                                  <p className={`text-xs ${colors.textSecondary}`}>F</p>
                                </div>
                                <div>
                                  <p className="font-bold text-purple-600">{(component.base_fiber_g * (component.portion_size / 100)).toFixed(1)}g</p>
                                  <p className={`text-xs ${colors.textSecondary}`}>Fiber</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Simple food - smart quantity input with Replace button
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setReplacingSimpleMeal(meal.id)}
                      className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition font-medium"
                    >
                      🔄 Replace Food
                    </button>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>
                      Count (g or x)
                    </label>
                    <input
                      type="text"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      placeholder="e.g., 150g or 2"
                      className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} text-gray-900 rounded-lg focus:ring-2 focus:ring-opacity-50`}
                    />
                    <p className={`text-xs ${colors.textSecondary} mt-1`}>
                      Enter grams (e.g., 150g) or multiplier (e.g., 2)
                    </p>
                  </div>
                </div>
              )}

              {/* Meal Notes */}
              <div className={`${colors.inputBg} p-3 rounded-lg border-2 ${colors.inputBorder}`}>
                <label className={`block text-sm font-medium ${colors.textPrimary} mb-2`}>
                  Meal Notes (Optional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any notes about this meal..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 bg-white resize-none text-sm"
                />
                <p className={`text-xs ${colors.textSecondary} mt-1`}>
                  {editNotes.length}/500 characters
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveEdit(meal)}
                  className={`flex-1 ${colors.buttonPrimary} text-white py-2 px-4 rounded-lg text-sm font-medium transition`}
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEditing}
                  className={`flex-1 ${colors.buttonSecondary} ${colors.textSecondary} py-2 px-4 rounded-lg text-sm font-medium transition`}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {/* Photo thumbnail */}
                  {meal.photo_url && (
                    <button
                      onClick={() => setViewingPhotoUrl(meal.photo_url)}
                      className="flex-shrink-0"
                    >
                      <img
                        src={meal.photo_url}
                        alt="Meal photo"
                        className="w-12 h-12 rounded-lg object-cover border-2 border-purple-400 hover:border-purple-300 transition cursor-pointer"
                      />
                    </button>
                  )}
                  <div>
                    <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>{formatMealTitle(meal)}</h3>
                    <p className={`text-sm ${colors.textSecondary}`}>
                      {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)} • {formatDate(meal.consumed_at)}
                      {meal.is_compound && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-semibold">Compound</span>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(meal)}
                    className={`${colors.accentColor} hover:opacity-80 text-sm font-medium`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${colors.accentColor}`}>{meal.total_calories}</p>
                  <p className={`text-xs ${colors.textSecondary}`}>Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{meal.total_protein_g}g</p>
                  <p className={`text-xs ${colors.textSecondary}`}>Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-300">{meal.total_carbs_g}g</p>
                  <p className={`text-xs ${colors.textSecondary}`}>Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{meal.total_fat_g}g</p>
                  <p className={`text-xs ${colors.textSecondary}`}>Fat</p>
                </div>
              </div>

              {/* Display Notes */}
              {meal.notes && (
                <div className={`mt-4 ${colors.componentBg} border ${colors.componentBorder} rounded-lg p-3`}>
                  <p className={`text-xs font-semibold ${colors.textSecondary} mb-1`}>📝 Notes:</p>
                  <p className={`text-sm ${colors.textPrimary} italic`}>{meal.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Replace Food Modal - for compound meal components */}
      {replacingComponentIndex !== null && editComponents[replacingComponentIndex] && (
        <ReplaceFoodModal
          food={editComponents[replacingComponentIndex]}
          onReplace={(newFoodData) => handleReplaceFood(replacingComponentIndex, newFoodData)}
          onClose={() => setReplacingComponentIndex(null)}
        />
      )}

      {/* Replace Food Modal - for simple meals */}
      {replacingSimpleMeal !== null && (
        <ReplaceFoodModal
          food={{
            name: meals.find(m => m.id === replacingSimpleMeal)?.meal_name,
            component_name: meals.find(m => m.id === replacingSimpleMeal)?.meal_name,
            portion_size: meals.find(m => m.id === replacingSimpleMeal)?.portion_size || 100
          }}
          onReplace={handleReplaceSimpleMeal}
          onClose={() => setReplacingSimpleMeal(null)}
        />
      )}

      {/* Photo Viewing Modal */}
      {viewingPhotoUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhotoUrl(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-200 transition text-2xl font-bold"
            >
              ✕
            </button>
            <img
              src={viewingPhotoUrl}
              alt="Meal photo"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
