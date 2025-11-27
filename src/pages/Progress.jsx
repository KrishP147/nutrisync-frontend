import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { 
  Flame, 
  Beef, 
  Wheat, 
  Droplets, 
  Leaf,
  Target,
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import GitHubHeatmap from '../components/GitHubHeatmap';
import WeeklyTrends from '../components/WeeklyTrends';
import SetGoals from '../components/SetGoals';
import { useGoals } from '../contexts/GoalsContext';
import { 
  BarChart, Bar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function Progress() {
  const { goals } = useGoals();
  const [heatmapData, setHeatmapData] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barChartView, setBarChartView] = useState('all');

  useEffect(() => {
    fetchProgressData();
  }, [goals]);

  const formatDateLocal = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

    const caloriesMet = todayData.calories >= safeGoals.calories * 0.9 && todayData.calories <= safeGoals.calories * 1.1;
    const proteinMet = todayData.protein >= safeGoals.protein;
    const carbsMet = todayData.carbs >= safeGoals.carbs * 0.9;
    const fatMet = todayData.fat >= safeGoals.fat * 0.9;
    const fiberMet = todayData.fiber >= safeGoals.fiber * 0.9;

    if (caloriesMet && proteinMet && carbsMet && fatMet && fiberMet) {
      const { data: { user } } = await supabase.auth.getUser();

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

  const fetchProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

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
    const safeGoals = {
      calories: goals?.calories || 2000,
      protein: goals?.protein || 150,
      carbs: goals?.carbs || 250,
      fat: goals?.fat || 67,
      fiber: goals?.fiber || 28
    };

    const { data: { user } } = await supabase.auth.getUser();

    const heatmap = {};

    meals.forEach(meal => {
      const dateObj = new Date(meal.consumed_at);
      const date = formatDateLocal(dateObj);

      if (!heatmap[date]) {
        heatmap[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }

      heatmap[date].calories += meal.total_calories || 0;
      heatmap[date].protein += meal.total_protein_g || 0;
      heatmap[date].carbs += meal.total_carbs_g || 0;
      heatmap[date].fat += meal.total_fat_g || 0;
      heatmap[date].fiber += meal.total_fiber_g || 0;
    });

    setHeatmapData(heatmap);
    await checkAndRecordAchievement(heatmap, goals);

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

    const totalDays = Object.keys(heatmap).length;

    if (totalDays === 0) {
      setStats({
        avgCalories: '0', avgProtein: '0', avgCarbs: '0', avgFat: '0', avgFiber: '0',
        proteinGoalRate: '0', calorieGoalRate: '0', goalsMetStreak: 0, totalDays: 0,
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

      let currentDate = achievements[0].achievement_date === todayStr ? 
        new Date(todayStr) : 
        (achievements[0].achievement_date === yesterdayStr ? new Date(yesterdayStr) : null);

      if (currentDate) {
        currentStreak = 1;
        
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
      avgCalories: avgCalories.toFixed(0),
      avgProtein: avgProtein.toFixed(0),
      avgCarbs: avgCarbs.toFixed(0),
      avgFat: avgFat.toFixed(0),
      avgFiber: avgFiber.toFixed(0),
      proteinGoalRate: ((daysHitProteinGoal / totalDays) * 100).toFixed(0),
      calorieGoalRate: ((daysHitCalorieGoal / totalDays) * 100).toFixed(0),
      goalsMetStreak: currentStreak,
      totalDays,
    });
  };

  const statCards = stats ? [
    { label: 'Avg Calories', value: stats.avgCalories, unit: 'kcal', goal: goals?.calories, icon: Flame, color: 'primary' },
    { label: 'Avg Protein', value: stats.avgProtein, unit: 'g', goal: goals?.protein, icon: Beef, color: 'secondary' },
    { label: 'Avg Carbs', value: stats.avgCarbs, unit: 'g', goal: goals?.carbs, icon: Wheat, color: 'amber' },
    { label: 'Avg Fat', value: stats.avgFat, unit: 'g', goal: goals?.fat, icon: Droplets, color: 'blue' },
    { label: 'Avg Fiber', value: stats.avgFiber, unit: 'g', goal: goals?.fiber, icon: Leaf, color: 'green' },
  ] : [];

  const colorStyles = {
    primary: { bg: 'bg-primary-700/10', text: 'text-primary-500', border: 'border-primary-700/30' },
    secondary: { bg: 'bg-secondary-500/10', text: 'text-secondary-400', border: 'border-secondary-500/30' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Loading progress...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-heading font-bold text-white"
            >
              Progress
            </motion.h1>
            <p className="text-white/50 mt-1">Track your nutrition journey over time</p>
          </div>
          
          {/* Streak Display */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`card px-6 py-4 flex items-center gap-4 ${stats.goalsMetStreak > 0 ? 'border-amber-500/30' : ''}`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.goalsMetStreak > 0 ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                <Zap size={24} className={stats.goalsMetStreak > 0 ? 'text-amber-400' : 'text-white/30'} />
              </div>
              <div>
                <p className={`text-3xl font-mono font-bold ${stats.goalsMetStreak > 0 ? 'text-amber-400' : 'text-white/40'}`}>
                  {stats.goalsMetStreak}
                </p>
                <p className="text-white/50 text-sm">Day Streak</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Set Goals */}
        <SetGoals />

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const styles = colorStyles[stat.color];
              
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`card p-5 border ${styles.border}`}
                >
                  <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center mb-3`}>
                    <Icon size={20} className={styles.text} strokeWidth={2} />
                  </div>
                  <p className={`text-2xl font-mono font-bold ${styles.text}`}>
                    {stat.value}
                    <span className="text-sm ml-1">{stat.unit}</span>
                  </p>
                  <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                  {stat.goal && (
                    <p className="text-xs text-white/30 mt-1">Goal: {stat.goal}{stat.unit}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
              <Calendar size={20} className="text-primary-500" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-white">Activity Heatmap</h2>
              <p className="text-white/50 text-sm">Click on a day to see detailed breakdown</p>
            </div>
          </div>
          <GitHubHeatmap data={heatmapData} goals={goals} />
        </motion.div>

        {/* Weekly Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <WeeklyTrends />
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-secondary-400" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-heading font-semibold text-white">Last 7 Days</h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', color: 'primary' },
                { key: 'protein', label: 'Protein', color: 'secondary' },
                { key: 'carbs', label: 'Carbs', color: 'amber' },
                { key: 'fat', label: 'Fat', color: 'blue' },
                { key: 'fiber', label: 'Fiber', color: 'green' },
                { key: 'calories', label: 'Calories', color: 'primary' },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setBarChartView(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    barChartView === key
                      ? `bg-${color === 'primary' ? 'primary-700' : color === 'secondary' ? 'secondary-500' : color === 'amber' ? 'amber-500' : color === 'blue' ? 'blue-500' : 'green-500'} text-white`
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData}>
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
              <Legend />
              {barChartView === 'all' ? (
                <>
                  <Bar dataKey="Protein" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Carbs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Fat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Fiber" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </>
              ) : barChartView === 'protein' ? (
                <Bar dataKey="Protein" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              ) : barChartView === 'carbs' ? (
                <Bar dataKey="Carbs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              ) : barChartView === 'fat' ? (
                <Bar dataKey="Fat" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              ) : barChartView === 'fiber' ? (
                <Bar dataKey="Fiber" fill="#22c55e" radius={[4, 4, 0, 0]} />
              ) : (
                <Bar dataKey="Calories" fill="#047857" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target size={20} className="text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-white">Goal Achievement</h2>
                <p className="text-white/50 text-sm">Average achievement vs goals</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={[
                { metric: 'Protein', value: Math.min((parseFloat(stats.avgProtein) / (goals?.protein || 150)) * 100, 100), fullMark: 100 },
                { metric: 'Carbs', value: Math.min((parseFloat(stats.avgCarbs) / (goals?.carbs || 250)) * 100, 100), fullMark: 100 },
                { metric: 'Fat', value: Math.min((parseFloat(stats.avgFat) / (goals?.fat || 67)) * 100, 100), fullMark: 100 },
                { metric: 'Fiber', value: Math.min((parseFloat(stats.avgFiber) / (goals?.fiber || 30)) * 100, 100), fullMark: 100 },
                { metric: 'Consistency', value: parseFloat(stats.proteinGoalRate), fullMark: 100 },
              ]}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.6)" fontSize={12} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
                <Radar name="Progress" dataKey="value" stroke="#047857" fill="#047857" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => `${parseFloat(value).toFixed(1)}%`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </Sidebar>
  );
}
