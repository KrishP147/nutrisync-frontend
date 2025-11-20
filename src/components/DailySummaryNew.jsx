import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import CountUp from './ui/CountUp';
import { motion } from 'motion/react';

export default function DailySummaryNew() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysSummary();
  }, []);

  const fetchTodaysSummary = async () => {
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
      .lt('consumed_at', tomorrow.toISOString());

    if (!error && data) {
      const totals = data.reduce((acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        fiber: acc.fiber + (meal.total_fiber_g || 0),
        mealCount: acc.mealCount + 1,
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, mealCount: 0 });

      setSummary(totals);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-dark-secondary">
        Loading summary...
      </div>
    );
  }

  if (!summary || summary.mealCount === 0) {
    return (
      <div className="glass-card rounded-lg p-6 text-center text-dark-secondary">
        No meals logged today. Start by adding your first meal!
      </div>
    );
  }

  const macroData = [
    { name: 'Protein', value: summary.protein, color: '#22c55e' },
    { name: 'Carbs', value: summary.carbs, color: '#3b82f6' },
    { name: 'Fat', value: summary.fat, color: '#f97316' },
  ];

  const barData = [
    { name: 'Protein', value: summary.protein, color: '#22c55e' },
    { name: 'Carbs', value: summary.carbs, color: '#3b82f6' },
    { name: 'Fat', value: summary.fat, color: '#f97316' },
    { name: 'Fiber', value: summary.fiber, color: '#a855f7' },
  ];

  return (
    <div className="glass-card rounded-lg p-6 glow-green">
      <h2 className="text-3xl font-bold text-matrix-green-400 mb-6">Today's Summary</h2>

      {/* Animated Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center p-4 bg-dark-secondary/50 rounded-lg border border-matrix-green-900/30"
        >
          <div className="text-3xl md:text-4xl font-bold text-matrix-green-400 break-words">
            <CountUp
              from={0}
              to={summary.calories}
              duration={1.5}
              className="text-3xl md:text-4xl font-bold text-matrix-green-400"
            />
          </div>
          <p className="text-sm text-dark-secondary mt-2">Calories</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-4 bg-dark-secondary/50 rounded-lg border border-protein-green/30"
        >
          <div className="text-3xl md:text-4xl font-bold text-protein-green break-words">
            <CountUp
              from={0}
              to={summary.protein}
              duration={1.5}
              className="text-3xl md:text-4xl font-bold text-protein-green"
            />
            <span className="text-xl md:text-2xl">g</span>
          </div>
          <p className="text-sm text-dark-secondary mt-2">Protein</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-4 bg-dark-secondary/50 rounded-lg border border-carbs-blue/30"
        >
          <div className="text-3xl md:text-4xl font-bold text-carbs-blue break-words">
            <CountUp
              from={0}
              to={summary.carbs}
              duration={1.5}
              className="text-3xl md:text-4xl font-bold text-carbs-blue"
            />
            <span className="text-xl md:text-2xl">g</span>
          </div>
          <p className="text-sm text-dark-secondary mt-2">Carbs</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center p-4 bg-dark-secondary/50 rounded-lg border border-fat-orange/30"
        >
          <div className="text-3xl md:text-4xl font-bold text-fat-orange break-words">
            <CountUp
              from={0}
              to={summary.fat}
              duration={1.5}
              className="text-3xl md:text-4xl font-bold text-fat-orange"
            />
            <span className="text-xl md:text-2xl">g</span>
          </div>
          <p className="text-sm text-dark-secondary mt-2">Fat</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center p-4 bg-dark-secondary/50 rounded-lg border border-fiber-purple/30"
        >
          <div className="text-3xl md:text-4xl font-bold text-fiber-purple break-words">
            <CountUp
              from={0}
              to={summary.fiber}
              duration={1.5}
              className="text-3xl md:text-4xl font-bold text-fiber-purple"
            />
            <span className="text-xl md:text-2xl">g</span>
          </div>
          <p className="text-sm text-dark-secondary mt-2">Fiber</p>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-secondary/30 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-matrix-green-400 mb-4 text-center">
            Macro Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-dark-secondary/30 rounded-lg p-4"
        >
          <h3 className="text-lg font-semibold text-matrix-green-400 mb-4 text-center">
            Nutrient Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="name" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-dark-secondary">
          You've logged <span className="font-semibold text-matrix-green-400">{summary.mealCount}</span> meals today
        </p>
      </motion.div>
    </div>
  );
}
