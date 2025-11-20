import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import GitHubHeatmap from '../components/GitHubHeatmap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';
import FloatingLines from '../components/ui/FloatingLines';
import CountUp from '../components/ui/CountUp';

export default function Progress() {
  const [heatmapData, setHeatmapData] = useState({});
  const [lineChartData, setLineChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // User goals (could be fetched from settings)
  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', startDate.toISOString())
      .order('consumed_at', { ascending: true });

    if (!error && data) {
      processData(data);
    }
    setLoading(false);
  };

  const processData = (meals) => {
    // Process for heatmap
    const heatmap = {};
    const dailyTotals = {};

    meals.forEach(meal => {
      const date = new Date(meal.consumed_at).toISOString().split('T')[0];

      if (!heatmap[date]) {
        heatmap[date] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        };
      }

      heatmap[date].calories += meal.total_calories || 0;
      heatmap[date].protein += meal.total_protein_g || 0;
      heatmap[date].carbs += meal.total_carbs_g || 0;
      heatmap[date].fat += meal.total_fat_g || 0;
      heatmap[date].fiber += meal.total_fiber_g || 0;
    });

    setHeatmapData(heatmap);

    // Process for line chart (last 30 days)
    const last30Days = Object.entries(heatmap)
      .slice(-30)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: data.calories,
        protein: data.protein,
        proteinPercent: ((data.protein / goals.protein) * 100).toFixed(0),
        caloriesPercent: ((data.calories / goals.calories) * 100).toFixed(0),
      }));

    setLineChartData(last30Days);

    // Calculate stats
    const totalDays = Object.keys(heatmap).length;
    const avgCalories = Object.values(heatmap).reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const avgProtein = Object.values(heatmap).reduce((sum, day) => sum + day.protein, 0) / totalDays;

    const daysHitProteinGoal = Object.values(heatmap).filter(day => day.protein >= goals.protein).length;
    const daysHitCalorieGoal = Object.values(heatmap).filter(
      day => day.calories >= goals.calories * 0.9 && day.calories <= goals.calories * 1.1
    ).length;

    setStats({
      avgCalories: Math.round(avgCalories),
      avgProtein: Math.round(avgProtein),
      proteinGoalRate: ((daysHitProteinGoal / totalDays) * 100).toFixed(0),
      calorieGoalRate: ((daysHitCalorieGoal / totalDays) * 100).toFixed(0),
      totalDays,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-dark-secondary">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary relative">
      {/* Background Effect */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <FloatingLines
          linesGradient={['#22c55e', '#3b82f6', '#a855f7']}
          enabledWaves={['bottom']}
          lineCount={12}
          lineDistance={5}
          animationSpeed={0.3}
          interactive={false}
        />
      </div>

      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-matrix-green-400 mb-2">Your Progress</h1>
          <p className="text-dark-secondary">Track your nutrition journey over time</p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="glass-card p-6 text-center">
              <CountUp
                from={0}
                to={stats.avgCalories}
                duration={1.5}
                className="text-3xl font-bold text-matrix-green-400"
              />
              <p className="text-sm text-dark-secondary mt-2">Avg Daily Calories</p>
            </div>

            <div className="glass-card p-6 text-center">
              <CountUp
                from={0}
                to={stats.avgProtein}
                duration={1.5}
                className="text-3xl font-bold text-protein-green"
              />
              <span className="text-xl text-protein-green">g</span>
              <p className="text-sm text-dark-secondary mt-2">Avg Daily Protein</p>
            </div>

            <div className="glass-card p-6 text-center">
              <CountUp
                from={0}
                to={parseFloat(stats.proteinGoalRate)}
                duration={1.5}
                className="text-3xl font-bold text-protein-green"
              />
              <span className="text-xl text-protein-green">%</span>
              <p className="text-sm text-dark-secondary mt-2">Protein Goal Hit Rate</p>
            </div>

            <div className="glass-card p-6 text-center">
              <CountUp
                from={0}
                to={stats.totalDays}
                duration={1.5}
                className="text-3xl font-bold text-cyber-blue-400"
              />
              <p className="text-sm text-dark-secondary mt-2">Days Tracked</p>
            </div>
          </motion.div>
        )}

        {/* GitHub-style Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-matrix-green-400 mb-4">Activity Heatmap</h2>
          <p className="text-sm text-dark-secondary mb-6">
            Each square represents a day. Color intensity shows how close you got to your goals.
          </p>
          <GitHubHeatmap data={heatmapData} goals={goals} />
        </motion.div>

        {/* Line Chart - Protein Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-matrix-green-400 mb-6">30-Day Trend</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="protein"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                name="Protein (g)"
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Calories"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Goal Achievement Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h2 className="text-2xl font-bold text-matrix-green-400 mb-6">Goal Achievement Rate</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fill: '#a3a3a3' } }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="proteinPercent"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                name="Protein Goal %"
              />
              <Line
                type="monotone"
                dataKey="caloriesPercent"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Calorie Goal %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
