import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function MealList({ refreshTrigger }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMealId, setEditingMealId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const startEditing = (meal) => {
    setEditingMealId(meal.id);
    setEditForm({
      meal_name: meal.meal_name,
      meal_type: meal.meal_type,
      total_calories: meal.total_calories,
      total_protein_g: meal.total_protein_g,
      total_carbs_g: meal.total_carbs_g,
      total_fat_g: meal.total_fat_g,
      total_fiber_g: meal.total_fiber_g || 0,
    });
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('meals')
      .update({
        meal_name: editForm.meal_name,
        meal_type: editForm.meal_type,
        total_calories: parseInt(editForm.total_calories) || 0,
        total_protein_g: parseFloat(editForm.total_protein_g) || 0,
        total_carbs_g: parseFloat(editForm.total_carbs_g) || 0,
        total_fat_g: parseFloat(editForm.total_fat_g) || 0,
        total_fiber_g: parseFloat(editForm.total_fiber_g) || 0,
      })
      .eq('id', id);

    if (!error) {
      // Update local state
      setMeals(meals.map(m =>
        m.id === id
          ? {
              ...m,
              meal_name: editForm.meal_name,
              meal_type: editForm.meal_type,
              total_calories: parseInt(editForm.total_calories) || 0,
              total_protein_g: parseFloat(editForm.total_protein_g) || 0,
              total_carbs_g: parseFloat(editForm.total_carbs_g) || 0,
              total_fat_g: parseFloat(editForm.total_fat_g) || 0,
              total_fiber_g: parseFloat(editForm.total_fiber_g) || 0,
            }
          : m
      ));
      setEditingMealId(null);
      setEditForm({});
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Name
                </label>
                <input
                  type="text"
                  value={editForm.meal_name}
                  onChange={(e) => setEditForm({ ...editForm, meal_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  value={editForm.meal_type}
                  onChange={(e) => setEditForm({ ...editForm, meal_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    value={editForm.total_calories}
                    onChange={(e) => setEditForm({ ...editForm, total_calories: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.total_protein_g}
                    onChange={(e) => setEditForm({ ...editForm, total_protein_g: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.total_carbs_g}
                    onChange={(e) => setEditForm({ ...editForm, total_carbs_g: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.total_fat_g}
                    onChange={(e) => setEditForm({ ...editForm, total_fat_g: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fiber (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.total_fiber_g}
                    onChange={(e) => setEditForm({ ...editForm, total_fiber_g: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => saveEdit(meal.id)}
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
