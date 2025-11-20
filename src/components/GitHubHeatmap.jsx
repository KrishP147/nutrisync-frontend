import { useState } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function GitHubHeatmap({ data, goals }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate last 12 weeks of dates
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  // Calculate percentage of goals met for a date
  const getIntensity = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = data[dateStr];

    if (!dayData) return 0;

    // Calculate percentage of goals met
    const proteinPercent = goals.protein ? (dayData.protein / goals.protein) * 100 : 0;
    const caloriesPercent = goals.calories ? (dayData.calories / goals.calories) * 100 : 0;

    const avgPercent = (proteinPercent + caloriesPercent) / 2;

    // Map to 0-4 scale
    if (avgPercent === 0) return 0;
    if (avgPercent < 25) return 1;
    if (avgPercent < 50) return 2;
    if (avgPercent < 75) return 3;
    if (avgPercent < 100) return 4;
    return 5;
  };

  const getColor = (intensity) => {
    const colors = [
      '#f3f4f6', // 0 - no data (light gray)
      '#dbeafe', // 1 - very light blue
      '#bfdbfe', // 2 - light blue
      '#93c5fd', // 3 - medium blue
      '#60a5fa', // 4 - blue
      '#3b82f6', // 5 - 100%+ (strong blue)
    ];
    return colors[intensity] || colors[0];
  };

  // Group by weeks
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Prepare pie chart data for hovered day
  const getPieData = (dayData) => {
    if (!dayData) return [];
    return [
      { name: 'Protein', value: dayData.protein, color: '#3b82f6' },
      { name: 'Carbs', value: dayData.carbs, color: '#f59e0b' },
      { name: 'Fat', value: dayData.fat, color: '#ef4444' },
    ];
  };

  return (
    <div className="p-4">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-xs text-gray-600 pr-2">
          <div style={{ height: '12px' }}></div>
          {dayLabels.map((day, i) => (
            <div key={i} className="h-3 flex items-center">
              {i % 2 === 1 && day}
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((date, dayIndex) => {
                  const intensity = getIntensity(date);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayData = data[dateStr];

                  return (
                    <motion.div
                      key={dateStr}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                      whileHover={{ scale: 1.3 }}
                      onMouseEnter={() => setHoveredDay({ date, data: dayData })}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="w-3 h-3 rounded-sm cursor-pointer transition-all"
                      style={{
                        backgroundColor: getColor(intensity),
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                      title={`${date.toLocaleDateString()}: ${dayData ? `${dayData.calories} cal` : 'No data'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip with Pie Chart */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white border-2 border-blue-100 rounded-xl shadow-lg"
        >
          <div className="font-semibold text-black mb-3">
            {hoveredDay.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          {hoveredDay.data ? (
            <div className="flex items-center gap-4">
              {/* Mini Pie Chart */}
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getPieData(hoveredDay.data)}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={40}
                      innerRadius={20}
                    >
                      {getPieData(hoveredDay.data).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                <div>
                  <span className="text-gray-600">Calories:</span>
                  <span className="ml-2 font-semibold text-green-600">{hoveredDay.data.calories}</span>
                </div>
                <div>
                  <span className="text-gray-600">Protein:</span>
                  <span className="ml-2 font-semibold text-blue-600">{hoveredDay.data.protein.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Carbs:</span>
                  <span className="ml-2 font-semibold text-orange-500">{hoveredDay.data.carbs.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-gray-600">Fat:</span>
                  <span className="ml-2 font-semibold text-red-500">{hoveredDay.data.fat.toFixed(1)}g</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No meals logged</div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-xs text-gray-600">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map((intensity) => (
          <div
            key={intensity}
            className="w-3 h-3 rounded-sm border border-blue-200"
            style={{ backgroundColor: getColor(intensity) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
