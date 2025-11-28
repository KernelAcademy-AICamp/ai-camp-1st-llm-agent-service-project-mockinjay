/**
 * ResearchTrendsChart Component
 *
 * A responsive line chart component displaying research publication trends over years
 * for CKD-related topics using Recharts library.
 *
 * Features:
 * - Multiple data series (CKD, Treatment, Diet)
 * - Responsive container that adapts to parent width
 * - Accessible tooltip with formatted data
 * - Legend for data series identification
 * - Grid for better data readability
 *
 * @example
 * ```tsx
 * import { ResearchTrendsChart } from '@/components/trends/ResearchTrendsChart';
 *
 * function TrendsPage() {
 *   return (
 *     <div>
 *       <h2>Research Trends</h2>
 *       <ResearchTrendsChart />
 *     </div>
 *   );
 * }
 * ```
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Data point interface for research trends
 */
export interface ResearchDataPoint {
  /** Year or date label */
  date: string;
  /** Number of CKD-related publications */
  ckd: number;
  /** Number of treatment-related publications */
  treatment: number;
  /** Number of diet-related publications */
  diet: number;
}

/**
 * Props for ResearchTrendsChart component
 */
export interface ResearchTrendsChartProps {
  /** Optional custom data. If not provided, uses default sample data */
  data?: ResearchDataPoint[];
  /** Chart height in pixels. Default: 400 */
  height?: number;
  /** Optional CSS class name for the container */
  className?: string;
}

/**
 * Default research data showing publication trends from 2020-2025
 */
const defaultResearchData: ResearchDataPoint[] = [
  { date: '2020', ckd: 120, treatment: 80, diet: 95 },
  { date: '2021', ckd: 145, treatment: 98, diet: 112 },
  { date: '2022', ckd: 178, treatment: 125, diet: 134 },
  { date: '2023', ckd: 210, treatment: 156, diet: 167 },
  { date: '2024', ckd: 245, treatment: 189, diet: 198 },
  { date: '2025', ckd: 268, treatment: 215, diet: 223 },
];

/**
 * Chart color scheme
 */
const COLORS = {
  ckd: '#00C8B4',       // Teal - 만성신장병
  treatment: '#9F7AEA', // Purple - 치료법
  diet: '#FFB84D',      // Orange - 식이요법
} as const;

/**
 * Chart configuration
 */
const CHART_CONFIG = {
  lineWidth: 3,
  dotRadius: 5,
  gridStrokeDasharray: '3 3',
  gridStroke: '#E5E7EB',
  axisStroke: '#9CA3AF',
  axisFontSize: '12px',
} as const;

/**
 * Payload entry interface for tooltip
 */
interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
}

/**
 * Custom tooltip component with enhanced styling
 */
const CustomTooltip = ({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-xl p-4 shadow-lg border border-gray-200"
      role="tooltip"
      aria-label={`Research data for ${label}`}
    >
      <p className="text-sm font-semibold text-gray-700 mb-2">
        {label}년
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium text-gray-600">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-900">
              {entry.value}편
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ResearchTrendsChart Component
 *
 * Displays a line chart showing research publication trends over time
 * for CKD, treatment, and diet-related topics.
 */
export const ResearchTrendsChart: React.FC<ResearchTrendsChartProps> = ({
  data = defaultResearchData,
  height = 400,
  className = '',
}) => {
  return (
    <div
      className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${className}`}
      role="region"
      aria-label="연구 트렌드 차트"
    >
      {/* Chart Description */}
      <p className="mb-4 text-sm text-gray-500">
        신장병 관련 주제별 PubMed 연구 논문 발행 추이
      </p>

      {/* Responsive Chart Container */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Grid */}
          <CartesianGrid
            strokeDasharray={CHART_CONFIG.gridStrokeDasharray}
            stroke={CHART_CONFIG.gridStroke}
            opacity={0.5}
          />

          {/* X Axis - Years */}
          <XAxis
            dataKey="date"
            stroke={CHART_CONFIG.axisStroke}
            style={{ fontSize: CHART_CONFIG.axisFontSize }}
            tick={{ fill: CHART_CONFIG.axisStroke }}
            label={{
              value: '연도',
              position: 'insideBottom',
              offset: -5,
              style: {
                fontSize: '12px',
                fill: CHART_CONFIG.axisStroke,
                fontWeight: 500,
              },
            }}
          />

          {/* Y Axis - Publication Count */}
          <YAxis
            stroke={CHART_CONFIG.axisStroke}
            style={{ fontSize: CHART_CONFIG.axisFontSize }}
            tick={{ fill: CHART_CONFIG.axisStroke }}
            label={{
              value: '논문 수',
              angle: -90,
              position: 'insideLeft',
              style: {
                fontSize: '12px',
                fill: CHART_CONFIG.axisStroke,
                fontWeight: 500,
              },
            }}
          />

          {/* Tooltip */}
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: CHART_CONFIG.gridStroke, strokeWidth: 1 }}
          />

          {/* Legend */}
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '13px',
            }}
            iconType="line"
          />

          {/* CKD Line - 만성신장병 */}
          <Line
            type="monotone"
            dataKey="ckd"
            stroke={COLORS.ckd}
            strokeWidth={CHART_CONFIG.lineWidth}
            name="만성신장병"
            dot={{
              fill: COLORS.ckd,
              r: CHART_CONFIG.dotRadius,
              strokeWidth: 0,
            }}
            activeDot={{
              r: CHART_CONFIG.dotRadius + 2,
              stroke: COLORS.ckd,
              strokeWidth: 2,
              fill: 'white',
            }}
          />

          {/* Treatment Line - 치료법 */}
          <Line
            type="monotone"
            dataKey="treatment"
            stroke={COLORS.treatment}
            strokeWidth={CHART_CONFIG.lineWidth}
            name="치료법"
            dot={{
              fill: COLORS.treatment,
              r: CHART_CONFIG.dotRadius,
              strokeWidth: 0,
            }}
            activeDot={{
              r: CHART_CONFIG.dotRadius + 2,
              stroke: COLORS.treatment,
              strokeWidth: 2,
              fill: 'white',
            }}
          />

          {/* Diet Line - 식이요법 */}
          <Line
            type="monotone"
            dataKey="diet"
            stroke={COLORS.diet}
            strokeWidth={CHART_CONFIG.lineWidth}
            name="식이요법"
            dot={{
              fill: COLORS.diet,
              r: CHART_CONFIG.dotRadius,
              strokeWidth: 0,
            }}
            activeDot={{
              r: CHART_CONFIG.dotRadius + 2,
              stroke: COLORS.diet,
              strokeWidth: 2,
              fill: 'white',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Export default for convenience
export default ResearchTrendsChart;
