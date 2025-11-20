import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';

export default function WeeklyTrends() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get last 7 days
    const endDate = new Date();
    const startDate = subDays(endDate, 6);
    startDate.setHours(0, 0, 0, 0);

    const { data: meals, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', startDate.toISOString())
      .order('consumed_at', { ascending: true });

    if (!error && meals) {
      // Group by day
      const grouped = {};

      for (let i = 0; i < 7; i++) {
        const date = subDays(endDate, 6 - i);
        const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
        grouped[dateKey] = {
          date: format(date, 'MMM dd'),
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }

      meals.forEach(meal => {
        const dateKey = format(startOfDay(new Date(meal.consumed_at)), 'yyyy-MM-dd');
        if (grouped[dateKey]) {
          grouped[dateKey].calories += meal.total_calories || 0;
          grouped[dateKey].protein += meal.total_protein_g || 0;
          grouped[dateKey].carbs += meal.total_carbs_g || 0;
          grouped[dateKey].fat += meal.total_fat_g || 0;
        }
      });

      setData(Object.values(grouped));
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-4">Loading trends...</div>;
  }

  return (
    <div className="bg-white border-2 border-green-100 rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-black mb-6">Weekly Trends</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={2} name="Protein (g)" />
          <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} name="Carbs (g)" />
          <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2} name="Fat (g)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
