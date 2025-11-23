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

  useEffect(() => {
    fetchMealsAndCalculateStats();
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

    // 4b. Peak Eating Time (by half hour)
    const eatsByHalfHour = mealsData.reduce((acc, meal) => {
      const date = new Date(meal.consumed_at);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const halfHour = minutes < 30 ? `${hour}:00` : `${hour}:30`;
      acc[halfHour] = (acc[halfHour] || 0) + 1;
      return acc;
    }, {});

    const peakHalfHour = Object.entries(eatsByHalfHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '0:00';

    // 5. Biggest Meal Type (by average calories)
    const avgCaloriesByType = {};
    const countsByType = {};
    mealsData.forEach(meal => {
      avgCaloriesByType[meal.meal_type] = (avgCaloriesByType[meal.meal_type] || 0) + meal.total_calories;
      countsByType[meal.meal_type] = (countsByType[meal.meal_type] || 0) + 1;
    });

    const biggestMealType = Object.entries(avgCaloriesByType)
      .map(([type, total]) => ({
        type,
        avg: total / countsByType[type]
      }))
      .sort((a, b) => b.avg - a.avg)[0]?.type || 'N/A';

    // 6. Eater Type Categorization
    const eaterType = categorizeEaterType(mealsData);

    // 7. Weekly Calorie Distribution
    const weekdayStats = mealsData.reduce((acc, meal) => {
      const day = new Date(meal.consumed_at).getDay(); // 0-6
      if (!acc[day]) acc[day] = { total: 0, count: 0 };
      acc[day].total += meal.total_calories;
      acc[day].count += 1;
      return acc;
    }, {});

    const weeklyData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => ({
      day: dayName,
      avgCalories: weekdayStats[idx] ? Math.round(weekdayStats[idx].total / weekdayStats[idx].count) : 0
    }));

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

    // 10. Average Calories by Meal Type (for visualization)
    const avgCalsByMealType = Object.entries(avgCaloriesByType).map(([type, total]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      avgCalories: Math.round(total / countsByType[type])
    })).sort((a, b) => b.avgCalories - a.avgCalories);

    setStats({
      hourlyData,
      mealTypeData,
      favoriteMealType,
      peakHour: peakHourFormatted,
      peakHalfHour,
      biggestMealType,
      eaterType,
      weeklyData,
      totalMeals,
      avgCaloriesPerMeal,
      favoriteFood: favoriteFood ? { name: favoriteFood[0], count: favoriteFood[1] } : null,
      avgCalsByMealType
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

  const COLORS = ['#1d4ed8', '#f59e0b', '#10b981', '#a855f7', '#ef4444'];

  // Animated background bars
  const bars = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    delay: Math.random() * 4,
    duration: Math.random() * 12 + 14,
    width: Math.random() * 260 + 240,
    height: 6,
    opacity: Math.random() * 0.5 + 0.35,
    offset: Math.random() * 50,
  }));

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-white">
        {/* Animated Background */}
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="absolute"
            style={{
              top: `${bar.id * 6 + bar.offset}%`,
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
      <div className="relative min-h-screen overflow-hidden bg-white">
        {/* Animated Background */}
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="absolute"
            style={{
              top: `${bar.id * 6 + bar.offset}%`,
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
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Animated Background */}
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="absolute"
          style={{
            top: `${bar.id * 6 + bar.offset}%`,
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
            <p className="text-sm text-gray-600 mb-1">Total Meals Logged</p>
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
            <p className="text-3xl font-bold text-orange-600">{stats.peakHalfHour}</p>
            <p className="text-xs text-gray-500 mt-1">Most meals logged</p>
          </motion.div>
        </div>

        {/* Favorite Food Card */}
        {stats.favoriteFood && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-r from-yellow-400 to-orange-400 border-2 border-yellow-500 rounded-xl p-6 shadow-xl mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-1">⭐ Your Favorite Food</h2>
            <p className="text-2xl font-bold text-white">{stats.favoriteFood.name}</p>
            <p className="text-sm text-gray-800 mt-1">Logged {stats.favoriteFood.count} times</p>
          </motion.div>
        )}

        {/* Eater Type Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-purple-600 rounded-xl p-8 shadow-xl mb-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Your Eater Type: {stats.eaterType.primary}</h2>
          <p className="text-purple-100 text-lg">{stats.eaterType.description}</p>
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
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
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
                <Tooltip />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Weekly Calorie Pattern</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgCalories" fill="#10b981" name="Avg Calories" />
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Avg Calories by Meal Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.avgCalsByMealType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgCalories" fill="#f97316" name="Avg Calories" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Additional Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-md"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Biggest Meal Type</p>
              <p className="text-2xl font-bold text-blue-700 capitalize">{stats.biggestMealType}</p>
              <p className="text-xs text-gray-500 mt-1">By average calories</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Most Active Eating Hour</p>
              <p className="text-2xl font-bold text-purple-700">{stats.peakHour}</p>
              <p className="text-xs text-gray-500 mt-1">Most meals logged at this time</p>
            </div>
          </div>
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
