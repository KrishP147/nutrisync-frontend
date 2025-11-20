import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import MacroCircles from '../components/MacroCircles';
import TodayPieChart from '../components/TodayPieChart';
import Recommendations from '../components/Recommendations';
import MealList from '../components/MealList';
import BackgroundCircles from '../components/ui/BackgroundCircles';
import { motion } from 'motion/react';

export default function DashboardNew() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67
  });

  useEffect(() => {
    fetchGoals();
  }, [refreshTrigger]);

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching goals:', error);
      }

      if (data) {
        setGoals({
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat
        });
      }
    } catch (error) {
      console.error('Error in fetchGoals:', error);
    }
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
          <MacroCircles key={refreshTrigger} goals={goals} />
        </motion.div>

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
