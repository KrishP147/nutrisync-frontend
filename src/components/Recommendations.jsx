import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { Lightbulb, ThumbsUp, ThumbsDown, ChevronRight, Sparkles } from 'lucide-react';

export default function Recommendations({ limit = 3 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { goals } = useGoals();

  useEffect(() => {
    generateRecommendations();
  }, [goals]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get today's meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', today.toISOString())
        .lt('consumed_at', tomorrow.toISOString());

      // Calculate current intake
      const totals = (meals || []).reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      // Generate recommendations based on gaps
      const recs = [];
      const userGoals = {
        calories: goals?.calories || 2000,
        protein: goals?.protein || 150,
        carbs: goals?.carbs || 250,
        fat: goals?.fat || 65,
        fiber: goals?.fiber || 30
      };

      // Protein recommendation
      const proteinGap = userGoals.protein - totals.protein;
      if (proteinGap > 30) {
        recs.push({
          id: 'protein',
          type: 'eat',
          title: 'Increase protein intake',
          description: `You need ${Math.round(proteinGap)}g more protein today. Consider lean meats, fish, eggs, or legumes.`,
          priority: 'high',
          color: 'primary'
        });
      }

      // Fiber recommendation
      const fiberGap = userGoals.fiber - totals.fiber;
      if (fiberGap > 10) {
        recs.push({
          id: 'fiber',
          type: 'eat',
          title: 'Add more fiber',
          description: `You're ${Math.round(fiberGap)}g short on fiber. Try vegetables, fruits, or whole grains.`,
          priority: 'medium',
          color: 'secondary'
        });
      }

      // Calories check
      const calorieProgress = (totals.calories / userGoals.calories) * 100;
      if (calorieProgress > 90 && calorieProgress < 110) {
        recs.push({
          id: 'calories-good',
          type: 'info',
          title: 'Great calorie balance',
          description: 'You\'re on track with your calorie goal today. Keep up the good work!',
          priority: 'low',
          color: 'amber'
        });
      } else if (calorieProgress > 110) {
        recs.push({
          id: 'calories-over',
          type: 'avoid',
          title: 'Calorie limit reached',
          description: 'You\'ve exceeded your calorie goal. Consider lighter options for remaining meals.',
          priority: 'high',
          color: 'amber'
        });
      }

      // Balance check
      if (totals.carbs > totals.protein * 3 && totals.protein < userGoals.protein * 0.5) {
        recs.push({
          id: 'balance',
          type: 'eat',
          title: 'Balance your macros',
          description: 'Your carb-to-protein ratio is high. Add more protein-rich foods to balance.',
          priority: 'medium',
          color: 'secondary'
        });
      }

      // Default recommendation if no specific ones
      if (recs.length === 0) {
        recs.push({
          id: 'general',
          type: 'info',
          title: 'Stay consistent',
          description: 'You\'re doing well! Keep logging your meals to maintain accurate tracking.',
          priority: 'low',
          color: 'primary'
        });
      }

      setRecommendations(recs.slice(0, limit));
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    primary: {
      bg: 'bg-primary-700/10',
      border: 'border-primary-700/30',
      text: 'text-primary-500',
      icon: 'text-primary-500'
    },
    secondary: {
      bg: 'bg-secondary-500/10',
      border: 'border-secondary-500/30',
      text: 'text-secondary-400',
      icon: 'text-secondary-400'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: 'text-amber-400'
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-white">AI Insights</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Sparkles size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold text-white">AI Insights</h2>
            <p className="text-white/50 text-sm">Personalized recommendations based on your intake</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const colors = colorClasses[rec.color] || colorClasses.primary;
          
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  {rec.type === 'eat' ? (
                    <ThumbsUp size={16} className={colors.icon} />
                  ) : rec.type === 'avoid' ? (
                    <ThumbsDown size={16} className={colors.icon} />
                  ) : (
                    <Lightbulb size={16} className={colors.icon} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${colors.text} mb-1`}>{rec.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{rec.description}</p>
                </div>
                {rec.priority === 'high' && (
                  <span className="badge-amber text-xs">Priority</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
