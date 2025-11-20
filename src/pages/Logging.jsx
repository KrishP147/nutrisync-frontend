import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import MealForm from '../components/MealForm';
import PhotoMealUpload from '../components/PhotoMealUpload';
import { format } from 'date-fns';
import FloatingLines from '../components/ui/FloatingLines';
import { motion } from 'motion/react';

export default function Logging() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todaysMeals, setTodaysMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysMeals();
  }, [refreshTrigger]);

  const fetchTodaysMeals = async () => {
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
      .order('consumed_at', { ascending: false });

    if (!error && data) {
      setTodaysMeals(data);
    }
    setLoading(false);
  };

  const handleMealAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDelete = async (mealId) => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId);

    if (!error) {
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const getTimeOfDay = (date) => {
    const hour = new Date(date).getHours();
    if (hour < 12) return '🌅 Breakfast';
    if (hour < 17) return '☀️ Lunch';
    if (hour < 21) return '🌆 Dinner';
    return '🌙 Late Night';
  };

  return (
    <div className="min-h-screen bg-dark-primary relative">
      {/* Background Effect */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <FloatingLines
          linesGradient={['#22c55e', '#16a34a', '#15803d']}
          enabledWaves={['middle']}
          lineCount={8}
          lineDistance={6}
          animationSpeed={0.5}
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
          <h1 className="text-4xl font-bold text-matrix-green-400 mb-2">Log Your Meals</h1>
          <p className="text-dark-secondary">Track your nutrition throughout the day</p>
        </motion.div>

        {/* Logging Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PhotoMealUpload onMealAdded={handleMealAdded} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MealForm onMealAdded={handleMealAdded} />
          </motion.div>
        </div>

        {/* Logged Today Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-lg p-6"
        >
          <h2 className="text-2xl font-bold text-matrix-green-400 mb-6">Logged Today</h2>

          {loading ? (
            <div className="text-center py-8 text-dark-secondary">Loading...</div>
          ) : todaysMeals.length === 0 ? (
            <div className="text-center py-8 text-dark-secondary">
              No meals logged today yet. Start logging above!
            </div>
          ) : (
            <div className="space-y-4">
              {todaysMeals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-dark-secondary/50 rounded-lg p-4 border border-dark hover:border-matrix-green-900/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-dark-secondary">
                          {getTimeOfDay(meal.consumed_at)}
                        </span>
                        <span className="text-sm text-dark-secondary">•</span>
                        <span className="text-sm text-dark-secondary">
                          {format(new Date(meal.consumed_at), 'h:mm a')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-matrix-green-400">
                        {meal.name}
                      </h3>
                      {meal.description && (
                        <p className="text-sm text-dark-secondary mt-1">{meal.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(meal.id)}
                      className="text-red-500 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-2 bg-dark-primary/50 rounded">
                      <p className="text-lg font-bold text-matrix-green-400">
                        {meal.total_calories}
                      </p>
                      <p className="text-xs text-dark-secondary">Calories</p>
                    </div>
                    <div className="text-center p-2 bg-dark-primary/50 rounded">
                      <p className="text-lg font-bold text-protein-green">
                        {meal.total_protein_g?.toFixed(1)}g
                      </p>
                      <p className="text-xs text-dark-secondary">Protein</p>
                    </div>
                    <div className="text-center p-2 bg-dark-primary/50 rounded">
                      <p className="text-lg font-bold text-carbs-blue">
                        {meal.total_carbs_g?.toFixed(1)}g
                      </p>
                      <p className="text-xs text-dark-secondary">Carbs</p>
                    </div>
                    <div className="text-center p-2 bg-dark-primary/50 rounded">
                      <p className="text-lg font-bold text-fat-orange">
                        {meal.total_fat_g?.toFixed(1)}g
                      </p>
                      <p className="text-xs text-dark-secondary">Fat</p>
                    </div>
                    <div className="text-center p-2 bg-dark-primary/50 rounded">
                      <p className="text-lg font-bold text-fiber-purple">
                        {meal.total_fiber_g?.toFixed(1)}g
                      </p>
                      <p className="text-xs text-dark-secondary">Fiber</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
