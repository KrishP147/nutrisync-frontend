import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyTrends() {
  const { goals } = useGoals();
  const [weekData, setWeekData] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', twoWeeksAgo.toISOString())
        .order('consumed_at', { ascending: true });

      if (!error && data) {
        processWeeklyData(data);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWeeklyData = (meals) => {
    const dailyTotals = {};

    meals.forEach(meal => {
      const date = new Date(meal.consumed_at);
      const dateStr = date.toISOString().split('T')[0];

      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      dailyTotals[dateStr].calories += meal.total_calories || 0;
      dailyTotals[dateStr].protein += meal.total_protein_g || 0;
      dailyTotals[dateStr].carbs += meal.total_carbs_g || 0;
      dailyTotals[dateStr].fat += meal.total_fat_g || 0;
    });

    // Get last 7 days for chart
    const last7Days = Object.entries(dailyTotals)
      .slice(-7)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        calories: data.calories,
        protein: data.protein,
      }));

    setWeekData(last7Days);

    // Calculate week comparison
    const dates = Object.keys(dailyTotals).sort();
    const thisWeekDates = dates.slice(-7);
    const lastWeekDates = dates.slice(-14, -7);

    const avgThisWeek = thisWeekDates.reduce((sum, date) => sum + dailyTotals[date].calories, 0) / (thisWeekDates.length || 1);
    const avgLastWeek = lastWeekDates.reduce((sum, date) => sum + dailyTotals[date].calories, 0) / (lastWeekDates.length || 1);

    const percentChange = lastWeekDates.length > 0 
      ? ((avgThisWeek - avgLastWeek) / avgLastWeek * 100)
      : 0;

    setComparison({
      thisWeek: Math.round(avgThisWeek),
      lastWeek: Math.round(avgLastWeek),
      percentChange: percentChange.toFixed(1),
      trend: percentChange > 5 ? 'up' : percentChange < -5 ? 'down' : 'stable'
    });
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
            <Calendar size={20} className="text-secondary-400" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">Weekly Trends</h2>
            <p className="text-white/50 text-sm">Calorie intake over the past week</p>
          </div>
        </div>

        {comparison && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            comparison.trend === 'up' ? 'bg-amber-500/10 text-amber-400' :
            comparison.trend === 'down' ? 'bg-primary-700/10 text-primary-500' :
            'bg-white/5 text-white/60'
          }`}>
            {comparison.trend === 'up' ? <TrendingUp size={16} /> :
             comparison.trend === 'down' ? <TrendingDown size={16} /> :
             <Minus size={16} />}
            <span className="text-sm font-medium">
              {comparison.percentChange > 0 ? '+' : ''}{comparison.percentChange}%
            </span>
          </div>
        )}
      </div>

      {weekData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="calories" 
              stroke="#047857" 
              strokeWidth={2}
              dot={{ fill: '#047857', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
            {goals?.calories && (
              <Line
                type="monotone"
                dataKey={() => goals.calories}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Goal"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-white/40">
          No data available for this period
        </div>
      )}

      {comparison && comparison.thisWeek > 0 && (
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
          <div>
            <p className="text-white/50 text-sm mb-1">This Week Avg</p>
            <p className="text-2xl font-mono font-bold text-white">
              {comparison.thisWeek}
              <span className="text-white/40 text-sm ml-1">kcal/day</span>
            </p>
          </div>
          <div>
            <p className="text-white/50 text-sm mb-1">Last Week Avg</p>
            <p className="text-2xl font-mono font-bold text-white/60">
              {comparison.lastWeek}
              <span className="text-white/40 text-sm ml-1">kcal/day</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
