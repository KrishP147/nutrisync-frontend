import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NutritionByTimeHistogram({ meals, title = "Intake by Time of Day" }) {
  const [timeChartView, setTimeChartView] = useState('calories'); // 'calories', 'protein', 'carbs', 'fat', 'fiber'

  console.log('NutritionByTimeHistogram received meals:', meals?.length || 0, meals);

  const getNutritionByTimeData = () => {
    if (!meals || meals.length === 0) {
      console.log('No meals to process for histogram');
      return [];
    }

    // Group meals by half-hour intervals with all macros
    const nutritionByHalfHour = meals.reduce((acc, meal) => {
      const date = new Date(meal.consumed_at);
      const hour = date.getHours();
      const minute = date.getMinutes();
      // Round to nearest half hour: 0-29 -> 0, 30-59 -> 30
      const halfHour = minute < 30 ? 0 : 30;
      const timeKey = hour * 2 + (halfHour === 30 ? 1 : 0); // Convert to half-hour index (0-47)
      
      if (!acc[timeKey]) {
        acc[timeKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      }
      acc[timeKey].calories += meal.total_calories || 0;
      acc[timeKey].protein += meal.total_protein_g || 0;
      acc[timeKey].carbs += meal.total_carbs_g || 0;
      acc[timeKey].fat += meal.total_fat_g || 0;
      acc[timeKey].fiber += meal.total_fiber_g || 0;
      return acc;
    }, {});

    // Create data array for all 48 half-hour intervals (24 hours * 2)
    return Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const halfHour = (i % 2) * 30;
      const timeKey = `${hour.toString().padStart(2, '0')}:${halfHour.toString().padStart(2, '0')}`;
      
      return {
        timeIndex: i,
        hour: hour,
        calories: Math.round(nutritionByHalfHour[i]?.calories || 0),
        protein: parseFloat((nutritionByHalfHour[i]?.protein || 0).toFixed(1)),
        carbs: parseFloat((nutritionByHalfHour[i]?.carbs || 0).toFixed(1)),
        fat: parseFloat((nutritionByHalfHour[i]?.fat || 0).toFixed(1)),
        fiber: parseFloat((nutritionByHalfHour[i]?.fiber || 0).toFixed(1)),
        label: timeKey
      };
    });
  };

  const chartData = getNutritionByTimeData();

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex gap-1">
          {[
            { key: 'calories', label: 'Cal', color: 'bg-green-600' },
            { key: 'protein', label: 'P', color: 'bg-blue-600' },
            { key: 'carbs', label: 'C', color: 'bg-orange-500' },
            { key: 'fat', label: 'F', color: 'bg-purple-600' },
            { key: 'fiber', label: 'Fb', color: 'bg-red-900' }
          ].map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setTimeChartView(key)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                timeChartView === key
                  ? `${color} text-white`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {(!meals || meals.length === 0) ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-lg font-medium">No meals logged yet</p>
          <p className="text-sm mt-1">Your nutrition timeline will appear here</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9 }}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="#9ca3af"
              interval={3}
            />
            <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
            <Tooltip
              formatter={(value) => {
                if (timeChartView === 'calories') return [`${value} cal`, 'Calories'];
                return [`${value}g`, timeChartView.charAt(0).toUpperCase() + timeChartView.slice(1)];
              }}
              labelFormatter={(label) => `Time ${label}`}
            />
            {timeChartView === 'calories' && <Bar dataKey="calories" fill="#10b981" />}
            {timeChartView === 'protein' && <Bar dataKey="protein" fill="#1d4ed8" />}
            {timeChartView === 'carbs' && <Bar dataKey="carbs" fill="#f59e0b" />}
            {timeChartView === 'fat' && <Bar dataKey="fat" fill="#a855f7" />}
            {timeChartView === 'fiber' && <Bar dataKey="fiber" fill="#800000" />}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

