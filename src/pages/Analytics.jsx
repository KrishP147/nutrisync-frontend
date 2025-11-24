import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

export default function Analytics() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [customFoods, setCustomFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [creatingFood, setCreatingFood] = useState(false);
  const [newFoodValues, setNewFoodValues] = useState({
    name: '',
    base_calories: 0,
    base_protein_g: 0,
    base_carbs_g: 0,
    base_fat_g: 0,
    base_fiber_g: 0
  });
  const [weeklyPatternView, setWeeklyPatternView] = useState('calories'); // 'calories', 'protein', 'carbs', 'fat', 'fiber'
  const [mealTypeView, setMealTypeView] = useState('calories'); // 'calories', 'protein', 'carbs', 'fat', 'fiber'

  useEffect(() => {
    fetchMealsAndCalculateStats();
    fetchCustomFoods();
  }, []);

  const fetchMealsAndCalculateStats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all meals for the user
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

    // 1. Eating Times Histogram
    const eatsByHour = mealsData.reduce((acc, meal) => {
      const hour = new Date(meal.consumed_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: eatsByHour[i] || 0,
      label: `${i}:00`
    }));

    // 2. Meal Type Distribution
    const mealTypeCounts = mealsData.reduce((acc, meal) => {
      acc[meal.meal_type] = (acc[meal.meal_type] || 0) + 1;
      return acc;
    }, {});

    const mealTypeData = Object.entries(mealTypeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      percentage: ((count / mealsData.length) * 100).toFixed(1)
    }));

    // 3. Favorite Meal Type (mode)
    const favoriteMealType = Object.entries(mealTypeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // 4. Peak Eating Hour
    const peakHour = Object.entries(eatsByHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
    const peakHourFormatted = `${peakHour}:00`;

    // 4b. Peak Eating Time (by 15-minute intervals)
    const eatsByQuarterHour = mealsData.reduce((acc, meal) => {
      const date = new Date(meal.consumed_at);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      // Round to nearest 15-minute interval
      const quarter = Math.floor(minutes / 15) * 15;
      const quarterHour = `${hour}:${quarter.toString().padStart(2, '0')}`;
      acc[quarterHour] = (acc[quarterHour] || 0) + 1;
      return acc;
    }, {});

    const peakQuarterHour = Object.entries(eatsByQuarterHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '0:00';

    // 5. Biggest Meal Type (by average calories)
    const macrosByType = {};
    const countsByType = {};
    mealsData.forEach(meal => {
      if (!macrosByType[meal.meal_type]) {
        macrosByType[meal.meal_type] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        };
      }
      macrosByType[meal.meal_type].calories += meal.total_calories || 0;
      macrosByType[meal.meal_type].protein += meal.total_protein_g || 0;
      macrosByType[meal.meal_type].carbs += meal.total_carbs_g || 0;
      macrosByType[meal.meal_type].fat += meal.total_fat_g || 0;
      macrosByType[meal.meal_type].fiber += meal.total_fiber_g || 0;
      countsByType[meal.meal_type] = (countsByType[meal.meal_type] || 0) + 1;
    });

    const biggestMealType = Object.entries(macrosByType)
      .map(([type, totals]) => ({
        type,
        avg: totals.calories / countsByType[type]
      }))
      .sort((a, b) => b.avg - a.avg)[0]?.type || 'N/A';

    // 6. Eating Style Categorization
    const eaterType = categorizeEaterType(mealsData);

    // 7. Weekly Calorie Distribution (and macros)
    const weekdayStats = mealsData.reduce((acc, meal) => {
      const day = new Date(meal.consumed_at).getDay(); // 0-6
      if (!acc[day]) acc[day] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        count: 0
      };
      acc[day].calories += meal.total_calories || 0;
      acc[day].protein += meal.total_protein_g || 0;
      acc[day].carbs += meal.total_carbs_g || 0;
      acc[day].fat += meal.total_fat_g || 0;
      acc[day].fiber += meal.total_fiber_g || 0;
      acc[day].count += 1;
      return acc;
    }, {});

    // Start week with Monday instead of Sunday
    const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
      // Map Monday-Sunday (1-6, 0) to correct indices
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

    // 8. Total meals and average calories
    const totalMeals = mealsData.length;
    const avgCaloriesPerMeal = Math.round(
      mealsData.reduce((sum, m) => sum + m.total_calories, 0) / totalMeals
    );

    // 9. Favorite Food (most common meal)
    const mealCounts = mealsData.reduce((acc, meal) => {
      const mealName = meal.meal_name.replace(/\s*\([0-9.]+[xg]*\)$/, ''); // Remove multiplier suffix
      acc[mealName] = (acc[mealName] || 0) + 1;
      return acc;
    }, {});

    const favoriteFood = Object.entries(mealCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // 10. Average Calories/Macros by Meal Type (for visualization)
    const avgByMealType = Object.entries(macrosByType).map(([type, totals]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      avgCalories: Math.round(totals.calories / countsByType[type]),
      avgProtein: parseFloat((totals.protein / countsByType[type]).toFixed(1)),
      avgCarbs: parseFloat((totals.carbs / countsByType[type]).toFixed(1)),
      avgFat: parseFloat((totals.fat / countsByType[type]).toFixed(1)),
      avgFiber: parseFloat((totals.fiber / countsByType[type]).toFixed(1))
    })).sort((a, b) => b.avgCalories - a.avgCalories);

    setStats({
      hourlyData,
      mealTypeData,
      favoriteMealType,
      peakHour: peakHourFormatted,
      peakQuarterHour,
      biggestMealType,
      eaterType,
      weeklyData,
      totalMeals,
      avgCaloriesPerMeal,
      favoriteFood: favoriteFood ? { name: favoriteFood[0], count: favoriteFood[1] } : null,
      avgByMealType
    });
  };

  const categorizeEaterType = (mealsData) => {
    // Group meals by date for daily calculations
    const mealsByDate = mealsData.reduce((acc, meal) => {
      const date = new Date(meal.consumed_at).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(meal);
      return acc;
    }, {});

    const dailyStats = Object.values(mealsByDate).map(dayMeals => {
      const totalCals = dayMeals.reduce((sum, m) => sum + m.total_calories, 0);

      // Early Bird: 50% before 11am AND after 5am
      const earlyBirdCals = dayMeals
        .filter(m => {
          const hour = new Date(m.consumed_at).getHours();
          return hour >= 5 && hour < 11;
        })
        .reduce((sum, m) => sum + m.total_calories, 0);

      // Night Owl: 50% after 8pm AND before midnight
      const nightOwlCals = dayMeals
        .filter(m => {
          const hour = new Date(m.consumed_at).getHours();
          return hour >= 20 && hour < 24;
        })
        .reduce((sum, m) => sum + m.total_calories, 0);

      // Hungry Demon: 50% between midnight and 5am
      const hungryDemonCals = dayMeals
        .filter(m => {
          const hour = new Date(m.consumed_at).getHours();
          return hour >= 0 && hour < 5;
        })
        .reduce((sum, m) => sum + m.total_calories, 0);

      return {
        totalCals,
        earlyBirdCals,
        nightOwlCals,
        hungryDemonCals,
        mealCount: dayMeals.length,
        avgPerMeal: totalCals / dayMeals.length
      };
    });

    const avgMealsPerDay = dailyStats.reduce((sum, d) => sum + d.mealCount, 0) / dailyStats.length;
    const avgCalPerMeal = dailyStats.reduce((sum, d) => sum + d.avgPerMeal, 0) / dailyStats.length;

    const earlyBirdDays = dailyStats.filter(d => d.totalCals > 0 && d.earlyBirdCals / d.totalCals >= 0.5).length;
    const nightOwlDays = dailyStats.filter(d => d.totalCals > 0 && d.nightOwlCals / d.totalCals >= 0.5).length;
    const hungryDemonDays = dailyStats.filter(d => d.totalCals > 0 && d.hungryDemonCals / d.totalCals >= 0.5).length;

    // Determine primary type (in order of priority)
    // 1. Grazer
    if (avgMealsPerDay >= 5 && avgCalPerMeal < 400) return { primary: 'Grazer', description: '5+ meals per day, averaging <400 calories each' };

    // 2. Three Square Meals
    if (avgMealsPerDay >= 3 && avgMealsPerDay <= 4 && avgCalPerMeal > 500) return { primary: 'Three Square Meals', description: '3-4 meals per day, averaging >500 calories each' };

    // 3. Snack Lover
    const snackCount = mealsData.filter(m => m.meal_type === 'snack').length;
    if (snackCount / mealsData.length >= 0.5) return { primary: 'Snack Lover', description: '50%+ of your meals are snacks' };

    // 4. Early Bird
    if (earlyBirdDays / dailyStats.length >= 0.5) return { primary: 'Early Bird', description: 'You consume 50%+ of daily calories between 5am-11am' };

    // 5. Night Owl
    if (nightOwlDays / dailyStats.length >= 0.5) return { primary: 'Night Owl', description: 'You consume 50%+ of daily calories between 8pm-midnight' };

    // 6. Hungry Demon
    if (hungryDemonDays / dailyStats.length >= 0.5) return { primary: 'Hungry Demon', description: 'You consume 50%+ of daily calories between midnight-5am' };

    // Calculate meal type averages
    const mealTypeAvgs = {};
    const mealTypeCounts = {};
    mealsData.forEach(m => {
      mealTypeAvgs[m.meal_type] = (mealTypeAvgs[m.meal_type] || 0) + m.total_calories;
      mealTypeCounts[m.meal_type] = (mealTypeCounts[m.meal_type] || 0) + 1;
    });

    const breakfastAvg = mealTypeAvgs['breakfast'] / (mealTypeCounts['breakfast'] || 1);
    const lunchAvg = mealTypeAvgs['lunch'] / (mealTypeCounts['lunch'] || 1);
    const dinnerAvg = mealTypeAvgs['dinner'] / (mealTypeCounts['dinner'] || 1);

    // 7. Big Breakfast
    if (breakfastAvg > 600 && breakfastAvg > lunchAvg * 1.5 && breakfastAvg > dinnerAvg * 1.5) {
      return { primary: 'Big Breakfast', description: 'Breakfast averages >600 cal, 150%+ of other meals' };
    }

    // 8. Lunch Champion
    if (lunchAvg > 700 && lunchAvg > breakfastAvg && lunchAvg > dinnerAvg) {
      return { primary: 'Lunch Champion', description: 'Lunch is your biggest meal, averaging >700 cal' };
    }

    // 9. Dinner Focused
    if (dinnerAvg > 800 && dinnerAvg > breakfastAvg && dinnerAvg > lunchAvg) {
      return { primary: 'Dinner Focused', description: 'Dinner is your biggest meal, averaging >800 cal' };
    }

    // 10. Balanced Eater
    const dailyCalVariances = dailyStats.map(d => d.totalCals);
    const avgDailyCals = dailyCalVariances.reduce((sum, c) => sum + c, 0) / dailyCalVariances.length;
    const variance = dailyCalVariances.reduce((sum, c) => sum + Math.abs(c - avgDailyCals), 0) / dailyCalVariances.length;
    const variancePercent = (variance / avgDailyCals) * 100;

    if (variancePercent < 15) return { primary: 'Consistent', description: 'Daily calorie variance <15%' };
    if (variancePercent > 40) return { primary: 'Variable', description: 'Daily calorie variance >40%' };

    // 11. Weekend Warrior
    const weekendCals = mealsData.filter(m => {
      const day = new Date(m.consumed_at).getDay();
      return day === 0 || day === 6;
    }).reduce((sum, m) => sum + m.total_calories, 0);
    const weekdayCals = mealsData.filter(m => {
      const day = new Date(m.consumed_at).getDay();
      return day >= 1 && day <= 5;
    }).reduce((sum, m) => sum + m.total_calories, 0);

    const weekendMeals = mealsData.filter(m => {
      const day = new Date(m.consumed_at).getDay();
      return day === 0 || day === 6;
    }).length;
    const weekdayMeals = mealsData.filter(m => {
      const day = new Date(m.consumed_at).getDay();
      return day >= 1 && day <= 5;
    }).length;

    if (weekendMeals > 0 && weekdayMeals > 0) {
      const weekendAvg = weekendCals / weekendMeals;
      const weekdayAvg = weekdayCals / weekdayMeals;
      if (weekendAvg > weekdayAvg * 1.3) {
        return { primary: 'Weekend Warrior', description: 'You consume 30%+ more on weekends' };
      }
    }

    return { primary: 'Balanced Eater', description: 'Calories distributed evenly across meals' };
  };

  const fetchCustomFoods = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('user_foods')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomFoods(data);
    }
  };

  const handleEditFood = (food) => {
    setEditingFood(food.id);
    setEditValues({
      name: food.name,
      base_calories: food.base_calories,
      base_protein_g: food.base_protein_g,
      base_carbs_g: food.base_carbs_g,
      base_fat_g: food.base_fat_g,
      base_fiber_g: food.base_fiber_g
    });
  };

  const handleSaveFood = async (foodId) => {
    const { error } = await supabase
      .from('user_foods')
      .update(editValues)
      .eq('id', foodId);

    if (!error) {
      await fetchCustomFoods();
      setEditingFood(null);
      setEditValues({});
    } else {
      alert('Failed to update food');
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!confirm('Delete this custom food? This will not affect past meal logs.')) return;

    const { error } = await supabase
      .from('user_foods')
      .delete()
      .eq('id', foodId);

    if (!error) {
      await fetchCustomFoods();
    } else {
      alert('Failed to delete food');
    }
  };

  const handleCreateFood = async () => {
    if (!newFoodValues.name.trim()) {
      alert('Please enter a food name');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('user_foods')
      .insert([{
        user_id: user.id,
        name: newFoodValues.name,
        base_calories: parseInt(newFoodValues.base_calories) || 0,
        base_protein_g: parseFloat(newFoodValues.base_protein_g) || 0,
        base_carbs_g: parseFloat(newFoodValues.base_carbs_g) || 0,
        base_fat_g: parseFloat(newFoodValues.base_fat_g) || 0,
        base_fiber_g: parseFloat(newFoodValues.base_fiber_g) || 0,
        source: 'manual_creation'
      }]);

    if (!error) {
      await fetchCustomFoods();
      setCreatingFood(false);
      setNewFoodValues({
        name: '',
        base_calories: 0,
        base_protein_g: 0,
        base_carbs_g: 0,
        base_fat_g: 0,
        base_fiber_g: 0
      });
      alert(`✅ "${newFoodValues.name}" created successfully!`);
    } else {
      alert('Failed to create food: ' + error.message);
    }
  };

  const COLORS = ['#1d4ed8', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];

  // Animated background bars - taller and faster
  const bars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    duration: Math.random() * 8 + 10,
    width: Math.random() * 260 + 240,
    height: 6,
    opacity: Math.random() * 0.5 + 0.35,
    offset: Math.random() * 30,
  }));

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-amber-50">
        {/* Animated Background */}
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="absolute"
            style={{
              top: `${bar.id * 4.5 + bar.offset}%`,
              left: "-40%",
              width: bar.width,
              height: bar.height,
              opacity: bar.opacity,
              background: "linear-gradient(90deg, #00eaff, #00ff95)",
              transform: "rotate(-32deg)",
            }}
            animate={{
              x: ["0%", "220%", "0%"],
              y: ["0%", "40%", "0%"],
            }}
            transition={{
              duration: bar.duration,
              delay: bar.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        <div className="relative z-10">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <p className="text-center text-gray-600 py-12">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-amber-50">
        {/* Animated Background */}
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="absolute"
            style={{
              top: `${bar.id * 4.5 + bar.offset}%`,
              left: "-40%",
              width: bar.width,
              height: bar.height,
              opacity: bar.opacity,
              background: "linear-gradient(90deg, #00eaff, #00ff95)",
              transform: "rotate(-32deg)",
            }}
            animate={{
              x: ["0%", "220%", "0%"],
              y: ["0%", "40%", "0%"],
            }}
            transition={{
              duration: bar.duration,
              delay: bar.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        <div className="relative z-10">
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Data Yet</h2>
              <p className="text-gray-600">Start logging meals to see your insights!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-amber-50">
      {/* Animated Background */}
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="absolute"
          style={{
            top: `${bar.id * 4.5 + bar.offset}%`,
            left: "-40%",
            width: bar.width,
            height: bar.height,
            opacity: bar.opacity,
            background: "linear-gradient(90deg, #00eaff, #00ff95)",
            transform: "rotate(-32deg)",
          }}
          animate={{
            x: ["0%", "220%", "0%"],
            y: ["0%", "40%", "0%"],
          }}
          transition={{
            duration: bar.duration,
            delay: bar.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="relative z-10">
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Analytics & Insights</h1>
          <p className="text-gray-600">Discover your eating patterns and nutrition trends</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-md"
          >
            <p className="text-sm text-gray-600 mb-1">Total {stats.totalMeals === 1 ? 'Meal' : 'Meals'} Logged</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalMeals}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-green-300 rounded-xl p-6 shadow-md"
          >
            <p className="text-sm text-gray-600 mb-1">Avg Calories/Meal</p>
            <p className="text-3xl font-bold text-green-600">{stats.avgCaloriesPerMeal}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-purple-300 rounded-xl p-6 shadow-md"
          >
            <p className="text-sm text-gray-600 mb-1">Favorite Meal Type</p>
            <p className="text-3xl font-bold text-purple-600 capitalize">{stats.favoriteMealType}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-orange-300 rounded-xl p-6 shadow-md"
          >
            <p className="text-sm text-gray-600 mb-1">Peak Eating Time</p>
            <p className="text-3xl font-bold text-orange-600">{stats.peakQuarterHour}</p>
            <p className="text-xs text-gray-500 mt-1">Most meals logged (15min intervals)</p>
          </motion.div>
        </div>

        {/* Favorite Food Card */}
        {stats.favoriteFood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white border-4 border-yellow-500 rounded-xl p-6 shadow-xl mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">⭐ Your Favorite Food</h2>
            <p className="text-2xl font-bold text-yellow-600">{stats.favoriteFood.name}</p>
            <p className="text-sm text-gray-700 mt-1">Logged {stats.favoriteFood.count} times</p>
          </motion.div>
        )}

        {/* Eater Type Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border-4 border-blue-800 rounded-xl p-8 shadow-xl mb-8"
        >
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Your Eating Style: {stats.eaterType.primary}</h2>
          <p className="text-gray-700 text-lg">{stats.eaterType.description}</p>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Eating Times Histogram */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white border-2 border-blue-300 rounded-xl p-6 shadow-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Eating Times</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value === 1 ? '1 meal' : `${value} meals`, '']}
                  labelFormatter={(label) => `Hour: ${label}`}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Meals" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Meal Type Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white border-2 border-purple-300 rounded-xl p-6 shadow-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Meal Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.mealTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {stats.mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value === 1 ? '1 meal logged' : `${value} meals logged`} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Calorie Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white border-2 border-green-300 rounded-xl p-6 shadow-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Weekly Pattern</h2>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setWeeklyPatternView('calories')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    weeklyPatternView === 'calories'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cal
                </button>
                <button
                  onClick={() => setWeeklyPatternView('protein')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    weeklyPatternView === 'protein'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pro
                </button>
                <button
                  onClick={() => setWeeklyPatternView('carbs')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    weeklyPatternView === 'carbs'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Carb
                </button>
                <button
                  onClick={() => setWeeklyPatternView('fat')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    weeklyPatternView === 'fat'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fat
                </button>
                <button
                  onClick={() => setWeeklyPatternView('fiber')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    weeklyPatternView === 'fiber'
                      ? 'bg-red-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fib
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                {weeklyPatternView === 'calories' && <Bar dataKey="avgCalories" fill="#10b981" name="Avg Calories" />}
                {weeklyPatternView === 'protein' && <Bar dataKey="avgProtein" fill="#1d4ed8" name="Avg Protein (g)" />}
                {weeklyPatternView === 'carbs' && <Bar dataKey="avgCarbs" fill="#f59e0b" name="Avg Carbs (g)" />}
                {weeklyPatternView === 'fat' && <Bar dataKey="avgFat" fill="#a855f7" name="Avg Fat (g)" />}
                {weeklyPatternView === 'fiber' && <Bar dataKey="avgFiber" fill="#800000" name="Avg Fiber (g)" />}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Avg Calories by Meal Type */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.85 }}
            className="bg-white border-2 border-orange-300 rounded-xl p-6 shadow-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Avg by Meal Type</h2>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setMealTypeView('calories')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    mealTypeView === 'calories'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cal
                </button>
                <button
                  onClick={() => setMealTypeView('protein')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    mealTypeView === 'protein'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pro
                </button>
                <button
                  onClick={() => setMealTypeView('carbs')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    mealTypeView === 'carbs'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Carb
                </button>
                <button
                  onClick={() => setMealTypeView('fat')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    mealTypeView === 'fat'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fat
                </button>
                <button
                  onClick={() => setMealTypeView('fiber')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    mealTypeView === 'fiber'
                      ? 'bg-red-900 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fib
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.avgByMealType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                {mealTypeView === 'calories' && <Bar dataKey="avgCalories" fill="#10b981" name="Avg Calories" />}
                {mealTypeView === 'protein' && <Bar dataKey="avgProtein" fill="#1d4ed8" name="Avg Protein (g)" />}
                {mealTypeView === 'carbs' && <Bar dataKey="avgCarbs" fill="#f59e0b" name="Avg Carbs (g)" />}
                {mealTypeView === 'fat' && <Bar dataKey="avgFat" fill="#a855f7" name="Avg Fat (g)" />}
                {mealTypeView === 'fiber' && <Bar dataKey="avgFiber" fill="#800000" name="Avg Fiber (g)" />}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* My Foods Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white border-2 border-purple-300 rounded-xl p-6 shadow-md mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">⭐ My Custom Foods</h2>
            <button
              onClick={() => setCreatingFood(!creatingFood)}
              className={`${creatingFood ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-lg transition font-medium text-sm`}
            >
              {creatingFood ? '✕ Cancel' : '+ Create New Food'}
            </button>
          </div>

          {/* Create New Food Form */}
          {creatingFood && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
              <h3 className="font-bold text-gray-900 mb-3">Create New Custom Food</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                  <input
                    type="text"
                    value={newFoodValues.name}
                    onChange={(e) => setNewFoodValues({...newFoodValues, name: e.target.value})}
                    placeholder="e.g., My Protein Shake"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Calories</label>
                    <input
                      type="number"
                      value={newFoodValues.base_calories}
                      onChange={(e) => setNewFoodValues({...newFoodValues, base_calories: parseInt(e.target.value) || 0})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodValues.base_protein_g}
                      onChange={(e) => setNewFoodValues({...newFoodValues, base_protein_g: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodValues.base_carbs_g}
                      onChange={(e) => setNewFoodValues({...newFoodValues, base_carbs_g: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodValues.base_fat_g}
                      onChange={(e) => setNewFoodValues({...newFoodValues, base_fat_g: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Fiber (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={newFoodValues.base_fiber_g}
                      onChange={(e) => setNewFoodValues({...newFoodValues, base_fiber_g: parseFloat(e.target.value) || 0})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">All values are per 100g</p>
                <button
                  onClick={handleCreateFood}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  Create Food
                </button>
              </div>
            </div>
          )}

          {customFoods.length === 0 && !creatingFood ? (
            <p className="text-gray-600 text-center py-8">
              No custom foods saved yet. Click "Create New Food" above or save foods from your meal logs.
            </p>
          ) : (
            <div className="space-y-3">
              {customFoods.map(food => (
                <div key={food.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  {editingFood === food.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editValues.name}
                        onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                        placeholder="Food name"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-600">Calories</label>
                          <input
                            type="number"
                            value={editValues.base_calories}
                            onChange={(e) => setEditValues({...editValues, base_calories: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Protein (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.base_protein_g}
                            onChange={(e) => setEditValues({...editValues, base_protein_g: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Carbs (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.base_carbs_g}
                            onChange={(e) => setEditValues({...editValues, base_carbs_g: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Fat (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.base_fat_g}
                            onChange={(e) => setEditValues({...editValues, base_fat_g: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Fiber (g)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editValues.base_fiber_g}
                            onChange={(e) => setEditValues({...editValues, base_fiber_g: parseFloat(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveFood(food.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingFood(null)}
                          className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{food.name}</h3>
                        {food.original_food_name && (
                          <p className="text-xs text-gray-500">Based on: {food.original_food_name}</p>
                        )}
                        <div className="grid grid-cols-5 gap-2 mt-2 text-sm text-gray-700">
                          <div><span className="font-semibold">{food.base_calories}</span> cal</div>
                          <div><span className="font-semibold">{food.base_protein_g}g</span> protein</div>
                          <div><span className="font-semibold">{food.base_carbs_g}g</span> carbs</div>
                          <div><span className="font-semibold">{food.base_fat_g}g</span> fat</div>
                          <div><span className="font-semibold">{food.base_fiber_g}g</span> fiber</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">per 100g</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditFood(food)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFood(food.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Photo Gallery Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8"
        >
          <button
            onClick={() => navigate('/gallery')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl hover:from-purple-600 hover:to-pink-600 transition shadow-lg font-semibold text-lg"
          >
            📸 View Photo Gallery
          </button>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
