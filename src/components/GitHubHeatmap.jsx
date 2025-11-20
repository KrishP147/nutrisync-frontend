import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function GitHubHeatmap({ data, goals }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const navigate = useNavigate();

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

  // Helper to format date as YYYY-MM-DD in local time
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate percentage of goals met for a date
  const getIntensity = (date) => {
    const dateStr = formatDateLocal(date);
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

  // Prepare macro data for hovered day
  const getMacroData = (dayData) => {
    if (!dayData) {
      return [
        { name: 'Calories', value: 0, goal: goals.calories, percentage: 0, color: '#22c55e', unit: '' },
        { name: 'Protein', value: 0, goal: goals.protein, percentage: 0, color: '#1d4ed8', unit: 'g' },
        { name: 'Carbs', value: 0, goal: goals.carbs, percentage: 0, color: '#f59e0b', unit: 'g' },
        { name: 'Fat', value: 0, goal: goals.fat, percentage: 0, color: '#a855f7', unit: 'g' },
      ];
    }
    
    return [
      {
        name: 'Calories',
        value: dayData.calories,
        goal: goals.calories,
        percentage: Math.min((dayData.calories / goals.calories) * 100, 100),
        color: '#22c55e',
        unit: ''
      },
      {
        name: 'Protein',
        value: dayData.protein,
        goal: goals.protein,
        percentage: Math.min((dayData.protein / goals.protein) * 100, 100),
        color: '#1d4ed8',
        unit: 'g'
      },
      {
        name: 'Carbs',
        value: dayData.carbs,
        goal: goals.carbs,
        percentage: Math.min((dayData.carbs / goals.carbs) * 100, 100),
        color: '#f59e0b',
        unit: 'g'
      },
      {
        name: 'Fat',
        value: dayData.fat,
        goal: goals.fat,
        percentage: Math.min((dayData.fat / goals.fat) * 100, 100),
        color: '#a855f7',
        unit: 'g'
      }
    ];
  };

  const handleDayClick = (dateStr) => {
    navigate(`/daily-view/${dateStr}`);
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
                  const dateStr = formatDateLocal(date);
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
                      onClick={() => handleDayClick(dateStr)}
                      className="w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-500"
                      style={{
                        backgroundColor: getColor(intensity),
                        border: '1px solid rgba(59, 130, 246, 0.2)'
                      }}
                      title={`${date.toLocaleDateString()}: ${dayData ? `${dayData.calories} cal` : 'No data'} - Click to view details`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip with Macro Circles */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-6 bg-white border-2 border-purple-200 rounded-xl shadow-lg"
        >
          <div className="font-bold text-black mb-4 text-center">
            {hoveredDay.date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          {/* Macro Circles Grid */}
          <div className="grid grid-cols-4 gap-4">
            {getMacroData(hoveredDay.data).map((macro) => (
              <div key={macro.name} className="flex flex-col items-center">
                <div className="w-20 h-20 mb-2">
                  <CircularProgressbar
                    value={macro.percentage}
                    text={`${Math.round(macro.percentage)}%`}
                    styles={buildStyles({
                      pathColor: macro.color,
                      textColor: macro.color,
                      trailColor: '#f0f0f0',
                      textSize: '18px',
                    })}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-900">{macro.name}</p>
                <p className="text-sm font-bold" style={{ color: macro.color }}>
                  {macro.value.toFixed(1)}{macro.unit}
                </p>
                <p className="text-xs text-gray-500">of {macro.goal}{macro.unit}</p>
              </div>
            ))}
          </div>

          {!hoveredDay.data && (
            <div className="text-center text-gray-500 text-sm mt-4">
              No meals logged - Click to view day
            </div>
          )}
          
          <div className="text-center mt-4 text-xs text-gray-600">
            Click to view full details
          </div>
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
