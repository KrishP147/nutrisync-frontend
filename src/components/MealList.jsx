import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function MealList({ refreshTrigger }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

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
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{meal.meal_name}</h3>
              <p className="text-sm text-gray-500">
                {meal.meal_type} • {formatDate(meal.consumed_at)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(meal.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
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
        </div>
      ))}
    </div>
  );
}
