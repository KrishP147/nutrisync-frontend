import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function MealList({ refreshTrigger, onMealDeleted, onMealUpdated, limit, variant = 'purple', specificDate }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [editComponents, setEditComponents] = useState([]);

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
    } else {
      setEditComponents([]);
    }
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditQuantity('1');
    setEditComponents([]);
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
      // Update each component
      for (const component of editComponents) {
        await supabase
          .from('meal_components')
          .update({
            portion_size: component.portion_size
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

      // Update meal totals
      const { error } = await supabase
        .from('meals')
        .update({
          total_calories: Math.round(totalCalories),
          total_protein_g: parseFloat(totalProtein.toFixed(1)),
          total_carbs_g: parseFloat(totalCarbs.toFixed(1)),
          total_fat_g: parseFloat(totalFat.toFixed(1)),
          total_fiber_g: parseFloat(totalFiber.toFixed(1)),
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
                <p className={`text-sm ${colors.textSecondary} mb-4`}>
                  {meal.meal_type} • {formatDate(meal.consumed_at)}
                </p>
              </div>

              {meal.is_compound && editComponents.length > 0 ? (
                // Compound food - edit each component
                <div className="space-y-3">
                  <p className={`text-sm font-medium ${colors.textSecondary}`}>Edit Components:</p>
                  {editComponents.map((component, idx) => (
                    <div key={component.id} className={`${colors.componentBg} p-3 rounded-lg border ${colors.componentBorder}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${colors.textPrimary}`}>{component.component_name}</p>
                          <p className={`text-xs ${colors.textSecondary}`}>
                            Base: {component.base_calories} cal per 100{component.portion_unit}
                          </p>
                        </div>
                        <div className="w-32">
                          <label className={`block text-xs ${colors.textSecondary} mb-1`}>
                            Count (g or x)
                          </label>
                          <input
                            type="text"
                            value={component.portion_display ?? ''}
                            onChange={(e) => updateComponentQuantity(idx, e.target.value)}
                            placeholder="e.g., 150g or 2"
                            className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} text-white rounded-lg focus:ring-2 focus:ring-opacity-50 text-sm`}
                          />
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${colors.accentColor}`}>
                            {Math.round(component.base_calories * (component.portion_size / 100))} cal
                          </p>
                          <p className={`text-xs ${colors.textSecondary}`}>
                            P: {(component.base_protein_g * (component.portion_size / 100)).toFixed(1)}g
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Simple food - smart quantity input
                <div>
                  <label className={`block text-sm font-medium ${colors.textSecondary} mb-1`}>
                    Count (g or x)
                  </label>
                  <input
                    type="text"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    placeholder="e.g., 150g or 2"
                    className={`w-full px-3 py-2 ${colors.inputBg} border ${colors.inputBorder} text-white rounded-lg focus:ring-2 focus:ring-opacity-50`}
                  />
                  <p className={`text-xs ${colors.textSecondary} mt-1`}>
                    Enter grams (e.g., 150g) or multiplier (e.g., 2)
                  </p>
                </div>
              )}

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
                <div>
                  <h3 className={`text-lg font-semibold ${colors.textPrimary}`}>{formatMealTitle(meal)}</h3>
                  <p className={`text-sm ${colors.textSecondary}`}>
                    {meal.meal_type} • {formatDate(meal.consumed_at)}
                    {meal.is_compound && <span className={`ml-2 text-xs ${colors.componentBg} ${colors.textSecondary} px-2 py-0.5 rounded`}>Compound</span>}
                  </p>
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
            </>
          )}
        </div>
      ))}
    </div>
  );
}
