import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'motion/react';
import BackgroundCircles from '../components/ui/BackgroundCircles';
import MealList from '../components/MealList';
import NutritionByTimeHistogram from '../components/NutritionByTimeHistogram';

export default function DailyView() {
  const { date } = useParams(); // Date in format YYYY-MM-DD
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

    // Parse the date string as local time (not UTC)
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
      // No meals for this day
      setMeals([]);
      setSummary({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
    }
    setLoading(false);
  };

  const handleMealChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Format the date for display
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const macros = [
    {
      name: 'Calories',
      value: summary.calories,
      goal: goals.calories,
      color: '#22c55e',
      unit: ''
    },
    {
      name: 'Protein',
      value: summary.protein,
      goal: goals.protein,
      color: '#1d4ed8',
      unit: 'g'
    },
    {
      name: 'Carbs',
      value: summary.carbs,
      goal: goals.carbs,
      color: '#f59e0b',
      unit: 'g'
    },
    {
      name: 'Fat',
      value: summary.fat,
      goal: goals.fat,
      color: '#a855f7',
      unit: 'g'
    },
    {
      name: 'Fiber',
      value: summary.fiber,
      goal: goals.fiber,
      color: '#800000',
      unit: 'g'
    }
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated circles background */}
      <div className="fixed inset-0">
        <BackgroundCircles variant="primary" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Back Button and Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/progress')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Progress
          </button>
          <div>
            <h1 className="text-3xl font-bold text-black">{formatDate(date)}</h1>
            <p className="text-gray-600">Daily nutrition overview</p>
          </div>
        </div>

        {/* Macro Circles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white border-2 border-purple-500 rounded-xl p-8 shadow-xl">
            <h2 className="text-3xl font-bold text-black mb-8 text-center">Nutrition Summary</h2>
            
            {summary.calories === 0 && summary.protein === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No meals logged for this day</p>
                <p className="text-gray-500 text-sm mt-2">All values are at 0%</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
              {macros.map((macro, index) => {
                const actualPercentage = (macro.value / macro.goal) * 100;
                const displayPercentage = Math.min(actualPercentage, 100);
                const isOver = actualPercentage > 100;
                const isWayOver = actualPercentage > 130;
                
                let bgColor = 'bg-white';
                let borderColor = 'border-transparent';
                let warningIcon = null;
                
                if (isWayOver) {
                  bgColor = 'bg-red-50';
                  borderColor = 'border-red-400';
                  warningIcon = '⚠️';
                } else if (isOver) {
                  bgColor = 'bg-orange-50';
                  borderColor = 'border-orange-400';
                  warningIcon = '⚠️';
                }
                
                return (
                  <motion.div
                    key={macro.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 ${bgColor} ${borderColor} transition-all`}
                  >
                    <div className="w-32 h-32 mb-4 relative">
                      <CircularProgressbar
                        value={displayPercentage}
                        text={`${Math.round(displayPercentage)}%`}
                        styles={buildStyles({
                          pathColor: isWayOver ? '#ef4444' : isOver ? '#f97316' : macro.color,
                          textColor: isWayOver ? '#ef4444' : isOver ? '#f97316' : macro.color,
                          trailColor: '#f0f0f0',
                          textSize: '20px',
                          pathTransitionDuration: 0.5,
                        })}
                      />
                      {warningIcon && (
                        <div className="absolute -top-2 -right-2 text-2xl">
                          {warningIcon}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-black">{macro.name}</h3>
                    <p className="text-2xl font-bold" style={{ color: isWayOver ? '#ef4444' : isOver ? '#f97316' : macro.color }}>
                      {macro.value.toFixed(1)}{macro.unit}
                    </p>
                    <p className="text-sm text-gray-500">of {macro.goal}{macro.unit}</p>
                    {isOver && (
                      <p className={`text-xs font-semibold mt-1 ${isWayOver ? 'text-red-600' : 'text-orange-600'}`}>
                        {Math.round(actualPercentage)}% of goal
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Nutrition by Time Histogram */}
        {meals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white border-2 border-purple-500 rounded-xl p-6 shadow-xl">
              <NutritionByTimeHistogram meals={meals} />
            </div>
          </motion.div>
        )}

        {/* Meals for this day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-black mb-4">Meals Logged</h2>
          <div className="bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100 rounded-xl p-6 border-2 border-blue-400 shadow-xl max-h-[600px] overflow-y-auto custom-scrollbar-light">
            <MealList 
              refreshTrigger={refreshTrigger}
              onMealDeleted={handleMealChange}
              onMealUpdated={handleMealChange}
              variant="light-green"
              specificDate={date}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

