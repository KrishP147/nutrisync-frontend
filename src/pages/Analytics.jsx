import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Clock, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Waves,
  GitBranch,
  Crosshair,
  Triangle,
  Grid3X3,
  LayoutGrid,
  Info,
  Sun,
  Box
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  NutrientStreamGraph, 
  CalorieFlowSankey, 
  NutrientDensityScatter,
  MealFrequencyHeatmap,
  MealCompositionTreeMap,
  MacroRatioTernary,
  MealTimingSunburst,
  MealNutrientSpace3D
} from '../components/charts';
import { useGoals } from '../contexts/GoalsContext';
import ChartErrorBoundary from '../components/ChartErrorBoundary';

export default function Analytics() {
  const { goals } = useGoals();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [weeklyPatternView, setWeeklyPatternView] = useState('calories');
  const [showInfoEatingTimes, setShowInfoEatingTimes] = useState(false);
  const [showInfoMealDist, setShowInfoMealDist] = useState(false);
  const [showInfoWeekly, setShowInfoWeekly] = useState(false);

  useEffect(() => {
    fetchMealsAndCalculateStats();
  }, []);

  const fetchMealsAndCalculateStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('consumed_at', { ascending: false });

    if (!error && data) {
      setMeals(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  const calculateStats = (mealsData) => {
    if (mealsData.length === 0) {
      setStats(null);
      return;
    }

    // Eating Times Histogram
    const eatsByHour = mealsData.reduce((acc, meal) => {
      const hour = new Date(meal.consumed_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i, count: eatsByHour[i] || 0, label: `${i}:00`
    }));

    // Meal Type Distribution
    const mealTypeCounts = mealsData.reduce((acc, meal) => {
      acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
      return acc;
    }, {});

    const mealTypeData = Object.entries(mealTypeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: ((count / mealsData.length) * 100).toFixed(1)
    }));

    const favoriteMealType = Object.entries(mealTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const peakHour = Object.entries(eatsByHour).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

    // Macros by type
    const macrosByType = {};
    const countsByType = {};
    mealsData.forEach(meal => {
      if (!macrosByType[meal.meal_type]) {
        macrosByType[meal.meal_type] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }
      macrosByType[meal.meal_type].calories += meal.total_calories || 0;
      macrosByType[meal.meal_type].protein += meal.total_protein_g || 0;
      macrosByType[meal.meal_type].carbs += meal.total_carbs_g || 0;
      macrosByType[meal.meal_type].fat += meal.total_fat_g || 0;
      macrosByType[meal.meal_type].fiber += meal.total_fiber_g || 0;
      countsByType[meal.meal_type] = (countsByType[meal.meal_type] || 0) + 1;
    });

    const biggestMealType = Object.entries(macrosByType)
      .map(([type, totals]) => ({ type, avg: totals.calories / countsByType[type] }))
      .sort((a, b) => b.avg - a.avg)[0]?.type || 'N/A';

    const eaterType = categorizeEaterType(mealsData);

    // Weekly Data
    const weekdayStats = mealsData.reduce((acc, meal) => {
      const day = new Date(meal.consumed_at).getDay();
      if (!acc[day]) acc[day] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, count: 0 };
      acc[day].calories += meal.total_calories || 0;
      acc[day].protein += meal.total_protein_g || 0;
      acc[day].carbs += meal.total_carbs_g || 0;
      acc[day].fat += meal.total_fat_g || 0;
      acc[day].fiber += meal.total_fiber_g || 0;
      acc[day].count += 1;
      return acc;
    }, {});

    const weeklyData = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'].map((dayName, idx) => {
      const dayIndex = idx === 6 ? 0 : idx + 1;
      return {
        day: dayName,
        'Avg Calories': weekdayStats[dayIndex] ? Math.round(weekdayStats[dayIndex].calories / weekdayStats[dayIndex].count) : 0,
        'Avg Protein': weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].protein / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        'Avg Carbs': weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].carbs / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        'Avg Fat': weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].fat / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        'Avg Fiber': weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].fiber / weekdayStats[dayIndex].count).toFixed(1)) : 0
      };
    });

    const totalMeals = mealsData.length;
    const avgCaloriesPerMeal = Math.round(mealsData.reduce((sum, m) => sum + m.total_calories, 0) / totalMeals);

    const mealCounts = mealsData.reduce((acc, meal) => {
      const mealName = meal.meal_name.replace(/\s*\([0-9.]+[xg]*\)$/, '');
      acc[mealName] = (acc[mealName] || 0) + 1;
      return acc;
    }, {});
    const favoriteFood = Object.entries(mealCounts).sort((a, b) => b[1] - a[1])[0];

    setStats({
      hourlyData, mealTypeData, favoriteMealType, peakHour: `${peakHour}:00`,
      biggestMealType, eaterType, weeklyData, totalMeals, avgCaloriesPerMeal,
      favoriteFood: favoriteFood ? { name: favoriteFood[0], count: favoriteFood[1] } : null,
    });
  };

  const categorizeEaterType = (mealsData) => {
    const mealsByDate = mealsData.reduce((acc, meal) => {
      const date = new Date(meal.consumed_at).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(meal);
      return acc;
    }, {});

    const dailyStats = Object.values(mealsByDate).map(dayMeals => {
      const totalCals = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);
      const earlyBirdCals = dayMeals.filter(m => { const h = new Date(m.consumed_at).getHours(); return h >= 5 && h < 11; }).reduce((sum, m) => sum + m.total_calories, 0);
      const nightOwlCals = dayMeals.filter(m => { const h = new Date(m.consumed_at).getHours(); return h >= 20 && h < 24; }).reduce((sum, m) => sum + m.total_calories, 0);
      return { totalCals, earlyBirdCals, nightOwlCals, mealCount: dayMeals.length, avgPerMeal: totalCals / dayMeals.length };
    });

    const avgMealsPerDay = dailyStats.reduce((sum, d) => sum + d.mealCount, 0) / dailyStats.length;
    const avgCalPerMeal = dailyStats.reduce((sum, d) => sum + d.avgPerMeal, 0) / dailyStats.length;

    if (avgMealsPerDay >= 5 && avgCalPerMeal < 400) return { primary: 'Grazer', description: '5+ small meals per day' };
    if (avgMealsPerDay >= 3 && avgMealsPerDay <= 4 && avgCalPerMeal > 500) return { primary: 'Three Square Meals', description: '3-4 substantial meals per day' };
    
    const snackCount = mealsData.filter(m => m.meal_type === 'snack').length;
    if (snackCount / mealsData.length >= 0.5) return { primary: 'Snack Lover', description: '50%+ of meals are snacks' };

    const earlyBirdDays = dailyStats.filter(d => d.totalCals > 0 && d.earlyBirdCals / d.totalCals >= 0.5).length;
    const nightOwlDays = dailyStats.filter(d => d.totalCals > 0 && d.nightOwlCals / d.totalCals >= 0.5).length;

    if (earlyBirdDays / dailyStats.length >= 0.5) return { primary: 'Early Bird', description: 'Most calories before 11am' };
    if (nightOwlDays / dailyStats.length >= 0.5) return { primary: 'Night Owl', description: 'Most calories after 8pm' };

    return { primary: 'Balanced Eater', description: 'Evenly distributed meals' };
  };

  const COLORS = ['#047857', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444'];

  const getWeeklyDataKey = () => {
    switch (weeklyPatternView) {
      case 'calories': return 'Avg Calories';
      case 'protein': return 'Avg Protein';
      case 'carbs': return 'Avg Carbs';
      case 'fat': return 'Avg Fat';
      case 'fiber': return 'Avg Fiber';
      default: return 'Avg Calories';
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Loading analytics...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-white">
            Analytics
          </motion.h1>
          <p className="text-white/50 mt-1">Insights into your eating patterns</p>
        </div>

        {!stats ? (
          <div className="card p-12 text-center">
            <BarChart3 size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Log some meals to see your analytics</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <p className="text-3xl font-mono font-bold text-primary-500">{stats.totalMeals}</p>
                <p className="text-white/50 text-sm mt-1">Total Meals</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
                <p className="text-3xl font-mono font-bold text-secondary-400">{stats.avgCaloriesPerMeal}</p>
                <p className="text-white/50 text-sm mt-1">Avg Cal/Meal</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
                <p className="text-3xl font-mono font-bold text-amber-400">{stats.peakHour}</p>
                <p className="text-white/50 text-sm mt-1">Peak Eating Time</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5 border-primary-700/30">
                <p className="text-xl font-heading font-bold text-primary-500">{stats.eaterType.primary}</p>
                <p className="text-white/50 text-xs mt-1">{stats.eaterType.description}</p>
              </motion.div>
            </div>

            {/* Eating Times */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                    <Clock size={20} className="text-secondary-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-white">Eating Times</h2>
                    <p className="text-white/50 text-sm">When you eat by meal count</p>
                  </div>
                </div>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowInfoEatingTimes(true)}
                  onMouseLeave={() => setShowInfoEatingTimes(false)}
                >
                  <Info size={18} className="text-white/40 hover:text-white/70 cursor-help" />
                  {showInfoEatingTimes && (
                    <div className="absolute right-0 top-6 w-64 bg-black border border-white/10 rounded-lg p-3 text-xs text-white/70 z-20">
                      Shows how many meals you log at each hour. Higher bars = more frequent eating times.
                    </div>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={10} interval={3} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} 
                    formatter={(value) => [`${value} ${value === 1 ? 'meal' : 'meals'} logged`]} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Meal Type Distribution */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <PieChartIcon size={20} className="text-amber-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-white">Meal Distribution</h2>
                    <p className="text-white/50 text-sm">Breakdown by meal type</p>
                  </div>
                </div>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowInfoMealDist(true)}
                  onMouseLeave={() => setShowInfoMealDist(false)}
                >
                  <Info size={18} className="text-white/40 hover:text-white/70 cursor-help" />
                  {showInfoMealDist && (
                    <div className="absolute right-0 top-6 w-64 bg-black border border-white/10 rounded-lg p-3 text-xs text-white/70 z-20">
                      Shows the proportion of meals by type: Breakfast, Lunch, Dinner, and Snacks.
                    </div>
                  )}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={stats.mealTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percentage }) => `${name} ${percentage}%`}>
                    {stats.mealTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                    formatter={(value) => [`${value} ${value === 1 ? 'meal' : 'meals'} logged`]} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Weekly Pattern */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary-500" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-white">Weekly Pattern</h2>
                    <p className="text-white/50 text-sm">Average intake by day</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {['calories', 'protein', 'carbs', 'fat', 'fiber'].map((key) => (
                      <button key={key} onClick={() => setWeeklyPatternView(key)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${weeklyPatternView === key ? 'bg-primary-700 text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}>
                        {key}
                      </button>
                    ))}
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowInfoWeekly(true)}
                    onMouseLeave={() => setShowInfoWeekly(false)}
                  >
                    <Info size={18} className="text-white/40 hover:text-white/70 cursor-help" />
                    {showInfoWeekly && (
                      <div className="absolute right-0 top-6 w-64 bg-black border border-white/10 rounded-lg p-3 text-xs text-white/70 z-20">
                        Shows your average nutrient intake for each day of the week. Use the buttons to switch between different nutrients.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey={getWeeklyDataKey()}
                    fill={weeklyPatternView === 'calories' ? '#047857' : weeklyPatternView === 'protein' ? '#0ea5e9' : weeklyPatternView === 'carbs' ? '#f59e0b' : weeklyPatternView === 'fat' ? '#a855f7' : '#22c55e'}
                    radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Nutrient Stream */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                  <Waves size={20} className="text-secondary-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Nutrient Flow</h2>
                  <p className="text-white/50 text-sm">Macro distribution over time</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <NutrientStreamGraph data={stats.weeklyData.map(d => ({
                  date: d.day,
                  protein: d['Avg Protein'],
                  carbs: d['Avg Carbs'],
                  fat: d['Avg Fat'],
                  fiber: d['Avg Fiber']
                }))} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Calorie Flow Sankey */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <GitBranch size={20} className="text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Calorie Flow</h2>
                  <p className="text-white/50 text-sm">From meals to macros</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <CalorieFlowSankey meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Nutrient Density Scatter */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                  <Crosshair size={20} className="text-secondary-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Meal Quality</h2>
                  <p className="text-white/50 text-sm">Nutrient density per meal</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <NutrientDensityScatter meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Macro Ratio Ternary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Triangle size={20} className="text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Macro Ratios</h2>
                  <p className="text-white/50 text-sm">P/C/F balance per meal</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <MacroRatioTernary meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Meal Frequency Heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
                  <Grid3X3 size={20} className="text-primary-500" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Eating Schedule</h2>
                  <p className="text-white/50 text-sm">When you eat by hour and day</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <MealFrequencyHeatmap meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Meal Composition TreeMap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <LayoutGrid size={20} className="text-purple-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Food Categories</h2>
                  <p className="text-white/50 text-sm">What dominates your diet</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <MealCompositionTreeMap meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* Meal Timing Sunburst */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sun size={20} className="text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">Meal Hierarchy</h2>
                  <p className="text-white/50 text-sm">Meal type → Time → Food category</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <MealTimingSunburst meals={meals} />
              </ChartErrorBoundary>
            </motion.div>

            {/* 3D Nutrient Space */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }} className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                  <Box size={20} className="text-secondary-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-white">3D Nutrient Space</h2>
                  <p className="text-white/50 text-sm">Explore meals in protein-carb-fat space</p>
                </div>
              </div>
              <ChartErrorBoundary>
                <MealNutrientSpace3D meals={meals} />
              </ChartErrorBoundary>
            </motion.div>
          </>
        )}
      </div>
    </Sidebar>
  );
}
