import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Flame, Beef, Wheat, Droplets, Leaf } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import MealList from '../components/MealList';
import NutritionByTimeHistogram from '../components/NutritionByTimeHistogram';

export default function DailyView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { goals } = useGoals();
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDayData();
  }, [date, refreshTrigger]);

  const fetchDayData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const [year, month, day] = date.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', dayStart.toISOString())
      .lte('consumed_at', dayEnd.toISOString())
      .order('consumed_at', { ascending: true });

    if (data) {
      setMeals(data);
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      setSummary(totals);
    } else {
      setMeals([]);
      setSummary({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    }
    setLoading(false);
  };

  const handleMealChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getProgress = (value, goal) => {
    if (!goal) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const macroCards = summary ? [
    { label: 'Calories', value: Math.round(summary.calories), goal: goals?.calories || 2000, unit: 'kcal', icon: Flame, color: 'primary', barColor: 'bg-primary-700' },
    { label: 'Protein', value: Math.round(summary.protein), goal: goals?.protein || 150, unit: 'g', icon: Beef, color: 'secondary', barColor: 'bg-secondary-500' },
    { label: 'Carbs', value: Math.round(summary.carbs), goal: goals?.carbs || 250, unit: 'g', icon: Wheat, color: 'amber', barColor: 'bg-amber-500' },
    { label: 'Fat', value: Math.round(summary.fat), goal: goals?.fat || 65, unit: 'g', icon: Droplets, color: 'blue', barColor: 'bg-blue-500' },
    { label: 'Fiber', value: Math.round(summary.fiber), goal: goals?.fiber || 30, unit: 'g', icon: Leaf, color: 'green', barColor: 'bg-green-500' },
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
          <div className="text-white/60">Loading...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/progress')} className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-white">
              Daily Summary
            </motion.h1>
            <div className="flex items-center gap-2 text-white/50 mt-1">
              <Calendar size={16} />
              <span>{formatDate(date)}</span>
            </div>
          </div>
        </div>

        {/* Macro Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {macroCards.map((macro, index) => {
            const Icon = macro.icon;
            const styles = colorStyles[macro.color];
            const progress = getProgress(macro.value, macro.goal);
            
            return (
              <motion.div
                key={macro.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card p-5 border ${styles.border}`}
              >
                <div className={`w-10 h-10 rounded-lg ${styles.bg} flex items-center justify-center mb-3`}>
                  <Icon size={20} className={styles.text} strokeWidth={2} />
                </div>
                <p className={`text-2xl font-mono font-bold ${styles.text}`}>
                  {macro.value}
                  <span className="text-sm ml-1">{macro.unit}</span>
                </p>
                <p className="text-white/50 text-sm">{macro.label}</p>
                <div className="mt-3 progress-bar">
                  <div className={`progress-fill ${macro.barColor}`} style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-white/30 mt-1">{progress}% of {macro.goal}{macro.unit}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Nutrition Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <h2 className="text-lg font-heading font-semibold text-white mb-4">Nutrition Timeline</h2>
          <NutritionByTimeHistogram meals={meals} />
        </motion.div>

        {/* Meals List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-xl font-heading font-semibold text-white mb-4">
            Meals on {formatDate(date)}
          </h2>
          <div className="card p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            <MealList
              specificDate={date}
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealChange}
              onMealUpdated={handleMealChange}
            />
          </div>
        </motion.div>
      </div>
    </Sidebar>
  );
}
