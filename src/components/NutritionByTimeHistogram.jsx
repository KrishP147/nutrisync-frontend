import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Flame, Beef, Wheat, Droplets, Leaf } from 'lucide-react';

export default function NutritionByTimeHistogram({ meals = [] }) {
  const [viewMode, setViewMode] = useState('calories');

  const histogramData = useMemo(() => {
    // Create 24 half-hour time slots (12:00 AM to 11:30 PM)
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let half = 0; half < 2; half++) {
        const label = `${hour.toString().padStart(2, '0')}:${half === 0 ? '00' : '30'}`;
        timeSlots.push({
          time: label,
          hour: hour,
          halfHour: half,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        });
      }
    }

    // Aggregate meals into time slots
    meals.forEach(meal => {
      const date = new Date(meal.consumed_at);
      const hour = date.getHours();
      const minutes = date.getMinutes();
      const halfHour = minutes < 30 ? 0 : 1;
      const slotIndex = hour * 2 + halfHour;

      if (slotIndex >= 0 && slotIndex < timeSlots.length) {
        timeSlots[slotIndex].calories += meal.total_calories || 0;
        timeSlots[slotIndex].protein += meal.total_protein_g || 0;
        timeSlots[slotIndex].carbs += meal.total_carbs_g || 0;
        timeSlots[slotIndex].fat += meal.total_fat_g || 0;
        timeSlots[slotIndex].fiber += meal.total_fiber_g || 0;
      }
    });

    return timeSlots;
  }, [meals]);

  const getBarColor = () => {
    switch (viewMode) {
      case 'calories': return '#047857';
      case 'protein': return '#0ea5e9';
      case 'carbs': return '#f59e0b';
      case 'fat': return '#3b82f6';
      case 'fiber': return '#22c55e';
      default: return '#047857';
    }
  };

  const getDataKey = () => {
    return viewMode;
  };

  const formatYAxis = (value) => {
    if (viewMode === 'calories') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;
    }
    return `${value}g`;
  };

  const modes = [
    { key: 'calories', label: 'Calories', icon: Flame, color: 'primary' },
    { key: 'protein', label: 'Protein', icon: Beef, color: 'secondary' },
    { key: 'carbs', label: 'Carbs', icon: Wheat, color: 'amber' },
    { key: 'fat', label: 'Fat', icon: Droplets, color: 'blue' },
    { key: 'fiber', label: 'Fiber', icon: Leaf, color: 'green' },
  ];

  const hasData = meals.length > 0;

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex flex-wrap gap-2 mb-6">
        {modes.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              viewMode === key
                ? `bg-${color === 'primary' ? 'primary-700' : color === 'secondary' ? 'secondary-500' : color === 'amber' ? 'amber-500' : color === 'blue' ? 'blue-500' : 'green-500'} text-white`
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={14} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {hasData ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={histogramData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.5)"
              fontSize={10}
              interval={3}
              tickFormatter={(value) => value.split(':')[0] + ':00'}
            />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              fontSize={10}
              tickFormatter={formatYAxis}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [
                viewMode === 'calories' ? `${Math.round(value)} kcal` : `${value.toFixed(1)}g`,
                viewMode.charAt(0).toUpperCase() + viewMode.slice(1)
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar dataKey={getDataKey()} radius={[2, 2, 0, 0]}>
              {histogramData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry[getDataKey()] > 0 ? getBarColor() : 'rgba(255,255,255,0.05)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-white/40">
          <Flame size={32} className="mb-3 opacity-50" />
          <p>No meals logged yet today</p>
          <p className="text-sm mt-1">Your nutrition timeline will appear here</p>
        </div>
      )}
    </div>
  );
}
