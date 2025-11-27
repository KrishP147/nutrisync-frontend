import { ResponsivePie } from '@nivo/pie';
import { motion } from 'motion/react';
import { PieChart } from 'lucide-react';

const MEAL_TYPE_COLORS = {
  breakfast: '#f59e0b', // Amber - sunrise
  lunch: '#10b981',     // Green - midday
  dinner: '#3b82f6',    // Blue - evening
  snack: '#a855f7',     // Purple
};

export default function MealTypeDistribution({ meals }) {

  if (!meals || meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40">
        <PieChart size={32} className="mb-2 opacity-50" />
        <p>No meal distribution data</p>
      </div>
    );
  }

  // Count meals by type
  const mealCounts = meals.reduce((acc, meal) => {
    const type = meal.meal_type || 'snack';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(mealCounts).map(([type, count]) => ({
    id: type.charAt(0).toUpperCase() + type.slice(1),
    label: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: MEAL_TYPE_COLORS[type.toLowerCase()] || '#6b7280',
  }));

  return (
    <div className="overflow-x-auto -mx-4 px-4" style={{ position: 'relative' }}>
      <style>{`
        div[style*="position: absolute"][style*="pointer-events: none"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
        .nivo-pie-tooltip,
        [class*="nivo-pie"] [class*="tooltip"],
        svg + div[style*="position: absolute"] {
          display: none !important;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-64 min-w-[400px] sm:min-w-0"
      >
        <ResponsivePie
          data={chartData}
          margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
          innerRadius={0.6}
          padAngle={3}
          cornerRadius={4}
          activeOuterRadiusOffset={0}
          activeInnerRadiusOffset={0}
          colors={{ datum: 'data.color' }}
          borderWidth={2}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          enableArcLinkLabels={true}
          enableArcLabels={true}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor="#ffffff"
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#ffffff"
          arcLinkLabelsColor={{ from: 'color' }}
          isInteractive={false}
          tooltip={() => null}
          theme={{
            labels: {
              text: {
                fontFamily: 'JetBrains Mono',
                fontSize: 11,
                fontWeight: 600,
                fill: '#ffffff',
              }
            },
            arcLinkLabels: {
              text: {
                fill: '#ffffff',
              }
            },
            tooltip: {
              container: {
                background: '#000000 !important',
                color: '#ffffff !important',
                border: '1px solid rgba(255,255,255,0.1) !important',
              },
              basic: {
                color: '#ffffff !important',
              },
              table: {
                color: '#ffffff !important',
              },
              tableCell: {
                color: '#ffffff !important',
              }
            }
          }}
          motionConfig="gentle"
        />
      </motion.div>
    </div>
  );
}

