import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { Sparkles, ThumbsUp, ThumbsDown, Lightbulb, RefreshCw, MessageCircle, Leaf } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import api from '../services/api';

export default function RecommendationsPage() {
  const { goals } = useGoals();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [foodsToEat, setFoodsToEat] = useState([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchDietaryRestrictions();
    generateRecommendations();
  }, [goals]);

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

  const generateRecommendations = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
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

      const totals = (meals || []).reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const recs = [];
      const userGoals = {
        calories: goals?.calories || 2000,
        protein: goals?.protein || 150,
        carbs: goals?.carbs || 250,
        fat: goals?.fat || 65,
        fiber: goals?.fiber || 30
      };

      const proteinGap = userGoals.protein - totals.protein;
      if (proteinGap > 30) {
        recs.push({
          id: 'protein', type: 'eat', title: 'Increase protein intake',
          description: `You need ${Math.round(proteinGap)}g more protein today. Consider lean meats, fish, eggs, Greek yogurt, or legumes.`,
          priority: 'high', color: 'secondary'
        });
      }

      const fiberGap = userGoals.fiber - totals.fiber;
      if (fiberGap > 10) {
        recs.push({
          id: 'fiber', type: 'eat', title: 'Add more fiber',
          description: `You're ${Math.round(fiberGap)}g short on fiber. Try adding vegetables, fruits, or whole grains.`,
          priority: 'medium', color: 'green'
        });
      }

      const calorieProgress = (totals.calories / userGoals.calories) * 100;
      if (calorieProgress > 110) {
        recs.push({
          id: 'calories-over', type: 'avoid', title: 'Calorie limit reached',
          description: `You've exceeded your calorie goal by ${Math.round(totals.calories - userGoals.calories)} kcal. Consider lighter options.`,
          priority: 'high', color: 'amber'
        });
      } else if (calorieProgress >= 90) {
        recs.push({
          id: 'calories-good', type: 'info', title: 'Great calorie balance',
          description: 'You\'re on track with your calorie goal today!',
          priority: 'low', color: 'primary'
        });
      }

      if (recs.length === 0) {
        recs.push({
          id: 'general', type: 'info', title: 'Keep it up!',
          description: 'You\'re doing well with your nutrition today. Keep logging your meals to stay on track.',
          priority: 'low', color: 'primary'
        });
      }

      setRecommendations(recs);

      // Fetch AI food recommendations
      fetchAIFoodRecommendations(userGoals, totals);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIFoodRecommendations = async (userGoals, totals) => {
    setAiLoading(true);
    const lacking = {
      calories: Math.max(0, userGoals.calories - totals.calories),
      protein: Math.max(0, userGoals.protein - totals.protein),
      carbs: Math.max(0, userGoals.carbs - totals.carbs),
      fat: Math.max(0, userGoals.fat - totals.fat),
      fiber: Math.max(0, userGoals.fiber - totals.fiber),
    };

    try {
      const response = await api.post('/api/generate-food-recommendations', {
        goals: userGoals,
        current: totals,
        lacking: lacking,
        type: 'both',
        dietaryRestrictions: dietaryRestrictions
      });

      if (response.data?.foodsToEat) {
        setFoodsToEat(response.data.foodsToEat);
      }
      if (response.data?.foodsToAvoid) {
        setFoodsToAvoid(response.data.foodsToAvoid);
      }
    } catch (error) {
      console.error('Error fetching AI food recommendations:', error);
      // Provide fallback recommendations based on what's lacking
      const fallbackToEat = [];
      const fallbackToAvoid = [];

      if (lacking.protein > 20) {
        fallbackToEat.push({ name: 'Greek Yogurt', score: 92, reason: 'High protein, low calorie' });
        fallbackToEat.push({ name: 'Grilled Chicken Breast', score: 90, reason: 'Lean protein source' });
      }
      if (lacking.fiber > 10) {
        fallbackToEat.push({ name: 'Mixed Vegetables', score: 88, reason: 'High fiber, nutrient dense' });
        fallbackToEat.push({ name: 'Oatmeal', score: 85, reason: 'Great fiber source' });
      }
      if (lacking.calories > 300) {
        fallbackToEat.push({ name: 'Brown Rice', score: 82, reason: 'Complex carbs for energy' });
      }
      if (fallbackToEat.length < 3) {
        fallbackToEat.push({ name: 'Salmon', score: 88, reason: 'Omega-3 and protein' });
        fallbackToEat.push({ name: 'Eggs', score: 85, reason: 'Complete protein' });
      }

      fallbackToAvoid.push({ name: 'Sugary Sodas', score: 15, reason: 'Empty calories, no nutrients' });
      fallbackToAvoid.push({ name: 'Processed Chips', score: 18, reason: 'High sodium, low nutrition' });
      fallbackToAvoid.push({ name: 'Candy Bars', score: 12, reason: 'Sugar spikes, no protein' });
      fallbackToAvoid.push({ name: 'Deep Fried Foods', score: 20, reason: 'Excess fat, high calories' });
      fallbackToAvoid.push({ name: 'White Bread', score: 25, reason: 'Low fiber, refined carbs' });

      setFoodsToEat(fallbackToEat.slice(0, 5));
      setFoodsToAvoid(fallbackToAvoid.slice(0, 5));
    } finally {
      setAiLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Get recent meal data for context
      const { data: { user } } = await supabase.auth.getUser();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentMeals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', sevenDaysAgo.toISOString());

      const mealCount = recentMeals?.length || 0;
      const avgProtein = mealCount > 0 ? recentMeals.reduce((sum, m) => sum + (m.total_protein_g || 0), 0) / 7 : 0;
      const avgCarbs = mealCount > 0 ? recentMeals.reduce((sum, m) => sum + (m.total_carbs_g || 0), 0) / 7 : 0;
      const avgFat = mealCount > 0 ? recentMeals.reduce((sum, m) => sum + (m.total_fat_g || 0), 0) / 7 : 0;
      const avgFiber = mealCount > 0 ? recentMeals.reduce((sum, m) => sum + (m.total_fiber_g || 0), 0) / 7 : 0;

      const response = await api.post('/api/chat', {
        message: userMessage,
        userGoals: goals,
        recentMeals: { avgProtein, avgCarbs, avgFat, avgFiber },
        dietaryRestrictions: dietaryRestrictions
      });

      if (response.data?.response) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing that. Please try again.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const colorClasses = {
    primary: { bg: 'bg-primary-700/10', border: 'border-primary-700/30', text: 'text-primary-500' },
    secondary: { bg: 'bg-secondary-500/10', border: 'border-secondary-500/30', text: 'text-secondary-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  };

  const restrictionLabels = {
    halal: 'Halal', kosher: 'Kosher', vegetarian: 'Vegetarian', vegan: 'Vegan',
    gluten_free: 'Gluten-Free', dairy_free: 'Dairy-Free', nut_free: 'Nut-Free',
    shellfish_free: 'Shellfish-Free', low_sodium: 'Low Sodium', low_carb: 'Low Carb'
  };

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-white">
              AI Insights
            </motion.h1>
            <p className="text-white/50 mt-1">Personalized nutrition recommendations</p>
          </div>
          <button onClick={generateRecommendations} className="btn-outline">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Active Dietary Restrictions */}
        {dietaryRestrictions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-primary-700/10 border border-primary-700/30 rounded-lg"
          >
            <Leaf size={20} className="text-primary-500" />
            <span className="text-white/60 text-sm">Active restrictions:</span>
            <div className="flex flex-wrap gap-2">
              {dietaryRestrictions.map(key => (
                <span key={key} className="px-2 py-1 bg-primary-700/30 text-primary-400 rounded text-xs">
                  {restrictionLabels[key] || key}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
                <div className="h-20 bg-white/5 rounded" />
              </div>
            ))
          ) : (
            recommendations.map((rec, index) => {
              const colors = colorClasses[rec.color] || colorClasses.primary;
              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`card p-6 border ${colors.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      {rec.type === 'eat' ? <ThumbsUp size={20} className={colors.text} /> :
                       rec.type === 'avoid' ? <ThumbsDown size={20} className={colors.text} /> :
                       <Lightbulb size={20} className={colors.text} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-heading font-semibold ${colors.text}`}>{rec.title}</h3>
                        {rec.priority === 'high' && <span className="badge-amber text-xs">Priority</span>}
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* AI Food Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Foods to Eat */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="card p-6 border-primary-700/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-700/10 flex items-center justify-center">
                <ThumbsUp size={20} className="text-primary-500" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-white">Foods to Eat</h2>
                <p className="text-white/50 text-sm">AI-recommended based on your goals</p>
              </div>
            </div>
            
            {aiLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : foodsToEat.length > 0 ? (
              <div className="space-y-2">
                {foodsToEat.map((food, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{food.name}</p>
                      <p className="text-white/40 text-xs">{food.reason}</p>
                    </div>
                    <div className="px-2 py-1 bg-primary-700/30 text-primary-400 rounded text-xs font-mono">
                      {food.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">Click refresh to get AI recommendations</p>
            )}
          </motion.div>

          {/* Foods to Avoid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            className="card p-6 border-amber-500/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ThumbsDown size={20} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-white">Foods to Avoid</h2>
                <p className="text-white/50 text-sm">Limit these to stay on track</p>
              </div>
            </div>
            
            {aiLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : foodsToAvoid.length > 0 ? (
              <div className="space-y-2">
                {foodsToAvoid.map((food, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{food.name}</p>
                      <p className="text-white/40 text-xs">{food.reason}</p>
                    </div>
                    <div className="px-2 py-1 bg-red-500/30 text-red-400 rounded text-xs font-mono">
                      {food.score}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/40 text-center py-8">Click refresh to get AI recommendations</p>
            )}
          </motion.div>
        </div>

        {/* AI Chat Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-white">Chat with NutriSync AI</h2>
              <p className="text-white/50 text-sm">Get personalized nutrition advice</p>
            </div>
          </div>

          {/* Chat History */}
          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-center text-white/40 py-8">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Ask me anything about nutrition!</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-700 text-white' : 'bg-white/5 text-white/80'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 px-4 py-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
              placeholder="Ask about nutrition, meal planning, or diet tips..."
              className="input flex-1"
            />
            <button onClick={handleChat} disabled={chatLoading || !chatMessage.trim()} className="btn-primary">
              <Sparkles size={18} />
              Ask
            </button>
          </div>
        </motion.div>
      </div>
    </Sidebar>
  );
}
