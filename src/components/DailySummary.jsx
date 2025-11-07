import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function DailySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysSummary();
  }, []);

  const fetchTodaysSummary = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', today.toISOString())
      .lt('consumed_at', tomorrow.toISOString());

    if (!error && data) {
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
        mealCount: acc.mealCount + 1,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 });

      setSummary(totals);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading summary...</div>;
  }

  if (!summary || summary.mealCount === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No meals logged today. Start by adding your first meal!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Today's Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-3xl font-bold text-blue-600">{summary.calories}</p>
          <p className="text-sm text-gray-600 mt-1">Calories</p>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-3xl font-bold text-green-600">{summary.protein.toFixed(1)}g</p>
          <p className="text-sm text-gray-600 mt-1">Protein</p>
        </div>

        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-3xl font-bold text-yellow-600">{summary.carbs.toFixed(1)}g</p>
          <p className="text-sm text-gray-600 mt-1">Carbs</p>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <p className="text-3xl font-bold text-orange-600">{summary.fat.toFixed(1)}g</p>
          <p className="text-sm text-gray-600 mt-1">Fat</p>
        </div>

        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p className="text-3xl font-bold text-purple-600">{summary.fiber.toFixed(1)}g</p>
          <p className="text-sm text-gray-600 mt-1">Fiber</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          You've logged <span className="font-semibold">{summary.mealCount}</span> meals today
        </p>
      </div>
    </div>
  );
}
