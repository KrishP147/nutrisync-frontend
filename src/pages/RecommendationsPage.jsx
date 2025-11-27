import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import { motion } from 'motion/react';
import { Sparkles, MessageCircle, Leaf } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Recommendations from '../components/Recommendations';
import api from '../services/api';

export default function RecommendationsPage() {
  const { goals } = useGoals();
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [recommendationsRefreshTrigger, setRecommendationsRefreshTrigger] = useState(0);

  useEffect(() => {
    let channel = null;
    
    const setupSubscriptions = async () => {
      await fetchDietaryRestrictions();
      
      // Set up real-time subscription for profile changes (dietary restrictions)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        channel = supabase
          .channel('profile-changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_profile',
            filter: `user_id=eq.${user.id}`
          }, () => {
            fetchDietaryRestrictions();
            setRecommendationsRefreshTrigger(prev => prev + 1);
          })
          .subscribe();
      }
    };

    setupSubscriptions();
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

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

  const handleChat = useCallback(async () => {
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
  }, [chatMessage, goals, dietaryRestrictions]);


  const restrictionLabels = {
    halal: 'Halal', kosher: 'Kosher', vegetarian: 'Vegetarian', vegan: 'Vegan',
    gluten_free: 'Gluten-Free', dairy_free: 'Dairy-Free', nut_free: 'Nut-Free',
    shellfish_free: 'Shellfish-Free', low_sodium: 'Low Sodium', low_carb: 'Low Carb'
  };

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-white">
            AI Insights
          </motion.h1>
          <p className="text-white/50 mt-1">Personalized nutrition recommendations</p>
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

        {/* AI Recommendations from Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Recommendations limit={5} refreshTrigger={recommendationsRefreshTrigger} />
        </motion.div>

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
