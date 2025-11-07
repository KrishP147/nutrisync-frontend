import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get today's meals
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
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
      }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const recs = [];

      // Rule-based recommendations
      if (totals.protein < 100) {
        recs.push({
          type: 'protein',
          icon: '🥩',
          message: `You've had ${totals.protein.toFixed(0)}g of protein today. Try adding more lean protein sources!`,
          priority: 'high'
        });
      }

      if (totals.fiber < 25) {
        recs.push({
          type: 'fiber',
          icon: '🥦',
          message: `Your fiber intake is at ${totals.fiber.toFixed(0)}g. Add more vegetables and whole grains!`,
          priority: 'medium'
        });
      }

      if (totals.carbs > 300) {
        recs.push({
          type: 'carbs',
          icon: '🍞',
          message: `Your carb intake is quite high today (${totals.carbs.toFixed(0)}g). Consider balancing with more protein.`,
          priority: 'medium'
        });
      }

      if (recs.length === 0) {
        recs.push({
          type: 'success',
          icon: '✅',
          message: 'Great job! Your nutrition looks balanced today.',
          priority: 'low'
        });
      }

      setRecommendations(recs);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4">Generating recommendations...</div>;
  }

  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-green-200 bg-green-50',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Recommendations</h2>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{rec.icon}</span>
              <p className="text-gray-700">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
