import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useGoals } from '../contexts/GoalsContext';
import Navigation from '../components/Navigation';
import Starfield from '../components/Starfield';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

export default function RecommendationsPage() {
  const { goals } = useGoals();
  const [foodsToEat, setFoodsToEat] = useState([]);
  const [foodsToAvoid, setFoodsToAvoid] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingToEat, setGeneratingToEat] = useState(false);
  const [generatingToAvoid, setGeneratingToAvoid] = useState(false);
  const [healthTip, setHealthTip] = useState('');
  const [generatingTip, setGeneratingTip] = useState(false);

  useEffect(() => {
    generateRecommendations();
    generateRandomHealthTip();
  }, []);

  const generateRandomHealthTip = async () => {
    setGeneratingTip(true);

    try {
      const response = await api.post('/api/generate-health-tip');
      setHealthTip(response.data.tip || 'Stay hydrated, get enough sleep, and move your body daily!');
    } catch (error) {
      console.error('Error generating health tip:', error);
      // Fallback to random tips
      const fallbackTips = [
        "Aim for 7-9 hours of quality sleep each night. Sleep is crucial for muscle recovery, hormone regulation, and cognitive function.",
        "Drink at least 8 glasses (64oz) of water daily. Staying hydrated supports metabolism, digestion, and energy levels.",
        "Include 30 minutes of physical activity daily. This could be walking, strength training, yoga, or any movement you enjoy!",
        "Eat the rainbow! Different colored fruits and vegetables provide unique nutrients and antioxidants your body needs.",
        "Practice mindful eating: eat slowly, chew thoroughly, and pay attention to hunger and fullness cues.",
        "Strength train 2-3 times per week. Building muscle boosts metabolism and supports long-term health.",
        "Take short movement breaks every hour. Even 2-3 minutes of stretching or walking helps circulation and focus.",
        "Prioritize protein at each meal to support muscle maintenance, satiety, and stable blood sugar levels.",
        "Get morning sunlight exposure to regulate your circadian rhythm and improve sleep quality at night.",
        "Manage stress through deep breathing, meditation, or activities you enjoy. Chronic stress affects both mental and physical health.",
        "Track your daily nutrition to identify patterns. Awareness is the first step toward healthier eating habits.",
        "Limit added sugars to less than 10% of daily calories. Excess sugar contributes to weight gain and energy crashes.",
        "Include probiotic-rich foods like yogurt, kefir, and fermented vegetables to support gut health.",
        "Stay consistent with meal timing. Regular eating patterns help regulate hunger hormones and metabolism.",
        "Choose whole grains over refined grains for sustained energy and better nutrient density.",
        "Add healthy fats like avocados, nuts, and olive oil to meals for nutrient absorption and satiety.",
        "Prep meals in advance on weekends to make healthy eating easier during busy weekdays.",
        "Cook at home more often to control ingredients, portions, and reduce sodium intake.",
        "Use smaller plates to naturally control portion sizes without feeling deprived.",
        "Stay active after meals. A 10-15 minute walk helps with digestion and blood sugar control.",
        "Include lean protein sources at breakfast to reduce cravings throughout the day.",
        "Limit alcohol consumption - it provides empty calories and can disrupt sleep quality.",
        "Eat mindfully without screens. Focus on your food to improve digestion and satisfaction.",
        "Plan your meals weekly to reduce decision fatigue and ensure balanced nutrition.",
        "Gradually increase fiber intake to avoid digestive discomfort while improving gut health.",
        "Stay hydrated before, during, and after exercise to maintain performance and recovery.",
        "Don't skip meals - it can lead to overeating later and disrupt your metabolism.",
        "Include omega-3 fatty acids from fish, flaxseeds, or walnuts for brain and heart health.",
        "Listen to your body's hunger cues rather than eating by the clock or out of boredom.",
        "Keep healthy snacks accessible - prep veggies, fruits, and nuts for easy grab-and-go options."
      ];
      setHealthTip(fallbackTips[Math.floor(Math.random() * fallbackTips.length)]);
    } finally {
      setGeneratingTip(false);
    }
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    // Get last 7 days of meals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', sevenDaysAgo.toISOString());

    // Calculate average macros
    const totals = (meals || []).reduce((acc, meal) => ({
      protein: acc.protein + (meal.total_protein_g || 0),
      carbs: acc.carbs + (meal.total_carbs_g || 0),
      fat: acc.fat + (meal.total_fat_g || 0),
      fiber: acc.fiber + (meal.total_fiber_g || 0),
    }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

    const days = Math.max(1, Math.ceil((new Date() - sevenDaysAgo) / (1000 * 60 * 60 * 24)));
    const avgProtein = totals.protein / days;
    const avgFiber = totals.fiber / days;
    const avgFat = totals.fat / days;

    return { avgProtein, avgFiber, avgFat };
  };

  const generateRecommendations = async () => {
    setGeneratingToEat(true);
    setGeneratingToAvoid(true);
    
    try {
      // Get today's data for more accurate recommendations
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todaysMeals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', today.toISOString())
        .lt('consumed_at', tomorrow.toISOString());

      const todayTotals = (todaysMeals || []).reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      // Calculate what's lacking
      const lacking = {
        calories: Math.max(0, goals.calories - todayTotals.calories),
        protein: Math.max(0, goals.protein - todayTotals.protein),
        carbs: Math.max(0, goals.carbs - todayTotals.carbs),
        fat: Math.max(0, goals.fat - todayTotals.fat),
        fiber: Math.max(0, goals.fiber - todayTotals.fiber),
      };

      // Generate recommendations using Gemini
      const response = await api.post('/api/generate-food-recommendations', {
        goals,
        current: todayTotals,
        lacking
      });

      // Sort by score - highest to lowest for foods to eat, lowest to highest for foods to avoid
      const toEat = (response.data.foodsToEat || []).sort((a, b) => b.score - a.score);
      const toAvoid = (response.data.foodsToAvoid || []).sort((a, b) => a.score - b.score);

      setFoodsToEat(toEat);
      setFoodsToAvoid(toAvoid);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to rule-based if API fails
      await generateFallbackRecommendations();
    } finally {
      setGeneratingToEat(false);
      setGeneratingToAvoid(false);
    }
  };

  const generateFallbackRecommendations = async () => {
    const { avgProtein, avgFiber, avgFat } = await fetchUserData();

    // Food pools based on nutritional needs
    const highProteinFoods = [
      { name: 'Greek Yogurt', score: 95, reason: 'High protein, low calorie' },
      { name: 'Chicken Breast', score: 92, reason: 'Lean protein source' },
      { name: 'Eggs', score: 88, reason: 'Complete protein, versatile' },
      { name: 'Cottage Cheese', score: 90, reason: 'High protein, calcium-rich' },
      { name: 'Tuna', score: 89, reason: 'Lean fish, omega-3s' },
      { name: 'Turkey Breast', score: 87, reason: 'Low-fat protein' },
      { name: 'Tofu', score: 86, reason: 'Plant protein, versatile' },
    ];

    const balancedFoods = [
      { name: 'Salmon', score: 94, reason: 'Omega-3 fatty acids, quality protein' },
      { name: 'Quinoa', score: 89, reason: 'Complete protein, high fiber' },
      { name: 'Sweet Potato', score: 85, reason: 'Complex carbs, vitamins' },
      { name: 'Almonds', score: 88, reason: 'Healthy fats, protein' },
      { name: 'Oats', score: 86, reason: 'Fiber, sustained energy' },
    ];

    const fiberFoods = [
      { name: 'Lentils', score: 91, reason: 'High fiber and protein' },
      { name: 'Broccoli', score: 87, reason: 'Fiber-rich vegetable' },
      { name: 'Chia Seeds', score: 90, reason: 'Very high fiber, omega-3s' },
      { name: 'Black Beans', score: 88, reason: 'Fiber, protein, iron' },
      { name: 'Raspberries', score: 85, reason: 'High fiber fruit' },
      { name: 'Brussels Sprouts', score: 84, reason: 'Fiber, vitamins' },
    ];

    const healthyFatsFoods = [
      { name: 'Avocado', score: 90, reason: 'Healthy fats, nutrient-dense' },
      { name: 'Olive Oil', score: 92, reason: 'Heart-healthy fats' },
      { name: 'Walnuts', score: 88, reason: 'Omega-3s, antioxidants' },
      { name: 'Chia Seeds', score: 87, reason: 'Healthy fats, fiber' },
    ];

    const avoidFoods = [
      { name: 'Sugary Drinks', score: 10, reason: 'Empty calories, blood sugar spike' },
      { name: 'Processed Snacks', score: 20, reason: 'High sodium, low nutrients' },
      { name: 'White Bread', score: 25, reason: 'Low fiber, high glycemic' },
      { name: 'Fried Foods', score: 15, reason: 'High in unhealthy fats' },
      { name: 'Butter', score: 30, reason: 'High saturated fat' },
      { name: 'Candy', score: 12, reason: 'Pure sugar, no nutrition' },
      { name: 'Soda', score: 8, reason: 'Sugar, artificial ingredients' },
      { name: 'Chips', score: 22, reason: 'High sodium, unhealthy fats' },
    ];

    // Shuffle and select foods based on needs
    const toEat = [];

    if (avgProtein < goals.protein * 0.8) {
      toEat.push(...shuffleArray(highProteinFoods).slice(0, 3));
    } else {
      toEat.push(...shuffleArray(balancedFoods).slice(0, 2));
    }

    if (avgFiber < goals.fiber * 0.8) {
      toEat.push(...shuffleArray(fiberFoods).slice(0, 2));
    } else {
      toEat.push(...shuffleArray(healthyFatsFoods).slice(0, 1));
    }

    // Pad to exactly 5 if needed
    const allHealthyFoods = [...highProteinFoods, ...balancedFoods, ...fiberFoods, ...healthyFatsFoods];
    while (toEat.length < 5) {
      const remaining = shuffleArray(allHealthyFoods.filter(f => !toEat.find(e => e.name === f.name)));
      if (remaining.length > 0) {
        toEat.push(remaining[0]);
      } else {
        break;
      }
    }

    // Always pick exactly 5 foods to avoid, sorted by score
    const toAvoid = shuffleArray(avoidFoods).slice(0, 5).sort((a, b) => a.score - b.score);

    setFoodsToEat(toEat.slice(0, 5).sort((a, b) => b.score - a.score));
    setFoodsToAvoid(toAvoid);
  };

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Regenerate only "Foods to Eat" list
  const regenerateFoodsToEat = async () => {
    setGeneratingToEat(true);
    
    try {
      // Get today's data
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: todaysMeals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', today.toISOString())
        .lt('consumed_at', tomorrow.toISOString());

      const todayTotals = (todaysMeals || []).reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const lacking = {
        calories: Math.max(0, goals.calories - todayTotals.calories),
        protein: Math.max(0, goals.protein - todayTotals.protein),
        carbs: Math.max(0, goals.carbs - todayTotals.carbs),
        fat: Math.max(0, goals.fat - todayTotals.fat),
        fiber: Math.max(0, goals.fiber - todayTotals.fiber),
      };

      const response = await api.post('/api/generate-food-recommendations', {
        goals,
        current: todayTotals,
        lacking,
        type: 'toEat'
      });

      const toEat = (response.data.foodsToEat || []).sort((a, b) => b.score - a.score);
      setFoodsToEat(toEat);
    } catch (error) {
      console.error('Error regenerating foods to eat:', error);
      // Fallback
      await regenerateFoodsToEatFallback();
    } finally {
      setGeneratingToEat(false);
    }
  };

  const regenerateFoodsToEatFallback = async () => {
    const { avgProtein, avgFiber, avgFat } = await fetchUserData();

    const highProteinFoods = [
      { name: 'Greek Yogurt', score: 95, reason: 'High protein, low calorie' },
      { name: 'Chicken Breast', score: 92, reason: 'Lean protein source' },
      { name: 'Eggs', score: 88, reason: 'Complete protein, versatile' },
      { name: 'Cottage Cheese', score: 90, reason: 'High protein, calcium-rich' },
      { name: 'Tuna', score: 89, reason: 'Lean fish, omega-3s' },
      { name: 'Turkey Breast', score: 87, reason: 'Low-fat protein' },
      { name: 'Tofu', score: 86, reason: 'Plant protein, versatile' },
    ];

    const balancedFoods = [
      { name: 'Salmon', score: 94, reason: 'Omega-3 fatty acids, quality protein' },
      { name: 'Quinoa', score: 89, reason: 'Complete protein, high fiber' },
      { name: 'Sweet Potato', score: 85, reason: 'Complex carbs, vitamins' },
      { name: 'Almonds', score: 88, reason: 'Healthy fats, protein' },
      { name: 'Oats', score: 86, reason: 'Fiber, sustained energy' },
    ];

    const fiberFoods = [
      { name: 'Lentils', score: 91, reason: 'High fiber and protein' },
      { name: 'Broccoli', score: 87, reason: 'Fiber-rich vegetable' },
      { name: 'Chia Seeds', score: 90, reason: 'Very high fiber, omega-3s' },
      { name: 'Black Beans', score: 88, reason: 'Fiber, protein, iron' },
      { name: 'Raspberries', score: 85, reason: 'High fiber fruit' },
      { name: 'Brussels Sprouts', score: 84, reason: 'Fiber, vitamins' },
    ];

    const healthyFatsFoods = [
      { name: 'Avocado', score: 90, reason: 'Healthy fats, nutrient-dense' },
      { name: 'Olive Oil', score: 92, reason: 'Heart-healthy fats' },
      { name: 'Walnuts', score: 88, reason: 'Omega-3s, antioxidants' },
      { name: 'Chia Seeds', score: 87, reason: 'Healthy fats, fiber' },
    ];

    const toEat = [];

    if (avgProtein < goals.protein * 0.8) {
      toEat.push(...shuffleArray(highProteinFoods).slice(0, 3));
    } else {
      toEat.push(...shuffleArray(balancedFoods).slice(0, 2));
    }

    if (avgFiber < goals.fiber * 0.8) {
      toEat.push(...shuffleArray(fiberFoods).slice(0, 2));
    } else {
      toEat.push(...shuffleArray(healthyFatsFoods).slice(0, 1));
    }

    const allHealthyFoods = [...highProteinFoods, ...balancedFoods, ...fiberFoods, ...healthyFatsFoods];
    while (toEat.length < 5) {
      const remaining = shuffleArray(allHealthyFoods.filter(f => !toEat.find(e => e.name === f.name)));
      if (remaining.length > 0) {
        toEat.push(remaining[0]);
      } else {
        break;
      }
    }

    setFoodsToEat(toEat.slice(0, 5).sort((a, b) => b.score - a.score));
  };

  // Regenerate only "Foods to Avoid" list
  const regenerateFoodsToAvoid = async () => {
    setGeneratingToAvoid(true);
    
    try {
      const response = await api.post('/api/generate-food-recommendations', {
        goals,
        type: 'toAvoid'
      });

      const toAvoid = (response.data.foodsToAvoid || []).sort((a, b) => a.score - b.score);
      setFoodsToAvoid(toAvoid);
    } catch (error) {
      console.error('Error regenerating foods to avoid:', error);
      // Fallback
      await regenerateFoodsToAvoidFallback();
    } finally {
      setGeneratingToAvoid(false);
    }
  };

  const regenerateFoodsToAvoidFallback = async () => {

    const avoidFoods = [
      { name: 'Sugary Drinks', score: 10, reason: 'Empty calories, blood sugar spike' },
      { name: 'Processed Snacks', score: 20, reason: 'High sodium, low nutrients' },
      { name: 'White Bread', score: 25, reason: 'Low fiber, high glycemic' },
      { name: 'Fried Foods', score: 15, reason: 'High in unhealthy fats' },
      { name: 'Butter', score: 30, reason: 'High saturated fat' },
      { name: 'Candy', score: 12, reason: 'Pure sugar, no nutrition' },
      { name: 'Soda', score: 8, reason: 'Sugar, artificial ingredients' },
      { name: 'Chips', score: 22, reason: 'High sodium, unhealthy fats' },
    ];

    const toAvoid = shuffleArray(avoidFoods).slice(0, 5).sort((a, b) => a.score - b.score);
    setFoodsToAvoid(toAvoid);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || loading) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Get recent meals for context
      const { data: { user } } = await supabase.auth.getUser();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('consumed_at', sevenDaysAgo.toISOString());

      // Calculate average macros for context
      const totals = (meals || []).reduce((acc, meal) => ({
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
      }), { protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const days = Math.max(1, Math.ceil((new Date() - sevenDaysAgo) / (1000 * 60 * 60 * 24)));
      const recentMeals = {
        avgProtein: Math.round(totals.protein / days),
        avgCarbs: Math.round(totals.carbs / days),
        avgFat: Math.round(totals.fat / days),
        avgFiber: Math.round(totals.fiber / days),
      };

      // Call Gemini API via Python backend
      const response = await api.post('/api/chat', {
        message: userMessage,
        userGoals: goals,
        recentMeals: recentMeals,
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);

      // Fallback to simulated response if API fails
      let response = '';
      if (userMessage.toLowerCase().includes('protein')) {
        response = `Based on your current goal of ${goals.protein}g protein per day, I recommend focusing on lean protein sources like chicken breast, fish, Greek yogurt, and legumes. Spread your protein intake throughout the day for optimal absorption!`;
      } else if (userMessage.toLowerCase().includes('fiber')) {
        response = `Your fiber goal is ${goals.fiber}g per day. Great fiber sources include lentils, beans, whole grains, berries, and vegetables like broccoli and Brussels sprouts. Fiber helps with digestion and keeps you feeling full longer!`;
      } else if (userMessage.toLowerCase().includes('weight') || userMessage.toLowerCase().includes('lose')) {
        response = `To lose weight sustainably, aim for a calorie deficit of 300-500 calories per day. Focus on whole foods, maintain high protein intake to preserve muscle, and stay hydrated. Consistency is key!`;
      } else if (userMessage.toLowerCase().includes('muscle') || userMessage.toLowerCase().includes('gain')) {
        response = `Building muscle requires adequate protein (${goals.protein}g/day is great!), a slight calorie surplus, and progressive resistance training. Make sure you're getting enough sleep and recovery time too!`;
      } else {
        response = `That's a great question! Based on your goals (${goals.calories} cal, ${goals.protein}g protein, ${goals.carbs}g carbs, ${goals.fat}g fat, ${goals.fiber}g fiber), I recommend focusing on nutrient-dense whole foods and maintaining consistency with your tracking. What specific aspect would you like to explore?`;
      }

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response + '\n\n(Note: AI service temporarily unavailable, using fallback response)'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Starfield Background */}
      <Starfield />

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">NutriSync AI</h1>
            <p className="text-gray-700">Personalized insights based on your goals and eating patterns</p>
          </motion.div>

          {/* Random Health Tip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-400 rounded-xl p-6 mb-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3">💡 Daily Wellness Tip</h3>
            {generatingTip ? (
              <p className="text-gray-600 text-center py-4">Generating a personalized tip...</p>
            ) : (
              <p className="text-gray-800 leading-relaxed">{healthTip}</p>
            )}
          </motion.div>

          {/* What Should I Eat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50 border-2 border-green-400 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">✅ What Should I Eat</h2>
                <button
                  onClick={regenerateFoodsToEat}
                  disabled={generatingToEat}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {generatingToEat ? '...' : '🔄 Regenerate'}
                </button>
              </div>
              <div className="space-y-3">
                {foodsToEat.map((food, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="bg-white border border-green-500 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{food.name}</h3>
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {food.score}%
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{food.reason}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Foods to Avoid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-red-50 border-2 border-red-400 rounded-xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">⚠️ Foods to Avoid</h2>
                <button
                  onClick={regenerateFoodsToAvoid}
                  disabled={generatingToAvoid}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {generatingToAvoid ? '...' : '🔄 Regenerate'}
                </button>
              </div>
              <div className="space-y-3">
                {foodsToAvoid.map((food, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="bg-white border border-red-500 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{food.name}</h3>
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {food.score}%
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{food.reason}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* AI Chatbot */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-purple-50 border-2 border-purple-400 rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💬 Ask NutriSync AI</h2>
            <p className="text-gray-700 mb-4 text-sm">
              Ask me anything about nutrition, your goals, or healthy eating tips!
            </p>

            {/* Chat Messages */}
            <div className="bg-white rounded-lg p-4 mb-4 h-64 overflow-y-auto border border-gray-200">
              {chatMessages.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Start a conversation! Try asking about protein, fiber, weight loss, or muscle gain.
                </p>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-purple-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-purple-100 rounded-lg p-3 text-gray-900">
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about nutrition, goals, or healthy eating..."
                className="flex-1 bg-white border border-purple-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !userInput.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
