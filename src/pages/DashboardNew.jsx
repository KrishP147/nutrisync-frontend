import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import MacroCircles from '../components/MacroCircles';
import TodayPieChart from '../components/TodayPieChart';
import Recommendations from '../components/Recommendations';
import MealList from '../components/MealList';
import NutritionByTimeHistogram from '../components/NutritionByTimeHistogram';
import BackgroundCircles from '../components/ui/BackgroundCircles';
import { motion } from 'motion/react';

export default function DashboardNew() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  useEffect(() => {
    fetchTodaysMeals();
  }, [refreshTrigger]);

  const fetchTodaysMeals = async () => {
    setLoadingMeals(true);
    const { data: { user } } = await supabase.auth.getUser();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', today.toISOString())
      .lt('consumed_at', tomorrow.toISOString())
      .order('consumed_at', { ascending: true });

    if (!error && data) {
      setTodaysMeals(data);
    }
    setLoadingMeals(false);
  };

  const handleMealChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated circles background */}
      <div className="fixed inset-0">
        <BackgroundCircles variant="primary" />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Today's Pie Chart */}
        <TodayPieChart key={refreshTrigger} />

        {/* Macro Circles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <MacroCircles key={refreshTrigger} />
        </motion.div>

        {/* Nutrition by Time Histogram */}
        {!loadingMeals && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white border-2 border-purple-500 rounded-xl p-6 shadow-xl">
              <NutritionByTimeHistogram meals={todaysMeals} />
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Recommendations key={refreshTrigger} />
        </motion.div>

        {/* Recent Meals - Scrollable Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-black mb-4">Recent Meals</h2>
          <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100 rounded-xl p-6 border-2 border-blue-400 shadow-xl max-h-[600px] overflow-y-auto custom-scrollbar-light">
            <MealList 
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealChange}
              onMealUpdated={handleMealChange}
              limit={10}
              variant="light-green"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
