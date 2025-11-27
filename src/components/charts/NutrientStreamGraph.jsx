import { ResponsiveStream } from '@nivo/stream';
import { useState } from 'react';
import { motion } from 'motion/react';
import { Waves, Info } from 'lucide-react';

const STREAM_COLORS = ['#0ea5e9', '#f59e0b', '#a855f7', '#22c55e']; // Sky blue, Amber, Purple, Green

export default function NutrientStreamGraph({ data }) {
  const [showInfo, setShowInfo] = useState(false);
  
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40">
        <Waves size={32} className="mb-2 opacity-50" />
        <p>No data for stream graph</p>
      </div>
    );
  }

  const keys = ['Protein', 'Carbs', 'Fat', 'Fiber'];
  
  // Transform data for stream format - include fiber
  const streamData = data.map(d => ({
    Protein: d.protein || d.avgProtein || 0,
    Carbs: d.carbs || d.avgCarbs || 0,
    Fat: d.fat || d.avgFat || 0,
    Fiber: d.fiber || d.avgFiber || 0,
  }));

  return (
    <div className="relative" style={{ overflow: 'visible' }}>
      {/* Info tooltip */}
      <div 
        className="absolute top-0 right-0 z-10"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <Info size={18} className="text-white/40 hover:text-white/70 cursor-help" />
        {showInfo && (
          <div className="absolute right-0 top-6 w-64 bg-black border border-white/10 rounded-lg p-3 text-xs text-white/70 z-20">
            Shows macro nutrient distribution over time. The flowing streams represent Protein (blue), Carbs (amber), Fat (purple), and Fiber (green). Hover to see exact values.
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-72"
        style={{ overflow: 'visible' }}
      >
        <ResponsiveStream
          data={streamData}
          keys={keys}
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            format: (i) => data[i]?.date || data[i]?.day || '',
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 10,
            tickValues: 5,
            legend: 'Grams',
            legendPosition: 'middle',
            legendOffset: -50,
          }}
          enableGridX={false}
          enableGridY={true}
          offsetType="silhouette"
          colors={STREAM_COLORS}
          fillOpacity={0.85}
          borderWidth={0}
          dotSize={8}
          dotColor={{ from: 'color' }}
          dotBorderWidth={2}
          dotBorderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
          tooltip={({ layer }) => {
            if (!layer || layer.value === undefined || layer.value === null) return null;
            return (
              <div className="bg-black border border-white/10 rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="font-medium text-white">{layer.id}</span>
                </div>
                <div className="font-mono font-bold text-lg" style={{ color: layer.color }}>
                  {Math.round(layer.value)}g
                </div>
              </div>
            );
          }}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              translateY: 45,
              itemsSpacing: 20,
              itemWidth: 70,
              itemHeight: 20,
              itemTextColor: 'rgba(255,255,255,0.6)',
              symbolSize: 12,
              symbolShape: 'circle',
            }
          ]}
          theme={{
            background: 'transparent',
            textColor: 'rgba(255,255,255,0.6)',
            fontSize: 11,
            fontFamily: 'Plus Jakarta Sans',
            axis: {
              legend: {
                text: {
                  fontSize: 12,
                  fill: 'rgba(255,255,255,0.6)',
                }
              },
              ticks: {
                text: {
                  fill: 'rgba(255,255,255,0.6)',
                }
              }
            },
            grid: {
              line: {
                stroke: 'rgba(255,255,255,0.05)',
                strokeWidth: 1
              }
            },
            legends: {
              text: {
                fill: 'rgba(255,255,255,0.6)',
              }
            },
            tooltip: {
              container: {
                background: 'transparent',
                boxShadow: 'none',
                padding: 0,
              }
            }
          }}
          animate={true}
        />
      </motion.div>
    </div>
  );
}
