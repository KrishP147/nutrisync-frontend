import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DailySummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [timeChartView, setTimeChartView] = useState('calories'); // 'calories', 'protein', 'carbs', 'fat', 'fiber'

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
      setTodaysMeals(data);
    }
    setLoading(false);
  };

  const getNutritionByTimeData = () => {
    if (!todaysMeals || todaysMeals.length === 0) return [];

    // Group meals by hour with all macros
    const nutritionByHour = todaysMeals.reduce((acc, meal) => {
      const hour = new Date(meal.consumed_at).getHours();
      if (!acc[hour]) {
        acc[hour] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }
      acc[hour].calories += meal.total_calories || 0;
      acc[hour].protein += meal.total_protein_g || 0;
      acc[hour].carbs += meal.total_carbs_g || 0;
      acc[hour].fat += meal.total_fat_g || 0;
      acc[hour].fiber += meal.total_fiber_g || 0;
      return acc;
    }, {});

    // Create data array for all 24 hours
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      calories: Math.round(nutritionByHour[i]?.calories || 0),
      protein: parseFloat((nutritionByHour[i]?.protein || 0).toFixed(1)),
      carbs: parseFloat((nutritionByHour[i]?.carbs || 0).toFixed(1)),
      fat: parseFloat((nutritionByHour[i]?.fat || 0).toFixed(1)),
      fiber: parseFloat((nutritionByHour[i]?.fiber || 0).toFixed(1)),
      label: `${i}:00`
    }));
  };

  if (loading) {
    return <div className="text-center py-4">Loading summary...</div>;
  }

  if (!summary || summary.mealCount === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6 text-center text-white/60">
        No meals logged today. Start by adding your first meal!
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-2xl font-heading font-bold text-white mb-6">Today's Summary</h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center p-4 bg-black rounded-lg border border-white/10">
          <p className="text-3xl font-mono font-bold text-primary-700">{summary.calories}</p>
          <p className="text-sm text-white/60 mt-1">Calories</p>
        </div>

        <div className="text-center p-4 bg-black rounded-lg border border-white/10">
          <p className="text-3xl font-mono font-bold text-primary-700">{summary.protein.toFixed(1)}g</p>
          <p className="text-sm text-white/60 mt-1">Protein</p>
        </div>

        <div className="text-center p-4 bg-black rounded-lg border border-white/10">
          <p className="text-3xl font-mono font-bold text-amber-500">{summary.carbs.toFixed(1)}g</p>
          <p className="text-sm text-white/60 mt-1">Carbs</p>
        </div>

        <div className="text-center p-4 bg-black rounded-lg border border-white/10">
          <p className="text-3xl font-mono font-bold text-secondary-500">{summary.fat.toFixed(1)}g</p>
          <p className="text-sm text-white/60 mt-1">Fat</p>
        </div>

        <div className="text-center p-4 bg-black rounded-lg border border-white/10">
          <p className="text-3xl font-mono font-bold text-white/60">{summary.fiber.toFixed(1)}g</p>
          <p className="text-sm text-white/60 mt-1">Fiber</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-white/60">
          You've logged <span className="font-semibold text-white">{summary.mealCount}</span> {summary.mealCount === 1 ? 'meal' : 'meals'} today
        </p>
      </div>

      {/* Nutrition by Time of Day Histogram */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-heading font-semibold text-white">Intake by Time of Day</h3>
          <div className="flex gap-1">
            {[
              { key: 'calories', label: 'Cal', color: 'bg-primary-700' },
              { key: 'protein', label: 'P', color: 'bg-primary-700' },
              { key: 'carbs', label: 'C', color: 'bg-amber-500' },
              { key: 'fat', label: 'F', color: 'bg-secondary-500' },
              { key: 'fiber', label: 'Fb', color: 'bg-white/60' }
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setTimeChartView(key)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  timeChartView === key
                    ? `${color} text-white`
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-black border border-white/10 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={getNutritionByTimeData()}
              margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#a3a3a3' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={2}
                stroke="#1a1a1a"
              />
              <YAxis tick={{ fontSize: 10, fill: '#a3a3a3' }} stroke="#1a1a1a" />
              <Tooltip
                formatter={(value) => {
                  if (timeChartView === 'calories') return [`${value} cal`, 'Calories'];
                  return [`${value}g`, timeChartView.charAt(0).toUpperCase() + timeChartView.slice(1)];
                }}
                labelFormatter={(label) => `Time ${label}`}
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}
                labelStyle={{ color: '#ffffff' }}
              />
              {timeChartView === 'calories' && <Bar dataKey="calories" fill="#047857" />}
              {timeChartView === 'protein' && <Bar dataKey="protein" fill="#047857" />}
              {timeChartView === 'carbs' && <Bar dataKey="carbs" fill="#f59e0b" />}
              {timeChartView === 'fat' && <Bar dataKey="fat" fill="#0ea5e9" />}
              {timeChartView === 'fiber' && <Bar dataKey="fiber" fill="#a3a3a3" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
