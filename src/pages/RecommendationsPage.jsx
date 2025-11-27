import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { Sparkles, ThumbsUp, ThumbsDown, Lightbulb, RefreshCw, MessageCircle } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';

export default function RecommendationsPage() {
  const { goals } = useGoals();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    generateRecommendations();
  }, [goals]);

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
          foods: ['Chicken breast', 'Salmon', 'Eggs', 'Greek yogurt', 'Lentils'],
          priority: 'high', color: 'secondary'
        });
      }

      const fiberGap = userGoals.fiber - totals.fiber;
      if (fiberGap > 10) {
        recs.push({
          id: 'fiber', type: 'eat', title: 'Add more fiber',
          description: `You're ${Math.round(fiberGap)}g short on fiber. Try adding vegetables, fruits, or whole grains.`,
          foods: ['Broccoli', 'Avocado', 'Oats', 'Berries', 'Quinoa'],
          priority: 'medium', color: 'green'
        });
      }

      const calorieProgress = (totals.calories / userGoals.calories) * 100;
      if (calorieProgress > 110) {
        recs.push({
          id: 'calories-over', type: 'avoid', title: 'Calorie limit reached',
          description: `You've exceeded your calorie goal by ${Math.round(totals.calories - userGoals.calories)} kcal. Consider lighter options.`,
          foods: ['Sugary drinks', 'Processed snacks', 'Fried foods'],
          priority: 'high', color: 'amber'
        });
      } else if (calorieProgress >= 90) {
        recs.push({
          id: 'calories-good', type: 'info', title: 'Great calorie balance',
          description: 'You\'re on track with your calorie goal today!',
          priority: 'low', color: 'primary'
        });
      }

      if (totals.carbs > totals.protein * 3) {
        recs.push({
          id: 'balance', type: 'eat', title: 'Balance your macros',
          description: 'Your carb-to-protein ratio is high. Adding protein-rich foods will help balance your nutrition.',
          foods: ['Cottage cheese', 'Turkey', 'Tofu', 'Protein shake'],
          priority: 'medium', color: 'secondary'
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
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim()) return;
    
    setChatLoading(true);
    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Simulated AI response (replace with actual API call)
      setTimeout(() => {
        const responses = [
          "Based on your nutrition goals, I'd recommend focusing on protein-rich foods like chicken, fish, and legumes.",
          "For better fiber intake, try adding vegetables to each meal and choosing whole grains over refined ones.",
          "To stay within your calorie goals while feeling full, opt for high-volume, low-calorie foods like salads and soups.",
          "Consider meal prepping on weekends to help you stay consistent with your nutrition targets.",
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        setChatLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Chat error:', error);
      setChatLoading(false);
    }
  };

  const colorClasses = {
    primary: { bg: 'bg-primary-700/10', border: 'border-primary-700/30', text: 'text-primary-500' },
    secondary: { bg: 'bg-secondary-500/10', border: 'border-secondary-500/30', text: 'text-secondary-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
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
                      
                      {rec.foods && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {rec.foods.map((food, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-white/5 text-white/60 text-xs">{food}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* AI Chat Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <MessageCircle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-semibold text-white">Ask the AI</h2>
              <p className="text-white/50 text-sm">Get personalized nutrition advice</p>
            </div>
          </div>

          {/* Chat History */}
          <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
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
