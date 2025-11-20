import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function MealList({ refreshTrigger }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editComponents, setEditComponents] = useState([]);

  useEffect(() => {
    fetchMeals();
  }, [refreshTrigger]);

  const fetchMeals = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false })
      .limit(20);

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
    }
  };

  const startEditing = async (meal) => {
    setEditingMealId(meal.id);

    // Calculate the quantity based on portion_size if available
    if (meal.portion_size) {
      setEditQuantity(meal.portion_size / 100); // Assuming base is 100g
    } else {
      setEditQuantity(1);
    }

    // Fetch components if it's a compound food
    if (meal.is_compound) {
      const components = await fetchMealComponents(meal.id);
      setEditComponents(components);
    } else {
      setEditComponents([]);
    }
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditQuantity(1);
    setEditComponents([]);
  };

  const updateComponentQuantity = (index, newQuantity) => {
    const updated = [...editComponents];
    updated[index] = {
      ...updated[index],
      portion_size: parseFloat(newQuantity) || 0
    };
    setEditComponents(updated);
  };

  const saveEdit = async (meal) => {
    const quantity = parseFloat(editQuantity) || 1;

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
      }
    } else {
      // Simple food - use quantity multiplier
      // Get base values (assuming stored values are for portion_size or default 100g)
      const baseMultiplier = meal.portion_size ? (meal.portion_size / 100) : 1;
      const baseCalories = meal.total_calories / baseMultiplier;
      const baseProtein = meal.total_protein_g / baseMultiplier;
      const baseCarbs = meal.total_carbs_g / baseMultiplier;
      const baseFat = meal.total_fat_g / baseMultiplier;
      const baseFiber = meal.total_fiber_g / baseMultiplier;

      const { error } = await supabase
        .from('meals')
        .update({
          portion_size: quantity * 100,
          total_calories: Math.round(baseCalories * quantity),
          total_protein_g: parseFloat((baseProtein * quantity).toFixed(1)),
          total_carbs_g: parseFloat((baseCarbs * quantity).toFixed(1)),
          total_fat_g: parseFloat((baseFat * quantity).toFixed(1)),
          total_fiber_g: parseFloat((baseFiber * quantity).toFixed(1)),
        })
        .eq('id', meal.id);

      if (!error) {
        setMeals(meals.map(m =>
          m.id === meal.id
            ? {
                ...m,
                portion_size: quantity * 100,
                total_calories: Math.round(baseCalories * quantity),
                total_protein_g: parseFloat((baseProtein * quantity).toFixed(1)),
                total_carbs_g: parseFloat((baseCarbs * quantity).toFixed(1)),
                total_fat_g: parseFloat((baseFat * quantity).toFixed(1)),
                total_fiber_g: parseFloat((baseFiber * quantity).toFixed(1)),
              }
            : m
        ));
        setEditingMealId(null);
        setEditQuantity(1);
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
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No meals logged yet. Start by adding your first meal!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Recent Meals</h2>

      {meals.map((meal) => (
        <div key={meal.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          {editingMealId === meal.id ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{meal.meal_name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {meal.meal_type} • {formatDate(meal.consumed_at)}
                </p>
              </div>

              {meal.is_compound && editComponents.length > 0 ? (
                // Compound food - edit each component
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Edit Components:</p>
                  {editComponents.map((component, idx) => (
                    <div key={component.id} className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{component.component_name}</p>
                          <p className="text-xs text-gray-600">
                            Base: {component.base_calories} cal per 100{component.portion_unit}
                          </p>
                        </div>
                        <div className="w-32">
                          <label className="block text-xs text-gray-600 mb-1">
                            Amount ({component.portion_unit})
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={component.portion_size}
                            onChange={(e) => updateComponentQuantity(idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            {Math.round(component.base_calories * (component.portion_size / 100))} cal
                          </p>
                          <p className="text-xs text-gray-600">
                            P: {(component.base_protein_g * (component.portion_size / 100)).toFixed(1)}g
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Simple food - quantity multiplier
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    1.0 = original portion, 2.0 = double, 0.5 = half
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveEdit(meal)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Save Changes
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 text-sm font-medium"
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
                  <h3 className="text-lg font-semibold text-gray-800">{meal.meal_name}</h3>
                  <p className="text-sm text-gray-500">
                    {meal.meal_type} • {formatDate(meal.consumed_at)}
                    {meal.is_compound && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Compound</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(meal)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{meal.total_calories}</p>
                  <p className="text-xs text-gray-500">Calories</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{meal.total_protein_g}g</p>
                  <p className="text-xs text-gray-500">Protein</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{meal.total_carbs_g}g</p>
                  <p className="text-xs text-gray-500">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{meal.total_fat_g}g</p>
                  <p className="text-xs text-gray-500">Fat</p>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
