import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Clock, 
  PieChart as PieChartIcon, 
  Utensils, 
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Star
} from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [customFoods, setCustomFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [creatingFood, setCreatingFood] = useState(false);
  const [newFoodValues, setNewFoodValues] = useState({
    name: '', base_calories: 0, base_protein_g: 0, base_carbs_g: 0, base_fat_g: 0, base_fiber_g: 0
  });
  const [weeklyPatternView, setWeeklyPatternView] = useState('calories');
  const [mealTypeView, setMealTypeView] = useState('calories');

  useEffect(() => {
    fetchMealsAndCalculateStats();
    fetchCustomFoods();
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

    const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
      const dayIndex = idx === 6 ? 0 : idx + 1;
      return {
        day: dayName,
        avgCalories: weekdayStats[dayIndex] ? Math.round(weekdayStats[dayIndex].calories / weekdayStats[dayIndex].count) : 0,
        avgProtein: weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].protein / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        avgCarbs: weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].carbs / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        avgFat: weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].fat / weekdayStats[dayIndex].count).toFixed(1)) : 0,
        avgFiber: weekdayStats[dayIndex] ? parseFloat((weekdayStats[dayIndex].fiber / weekdayStats[dayIndex].count).toFixed(1)) : 0
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

    const avgByMealType = Object.entries(macrosByType).map(([type, totals]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      avgCalories: Math.round(totals.calories / countsByType[type]),
      avgProtein: parseFloat((totals.protein / countsByType[type]).toFixed(1)),
      avgCarbs: parseFloat((totals.carbs / countsByType[type]).toFixed(1)),
      avgFat: parseFloat((totals.fat / countsByType[type]).toFixed(1)),
      avgFiber: parseFloat((totals.fiber / countsByType[type]).toFixed(1))
    })).sort((a, b) => b.avgCalories - a.avgCalories);

    setStats({
      hourlyData, mealTypeData, favoriteMealType, peakHour: `${peakHour}:00`,
      biggestMealType, eaterType, weeklyData, totalMeals, avgCaloriesPerMeal,
      favoriteFood: favoriteFood ? { name: favoriteFood[0], count: favoriteFood[1] } : null,
      avgByMealType
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

  const fetchCustomFoods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('user_foods').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!error && data) setCustomFoods(data);
  };

  const handleEditFood = (food) => {
    setEditingFood(food.id);
    setEditValues({ name: food.name, base_calories: food.base_calories, base_protein_g: food.base_protein_g, base_carbs_g: food.base_carbs_g, base_fat_g: food.base_fat_g, base_fiber_g: food.base_fiber_g });
  };

  const handleSaveFood = async (foodId) => {
    const { error } = await supabase.from('user_foods').update(editValues).eq('id', foodId);
    if (!error) { await fetchCustomFoods(); setEditingFood(null); setEditValues({}); }
  };

  const handleDeleteFood = async (foodId) => {
    if (!confirm('Delete this custom food?')) return;
    const { error } = await supabase.from('user_foods').delete().eq('id', foodId);
    if (!error) await fetchCustomFoods();
  };

  const handleCreateFood = async () => {
    if (!newFoodValues.name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('user_foods').insert([{ user_id: user.id, ...newFoodValues, source: 'manual_creation' }]);
    if (!error) {
      await fetchCustomFoods();
      setCreatingFood(false);
      setNewFoodValues({ name: '', base_calories: 0, base_protein_g: 0, base_carbs_g: 0, base_fat_g: 0, base_fiber_g: 0 });
    }
  };

  const COLORS = ['#047857', '#0ea5e9', '#f59e0b', '#3b82f6', '#ef4444'];

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
      <div className="max-w-6xl mx-auto space-y-8">
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Eating Times */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-secondary-500/10 flex items-center justify-center">
                    <Clock size={20} className="text-secondary-400" strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-white">Eating Times</h2>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={10} interval={3} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} 
                      formatter={(value) => [`${value} ${value === 1 ? 'meal' : 'meals'} logged`]} />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Meal Type Distribution */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <PieChartIcon size={20} className="text-amber-400" strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-white">Meal Distribution</h2>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={stats.mealTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percentage }) => `${name} ${percentage}%`}>
                      {stats.mealTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                      formatter={(value) => [`${value} ${value === 1 ? 'meal' : 'meals'} logged`]} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Weekly Pattern */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-primary-500" strokeWidth={2} />
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-white">Weekly Pattern</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['calories', 'protein', 'carbs', 'fat', 'fiber'].map((key) => (
                    <button key={key} onClick={() => setWeeklyPatternView(key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${weeklyPatternView === key ? 'bg-primary-700 text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}>
                      {key}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey={weeklyPatternView === 'calories' ? 'avgCalories' : `avg${weeklyPatternView.charAt(0).toUpperCase() + weeklyPatternView.slice(1)}`}
                    fill={weeklyPatternView === 'calories' ? '#047857' : weeklyPatternView === 'protein' ? '#0ea5e9' : weeklyPatternView === 'carbs' ? '#f59e0b' : weeklyPatternView === 'fat' ? '#3b82f6' : '#22c55e'}
                    radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Custom Foods Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Star size={20} className="text-amber-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-white">My Foods</h2>
                    <p className="text-white/50 text-sm">{customFoods.length} custom foods saved</p>
                  </div>
                </div>
                <button onClick={() => setCreatingFood(true)} className="btn-primary">
                  <Plus size={18} /> Add Food
                </button>
              </div>

              {/* Create New Food Form */}
              {creatingFood && (
                <div className="bg-surface-300 border border-white/10 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-white mb-4">Create New Food</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
                    <input type="text" placeholder="Food name" value={newFoodValues.name} onChange={(e) => setNewFoodValues({ ...newFoodValues, name: e.target.value })}
                      className="input col-span-2 lg:col-span-1" />
                    <input type="number" placeholder="Calories" min="0" value={newFoodValues.base_calories} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_calories: e.target.value })}
                      className="input" />
                    <input type="number" placeholder="Protein" min="0" step="0.1" value={newFoodValues.base_protein_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_protein_g: e.target.value })}
                      className="input" />
                    <input type="number" placeholder="Carbs" min="0" step="0.1" value={newFoodValues.base_carbs_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_carbs_g: e.target.value })}
                      className="input" />
                    <input type="number" placeholder="Fat" min="0" step="0.1" value={newFoodValues.base_fat_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_fat_g: e.target.value })}
                      className="input" />
                    <input type="number" placeholder="Fiber" min="0" step="0.1" value={newFoodValues.base_fiber_g} onChange={(e) => setNewFoodValues({ ...newFoodValues, base_fiber_g: e.target.value })}
                      className="input" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCreateFood} className="btn-primary"><Save size={16} /> Save</button>
                    <button onClick={() => setCreatingFood(false)} className="btn-ghost"><X size={16} /> Cancel</button>
                  </div>
                </div>
              )}

              {/* Custom Foods List */}
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {customFoods.length === 0 ? (
                  <p className="text-white/40 text-center py-8">No custom foods yet</p>
                ) : (
                  customFoods.map((food) => (
                    <div key={food.id} className="bg-surface-300 border border-white/5 rounded-lg p-4">
                      {editingFood === food.id ? (
                        <div className="space-y-3">
                          <input type="text" value={editValues.name} onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} className="input" />
                          <div className="grid grid-cols-5 gap-2">
                            <input type="number" min="0" value={editValues.base_calories} onChange={(e) => setEditValues({ ...editValues, base_calories: e.target.value })} className="input text-center" />
                            <input type="number" min="0" step="0.1" value={editValues.base_protein_g} onChange={(e) => setEditValues({ ...editValues, base_protein_g: e.target.value })} className="input text-center" />
                            <input type="number" min="0" step="0.1" value={editValues.base_carbs_g} onChange={(e) => setEditValues({ ...editValues, base_carbs_g: e.target.value })} className="input text-center" />
                            <input type="number" min="0" step="0.1" value={editValues.base_fat_g} onChange={(e) => setEditValues({ ...editValues, base_fat_g: e.target.value })} className="input text-center" />
                            <input type="number" min="0" step="0.1" value={editValues.base_fiber_g} onChange={(e) => setEditValues({ ...editValues, base_fiber_g: e.target.value })} className="input text-center" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveFood(food.id)} className="btn-primary text-sm"><Save size={14} /> Save</button>
                            <button onClick={() => setEditingFood(null)} className="btn-ghost text-sm"><X size={14} /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{food.name}</p>
                            <p className="text-white/50 text-sm">
                              {food.base_calories} cal | {food.base_protein_g}g P | {food.base_carbs_g}g C | {food.base_fat_g}g F | {food.base_fiber_g}g Fiber
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditFood(food)} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDeleteFood(food.id)} className="p-2 rounded-lg bg-white/5 text-red-400 hover:bg-red-500/10">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </Sidebar>
  );
}
