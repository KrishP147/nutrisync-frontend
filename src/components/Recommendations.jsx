import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { Lightbulb, ThumbsUp, ThumbsDown, RefreshCw, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Recommendations({ limit = 3 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const { goals } = useGoals();

  useEffect(() => {
    const fetchDietaryRestrictions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profile')
        .select('dietary_restrictions')
        .eq('user_id', user.id)
        .single();

      if (data?.dietary_restrictions) {
        setDietaryRestrictions(data.dietary_restrictions);
      }
    };

    fetchDietaryRestrictions();
  }, []);

  useEffect(() => {
    generateRecommendations();
  }, [goals, dietaryRestrictions]);

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

      const userGoals = {
        calories: goals?.calories || 2000,
        protein: goals?.protein || 150,
        carbs: goals?.carbs || 250,
        fat: goals?.fat || 65,
        fiber: goals?.fiber || 30
      };

      // Try to get AI recommendations from backend
      try {
        const lacking = {
          calories: Math.max(0, userGoals.calories - totals.calories),
          protein: Math.max(0, userGoals.protein - totals.protein),
          carbs: Math.max(0, userGoals.carbs - totals.carbs),
          fat: Math.max(0, userGoals.fat - totals.fat),
          fiber: Math.max(0, userGoals.fiber - totals.fiber)
        };

        const response = await api.post('/api/generate-food-recommendations', {
          goals: userGoals,
          current: totals,
          lacking: lacking,
          type: 'toEat',
          dietaryRestrictions: dietaryRestrictions
        });

        if (response.data?.foodsToEat?.length > 0) {
          // Convert AI response format to recommendations format
          const aiRecs = response.data.foodsToEat.map((food, idx) => ({
            id: `ai-${idx}-${Date.now()}`,
            type: 'eat',
            title: food.name,
            description: food.reason,
            priority: food.score >= 90 ? 'high' : food.score >= 75 ? 'medium' : 'low',
            color: 'primary'
          }));
          setRecommendations(aiRecs.slice(0, limit));
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('AI recommendations failed:', apiError);
        console.log('Using fallback logic');
      }

      // Fallback to local recommendations
      const recs = generateLocalRecommendations(totals, userGoals, meals?.length || 0, dietaryRestrictions);
      setRecommendations(recs.slice(0, limit));
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setRecommendations([{
        id: 'error',
        type: 'info',
        title: 'Keep tracking',
        description: 'Log more meals to get personalized recommendations.',
        priority: 'low',
        color: 'primary'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalRecommendations = (totals, userGoals, mealCount, dietaryRestrictions = []) => {
    const recs = [];
    const hour = new Date().getHours();

    // Helper function to filter foods by dietary restrictions
    const filterByRestrictions = (foods) => {
      if (!dietaryRestrictions || dietaryRestrictions.length === 0) return foods;

      return foods.filter(food => {
        const lowerFood = food.toLowerCase();

        // Vegan restrictions
        if (dietaryRestrictions.includes('vegan')) {
          if (['greek yogurt', 'cottage cheese', 'chicken breast', 'salmon', 'eggs', 'cheese'].some(item => lowerFood.includes(item))) {
            return false;
          }
        }

        // Vegetarian restrictions
        if (dietaryRestrictions.includes('vegetarian')) {
          if (['chicken breast', 'salmon', 'beef', 'pork'].some(item => lowerFood.includes(item))) {
            return false;
          }
        }

        // Dairy-free restrictions
        if (dietaryRestrictions.includes('dairy_free')) {
          if (['greek yogurt', 'cottage cheese', 'cheese'].some(item => lowerFood.includes(item))) {
            return false;
          }
        }

        return true;
      });
    };

    // Protein gap
    const proteinGap = userGoals.protein - totals.protein;
    if (proteinGap > 30) {
      let proteinFoods = ['Greek yogurt', 'cottage cheese', 'chicken breast', 'salmon', 'eggs', 'tofu', 'lentils', 'edamame'];
      proteinFoods = filterByRestrictions(proteinFoods);

      if (proteinFoods.length > 0) {
        const randomFood = proteinFoods[Math.floor(Math.random() * proteinFoods.length)];
        recs.push({
          id: `protein-${Date.now()}`,
          type: 'eat',
          title: `Add ${randomFood}`,
          description: `You need ${Math.round(proteinGap)}g more protein today. ${randomFood.charAt(0).toUpperCase() + randomFood.slice(1)} is a great source.`,
          priority: 'high',
          color: 'primary'
        });
      }
    }

    // Fiber gap
    const fiberGap = userGoals.fiber - totals.fiber;
    if (fiberGap > 10) {
      const fiberFoods = ['broccoli', 'berries', 'avocado', 'chia seeds', 'oatmeal', 'black beans', 'artichoke'];
      const randomFood = fiberFoods[Math.floor(Math.random() * fiberFoods.length)];
      recs.push({
        id: `fiber-${Date.now()}`,
        type: 'eat',
        title: `Include ${randomFood}`,
        description: `You're ${Math.round(fiberGap)}g short on fiber. Add ${randomFood} to boost your intake.`,
        priority: 'medium',
        color: 'secondary'
      });
    }

    // Calorie status
    const calorieProgress = (totals.calories / userGoals.calories) * 100;
    const caloriesRemaining = userGoals.calories - totals.calories;
    
    if (calorieProgress > 110) {
      recs.push({
        id: `calories-over-${Date.now()}`,
        type: 'avoid',
        title: 'Consider lighter options',
        description: `You've exceeded your calorie goal by ${Math.round(totals.calories - userGoals.calories)} cal. Opt for vegetables or lean protein for remaining meals.`,
        priority: 'high',
        color: 'amber'
      });
    } else if (calorieProgress < 50 && hour > 18) {
      recs.push({
        id: `calories-low-${Date.now()}`,
        type: 'eat',
        title: 'You have room for more',
        description: `You have ${Math.round(caloriesRemaining)} calories remaining. A balanced dinner would help meet your goals.`,
        priority: 'medium',
        color: 'primary'
      });
    }

    // Time-based suggestions
    if (hour >= 6 && hour < 10 && mealCount === 0) {
      const breakfastIdeas = ['overnight oats with berries', 'eggs with avocado toast', 'Greek yogurt parfait', 'protein smoothie'];
      const idea = breakfastIdeas[Math.floor(Math.random() * breakfastIdeas.length)];
      recs.push({
        id: `breakfast-${Date.now()}`,
        type: 'eat',
        title: 'Start with breakfast',
        description: `Try ${idea} to kickstart your metabolism and hit your protein goals early.`,
        priority: 'medium',
        color: 'secondary'
      });
    }

    // Meal frequency
    if (mealCount < 2 && hour > 14) {
      recs.push({
        id: `frequency-${Date.now()}`,
        type: 'info',
        title: 'Spread out your meals',
        description: 'Consider eating smaller, more frequent meals to maintain energy levels and better nutrient absorption.',
        priority: 'low',
        color: 'amber'
      });
    }

    // Default if no specific recommendations
    if (recs.length === 0) {
      const generalTips = [
        { title: 'Hydration matters', desc: 'Drinking water before meals can help with portion control and digestion.' },
        { title: 'Eat the rainbow', desc: 'Try to include vegetables of different colors for varied nutrients.' },
        { title: 'Mindful eating', desc: 'Take your time with meals - it takes 20 minutes for your brain to register fullness.' },
        { title: 'Prep ahead', desc: 'Consider meal prepping protein sources for the week to stay on track.' },
      ];
      const tip = generalTips[Math.floor(Math.random() * generalTips.length)];
      recs.push({
        id: `general-${Date.now()}`,
        type: 'info',
        title: tip.title,
        description: tip.desc,
        priority: 'low',
        color: 'primary'
      });
    }

    return recs;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await generateRecommendations();
    setRefreshing(false);
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
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
          title="Refresh recommendations"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
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
