import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'motion/react';
import { useGoals } from '../contexts/GoalsContext';

export default function MacroCircles() {
  const { goals } = useGoals();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch today's meals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', today.toISOString())
      .lt('consumed_at', tomorrow.toISOString());

    if (data) {
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      setSummary(totals);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  // Default to zeros if no data
  const displaySummary = summary || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const macros = [
    {
      name: 'Calories',
      value: displaySummary.calories,
      goal: goals.calories,
      color: '#22c55e',
      unit: ''
    },
    {
      name: 'Protein',
      value: displaySummary.protein,
      goal: goals.protein,
      color: '#1d4ed8',
      unit: 'g'
    },
    {
      name: 'Carbs',
      value: displaySummary.carbs,
      goal: goals.carbs,
      color: '#f59e0b',
      unit: 'g'
    },
    {
      name: 'Fat',
      value: displaySummary.fat,
      goal: goals.fat,
      color: '#a855f7',
      unit: 'g'
    }
  ];

  return (
    <div className="bg-white border-2 border-purple-500 rounded-xl p-8 shadow-xl">
      <h2 className="text-3xl font-bold text-black mb-8 text-center">Today's Progress</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {macros.map((macro, index) => {
          const actualPercentage = (macro.value / macro.goal) * 100;
          const displayPercentage = Math.min(actualPercentage, 100);
          const isOver = actualPercentage > 100;
          const isWayOver = actualPercentage > 130;
          
          // Determine background and border colors based on percentage
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
  );
}

