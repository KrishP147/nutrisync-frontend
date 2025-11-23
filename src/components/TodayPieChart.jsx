import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'motion/react';

export default function TodayPieChart() {
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchTodayData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTodayData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('consumed_at', today.toISOString());

    if (!error && data) {
      const totals = data.reduce((acc, meal) => ({
        protein: acc.protein + (meal.total_protein_g || 0),
        carbs: acc.carbs + (meal.total_carbs_g || 0),
        fat: acc.fat + (meal.total_fat_g || 0),
        calories: acc.calories + (meal.total_calories || 0),
      }), { protein: 0, carbs: 0, fat: 0, calories: 0 });

      setTodayData(totals);
    }
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  // Default to zeros if no data
  const displayData = todayData || { protein: 0, carbs: 0, fat: 0, calories: 0 };

  const pieData = [
    { name: 'Protein', value: parseFloat(displayData.protein.toFixed(1)), color: '#1d4ed8' },
    { name: 'Carbs', value: parseFloat(displayData.carbs.toFixed(1)), color: '#f59e0b' },
    { name: 'Fat', value: parseFloat(displayData.fat.toFixed(1)), color: '#a855f7' },
  ].filter(item => item.value > 0);

  const hasData = pieData.length > 0;

  // Custom label renderer - only show on desktop
  const renderLabel = (entry) => {
    if (isMobile) return null;
    return `${entry.value}g`;
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white border-2 border-purple-500 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.payload.color }}>
            {data.value}g
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white border-2 border-purple-500 rounded-xl p-6 shadow-xl mb-8"
    >
      <h2 className="text-2xl font-bold text-black mb-4">Today's Macro Breakdown</h2>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-80 h-56 md:h-80">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="45%"
                  outerRadius={isMobile ? 50 : 85}
                  innerRadius={isMobile ? 30 : 50}
                  paddingAngle={5}
                  label={renderLabel}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-2">🍽️</div>
                <p className="text-gray-500 text-sm">No meals logged yet</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 md:ml-8 space-y-3 w-full">
          <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
            <span className="text-gray-700 font-medium">Total Calories</span>
            <span className="text-2xl font-bold text-purple-600">{displayData.calories}</span>
          </div>
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border-2 border-blue-300">
            <span className="text-gray-700">Protein</span>
            <span className="text-xl font-bold text-blue-700">{displayData.protein.toFixed(1)}g</span>
          </div>
          <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border-2 border-orange-300">
            <span className="text-gray-700">Carbs</span>
            <span className="text-xl font-bold text-orange-500">{displayData.carbs.toFixed(1)}g</span>
          </div>
          <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border-2 border-purple-300">
            <span className="text-gray-700">Fat</span>
            <span className="text-xl font-bold text-purple-600">{displayData.fat.toFixed(1)}g</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

