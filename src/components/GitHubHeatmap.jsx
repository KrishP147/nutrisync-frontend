import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

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
      '#1a1a1a', // 0 - no data
      '#0e4429', // 1
      '#006d32', // 2
      '#26a641', // 3
      '#39d353', // 4
      '#22c55e', // 5 - 100%+
    ];
    return colors[intensity] || colors[0];
  };

  // Group by weeks
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-4">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-xs text-dark-secondary pr-2">
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
                      whileHover={{ scale: 1.2 }}
                      onMouseEnter={() => setHoveredDay({ date, data: dayData })}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="w-3 h-3 rounded-sm cursor-pointer transition-all"
                      style={{
                        backgroundColor: getColor(intensity),
                        border: '1px solid rgba(0, 0, 0, 0.1)'
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

      {/* Tooltip */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-dark-card border border-dark rounded-lg text-sm"
        >
          <div className="font-semibold text-matrix-green-400 mb-2">
            {hoveredDay.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          {hoveredDay.data ? (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-secondary">Calories:</span>
                <span className="ml-2 text-matrix-green-400">{hoveredDay.data.calories}</span>
              </div>
              <div>
                <span className="text-dark-secondary">Protein:</span>
                <span className="ml-2 text-protein-green">{hoveredDay.data.protein.toFixed(1)}g</span>
              </div>
              <div>
                <span className="text-dark-secondary">Carbs:</span>
                <span className="ml-2 text-carbs-blue">{hoveredDay.data.carbs.toFixed(1)}g</span>
              </div>
              <div>
                <span className="text-dark-secondary">Fat:</span>
                <span className="ml-2 text-fat-orange">{hoveredDay.data.fat.toFixed(1)}g</span>
              </div>
            </div>
          ) : (
            <div className="text-dark-secondary text-xs">No meals logged</div>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 mt-6 text-xs text-dark-secondary">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map((intensity) => (
          <div
            key={intensity}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColor(intensity) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
