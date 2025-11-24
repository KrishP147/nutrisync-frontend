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
  const [barChartView, setBarChartView] = useState('all'); // 'all', 'protein', 'carbs', 'fat', 'fiber', 'calories'

  useEffect(() => {
    fetchProgressData();
  }, [goals]); // Re-fetch when goals change

  // Check and record achievement for today
  const checkAndRecordAchievement = async (heatmap, goals) => {
    const today = new Date();
    const todayStr = formatDateLocal(today);
    const todayData = heatmap[todayStr];

    if (!todayData) return;

    const safeGoals = {
      calories: goals.calories || 2000,
      protein: goals.protein || 150,
      carbs: goals.carbs || 200,
      fat: goals.fat || 67,
      fiber: goals.fiber || 30,
    };

    // Check if all goals were met
    const caloriesMet = todayData.calories >= safeGoals.calories * 0.9 && todayData.calories <= safeGoals.calories * 1.1;
    const proteinMet = todayData.protein >= safeGoals.protein;
    const carbsMet = todayData.carbs >= safeGoals.carbs * 0.9;
    const fatMet = todayData.fat >= safeGoals.fat * 0.9;
    const fiberMet = todayData.fiber >= safeGoals.fiber * 0.9;

    if (caloriesMet && proteinMet && carbsMet && fatMet && fiberMet) {
      const { data: { user } } = await supabase.auth.getUser();

      // Record achievement (upsert - insert or update if exists)
      await supabase
        .from('daily_achievements')
        .upsert({
          user_id: user.id,
          achievement_date: todayStr,
          calories_goal: safeGoals.calories,
          protein_goal: safeGoals.protein,
          carbs_goal: safeGoals.carbs,
          fat_goal: safeGoals.fat,
          fiber_goal: safeGoals.fiber,
          calories_actual: Math.round(todayData.calories),
          protein_actual: parseFloat(todayData.protein.toFixed(1)),
          carbs_actual: parseFloat(todayData.carbs.toFixed(1)),
          fat_actual: parseFloat(todayData.fat.toFixed(1)),
          fiber_actual: parseFloat(todayData.fiber.toFixed(1)),
        }, {
          onConflict: 'user_id,achievement_date'
        });
    }
  };

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateLocal = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchProgressData = async () => {
    try {
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
        await processData(data);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processData = async (meals) => {
    // Use default goals if not loaded
    const safeGoals = {
      calories: goals?.calories || 2000,
      protein: goals?.protein || 150,
      carbs: goals?.carbs || 250,
      fat: goals?.fat || 67,
      fiber: goals?.fiber || 28
    };

    const { data: { user } } = await supabase.auth.getUser();

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

    // Check and record achievement for today
    await checkAndRecordAchievement(heatmap, goals);

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
          Calories: parseFloat(data.calories.toFixed(1)),
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
        avgCarbs: '0',
        avgFat: '0',
        avgFiber: '0',
        proteinGoalRate: '0',
        calorieGoalRate: '0',
        goalsMetStreak: 0,
        totalDays: 0,
      });
      return;
    }

    const avgCalories = Object.values(heatmap).reduce((sum, day) => sum + day.calories, 0) / totalDays;
    const avgProtein = Object.values(heatmap).reduce((sum, day) => sum + day.protein, 0) / totalDays;
    const avgCarbs = Object.values(heatmap).reduce((sum, day) => sum + day.carbs, 0) / totalDays;
    const avgFat = Object.values(heatmap).reduce((sum, day) => sum + day.fat, 0) / totalDays;
    const avgFiber = Object.values(heatmap).reduce((sum, day) => sum + day.fiber, 0) / totalDays;

    const daysHitProteinGoal = Object.values(heatmap).filter(day => day.protein >= safeGoals.protein).length;
    const daysHitCalorieGoal = Object.values(heatmap).filter(
      day => day.calories >= safeGoals.calories * 0.9 && day.calories <= safeGoals.calories * 1.1
    ).length;

    // Calculate goals met streak from achievements table
    const { data: achievements } = await supabase
      .from('daily_achievements')
      .select('achievement_date')
      .eq('user_id', user.id)
      .order('achievement_date', { ascending: false });

    let currentStreak = 0;
    
    if (achievements && achievements.length > 0) {
      const today = new Date();
      const todayStr = formatDateLocal(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateLocal(yesterday);

      // Start counting from today or yesterday
      let currentDate = achievements[0].achievement_date === todayStr ? 
        new Date(todayStr) : 
        (achievements[0].achievement_date === yesterdayStr ? new Date(yesterdayStr) : null);

      if (currentDate) {
        currentStreak = 1;
        
        // Count consecutive days
        for (let i = 1; i < achievements.length; i++) {
          const prevDate = new Date(currentDate);
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = formatDateLocal(prevDate);
          
          if (achievements[i].achievement_date === prevDateStr) {
            currentStreak++;
            currentDate = prevDate;
          } else {
            break;
          }
        }
      }
    }

    setStats({
      avgCalories: avgCalories.toFixed(1),
      avgProtein: avgProtein.toFixed(1),
      avgCarbs: avgCarbs.toFixed(1),
      avgFat: avgFat.toFixed(1),
      avgFiber: avgFiber.toFixed(1),
      proteinGoalRate: ((daysHitProteinGoal / totalDays) * 100).toFixed(0),
      calorieGoalRate: ((daysHitCalorieGoal / totalDays) * 100).toFixed(0),
      goalsMetStreak: currentStreak,
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

        {/* GitHub-style Heatmap with Streak Counter */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 mb-8 shadow-xl"
        >
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-black">Activity Heatmap</h2>
            <p className="text-sm text-gray-600 mt-1">
              Each square represents a day. Hover over a day to see detailed breakdown.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <GitHubHeatmap data={heatmapData} goals={goals} />
            </div>
            {stats && (
              <div className="flex flex-col items-center justify-center px-8 border-l-2 border-purple-300">
                <span className="text-6xl mb-2">🔥</span>
                <p className="text-5xl font-black text-black leading-none mb-1">
                  {stats.goalsMetStreak}
                </p>
                <p className="text-lg font-bold text-gray-800">Day Streak</p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.goalsMetStreak > 0 ? 'Keep it up!' : 'Start your streak!'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-green-600">{stats.avgCalories}</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Calories</p>
              <p className="text-xs text-green-600 mt-1">Goal: {goals.calories}</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-blue-600">{stats.avgProtein}g</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Protein</p>
              <p className="text-xs text-blue-600 mt-1">Goal: {goals.protein}g</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-orange-600">{stats.avgCarbs}g</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Carbs</p>
              <p className="text-xs text-orange-600 mt-1">Goal: {goals.carbs}g</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-purple-600">{stats.avgFat}g</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Fat</p>
              <p className="text-xs text-purple-600 mt-1">Goal: {goals.fat}g</p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm border-2 border-purple-500 rounded-xl p-6 text-center shadow-xl">
              <p className="text-3xl font-bold text-red-900">{stats.avgFiber}g</p>
              <p className="text-sm text-gray-600 mt-2">Avg Daily Fiber</p>
              <p className="text-xs text-red-900 mt-1">Goal: {goals.fiber}g</p>
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Last 7 Days - Macro Breakdown</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setBarChartView('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Macros
              </button>
              <button
                onClick={() => setBarChartView('protein')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'protein'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Protein
              </button>
              <button
                onClick={() => setBarChartView('carbs')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'carbs'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Carbs
              </button>
              <button
                onClick={() => setBarChartView('fat')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'fat'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fat
              </button>
              <button
                onClick={() => setBarChartView('fiber')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'fiber'
                    ? 'bg-red-900 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fiber
              </button>
              <button
                onClick={() => setBarChartView('calories')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  barChartView === 'calories'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Calories
              </button>
            </div>
          </div>
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
              {barChartView === 'all' ? (
                <>
                  <Bar dataKey="Protein" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Carbs" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Fat" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Fiber" fill="#800000" radius={[8, 8, 0, 0]} />
                </>
              ) : barChartView === 'protein' ? (
                <>
                  <Bar dataKey="Protein" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey={() => goals.protein} stroke="#1d4ed8" strokeWidth={2} strokeDasharray="5 5" name="Protein Goal" dot={false} />
                </>
              ) : barChartView === 'carbs' ? (
                <>
                  <Bar dataKey="Carbs" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey={() => goals.carbs} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Carbs Goal" dot={false} />
                </>
              ) : barChartView === 'fat' ? (
                <>
                  <Bar dataKey="Fat" fill="#a855f7" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey={() => goals.fat} stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" name="Fat Goal" dot={false} />
                </>
              ) : barChartView === 'fiber' ? (
                <>
                  <Bar dataKey="Fiber" fill="#800000" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey={() => goals.fiber} stroke="#800000" strokeWidth={2} strokeDasharray="5 5" name="Fiber Goal" dot={false} />
                </>
              ) : (
                <>
                  <Bar dataKey="Calories" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey={() => goals.calories} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Calorie Goal" dot={false} />
                </>
              )}
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
                  metric: 'Protein',
                  value: Math.min((parseFloat(stats.avgProtein) / goals.protein) * 100, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Carbs',
                  value: Math.min((parseFloat(stats.avgCarbs) / goals.carbs) * 100, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Fat',
                  value: Math.min((parseFloat(stats.avgFat) / goals.fat) * 100, 100),
                  fullMark: 100,
                },
                {
                  metric: 'Fiber',
                  value: Math.min((parseFloat(stats.avgFiber) / goals.fiber) * 100, 100),
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
                  formatter={(value) => `${parseFloat(value).toFixed(1)}%`}
                />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-sm text-gray-600 mt-4">
              Shows your average achievement percentage vs goals across all metrics
            </p>
          </motion.div>
        )}
      </div>
    </AuroraBackground>
  );
}
