import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import GitHubHeatmap from '../components/GitHubHeatmap';
import WeeklyTrends from '../components/WeeklyTrends';
import SetGoals from '../components/SetGoals';
import UserProfile from '../components/UserProfile';
import AuroraBackground from '../components/ui/AuroraBackground';
import { useGoals } from '../contexts/GoalsContext';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { motion } from 'motion/react';

export default function Progress() {
  const { goals } = useGoals();
  const [heatmapData, setHeatmapData] = useState({});
  const [lineChartData, setLineChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, [goals]); // Re-fetch when goals change

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
    // Use default goals if not loaded
    const safeGoals = {
      calories: goals?.calories || 2000,
      protein: goals?.protein || 150,
      carbs: goals?.carbs || 250,
      fat: goals?.fat || 67
    };

    // Helper to format date as YYYY-MM-DD in local time
    const formatDateLocal = (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Process for heatmap
    const heatmap = {};

    meals.forEach(meal => {
      const dateObj = new Date(meal.consumed_at);
      const date = formatDateLocal(dateObj);

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
      .map(([date, data]) => {
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          calories: data.calories,
          protein: data.protein.toFixed(1),
          carbs: data.carbs.toFixed(1),
          fat: data.fat.toFixed(1),
          proteinPercent: ((data.protein / safeGoals.protein) * 100).toFixed(0),
          caloriesPercent: ((data.calories / safeGoals.calories) * 100).toFixed(0),
        };
      });

    setLineChartData(last30Days);

    // Process for bar chart (last 7 days)
    const last7Days = Object.entries(heatmap)
      .slice(-7)
      .map(([date, data]) => {
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return {
          date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          Protein: parseFloat(data.protein.toFixed(1)),
          Carbs: parseFloat(data.carbs.toFixed(1)),
          Fat: parseFloat(data.fat.toFixed(1)),
          Fiber: parseFloat(data.fiber.toFixed(1)),
        };
      });

    setBarChartData(last7Days);

    // Calculate stats
    const totalDays = Object.keys(heatmap).length;

    if (totalDays === 0) {
      setStats({
        avgCalories: '0',
        avgProtein: '0',
        proteinGoalRate: '0',
        calorieGoalRate: '0',
        totalDays: 0,
      });
      return;
    }

    const avgCalories = Object.values(heatmap).reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const avgProtein = Object.values(heatmap).reduce((sum, day) => sum + day.protein, 0) / totalDays;

    const daysHitProteinGoal = Object.values(heatmap).filter(day => day.protein >= safeGoals.protein).length;
    const daysHitCalorieGoal = Object.values(heatmap).filter(
      day => day.calories >= safeGoals.calories * 0.9 && day.calories <= safeGoals.calories * 1.1
    ).length;

    setStats({
      avgCalories: avgCalories.toFixed(1),
      avgProtein: avgProtein.toFixed(1),
      proteinGoalRate: ((daysHitProteinGoal / totalDays) * 100).toFixed(0),
      calorieGoalRate: ((daysHitCalorieGoal / totalDays) * 100).toFixed(0),
      totalDays,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading progress...</div>
      </div>
    );
  }

  return (
    <AuroraBackground>
      <Navigation />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-black mb-2">Your Progress</h1>
          <p className="text-gray-600">Track your nutrition journey over time</p>
        </motion.div>

        {/* Set Goals Component */}
        <SetGoals />

        {/* GitHub-style Heatmap - Now First */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 mb-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-black mb-4">Activity Heatmap</h2>
          <p className="text-sm text-gray-600 mb-6">
            Each square represents a day. Hover over a day to see detailed breakdown.
          </p>
          <GitHubHeatmap data={heatmapData} goals={goals} />
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-purple-600">{stats.avgCalories}</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Calories</p>
              <p className="text-xs text-purple-500 mt-1">Goal: {goals.calories}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-blue-600">{stats.avgProtein}g</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Protein</p>
              <p className="text-xs text-blue-600 mt-1">Goal: {goals.protein}g</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-purple-600">{stats.proteinGoalRate}%</p>
              <p className="text-sm text-gray-600 mt-2">Protein Goal Hit Rate</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-orange-600">{stats.calorieGoalRate}%</p>
              <p className="text-sm text-gray-600 mt-2">Calorie Goal Hit Rate</p>
            </div>
          </motion.div>
        )}

        {/* Weekly Trends */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <WeeklyTrends />
        </motion.div>

        {/* Bar Chart - Last 7 Days Macros */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 mb-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-black mb-6">Last 7 Days - Macro Breakdown</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #a855f7',
                  borderRadius: '8px',
                  color: '#000000'
                }}
              />
              <Legend />
              <Bar dataKey="Protein" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Carbs" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Fat" fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Fiber" fill="#a855f7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart - Goal Achievement */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold text-black mb-6">Goal Achievement Overview</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={[
                {
                  metric: 'Calories',
                  value: Math.min((parseFloat(stats.avgCalories) / goals.calories) * 100, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Protein',
                  value: Math.min((parseFloat(stats.avgProtein) / goals.protein) * 100, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Carbs',
                  value: Math.min((parseFloat(stats.avgProtein) / goals.carbs) * 85, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Fat',
                  value: Math.min((parseFloat(stats.avgProtein) / goals.fat) * 95, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Consistency',
                  value: parseFloat(stats.proteinGoalRate),
                  fullMark: 100,
                },
              ]}>
                <PolarGrid stroke="#a855f7" />
                <PolarAngleAxis dataKey="metric" stroke="#374151" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                <Radar name="Your Progress" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #a855f7',
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-sm text-gray-600 mt-4">
              Shows your average achievement vs goals across all metrics
            </p>
          </motion.div>
        )}
      </div>
    </AuroraBackground>
  );
}
