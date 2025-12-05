/**
 * ChartRenderer Component
 * Chart.js를 사용한 차트 렌더링
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { ChartConfig } from '../../services/trendsApi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartRendererProps {
  config: ChartConfig;
  title?: string;
  height?: number;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ config, title, height = 400 }) => {
  // Default chart options
  const getDefaultOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 12,
            family: "'Inter', 'Noto Sans KR', sans-serif",
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 8,
        borderColor: 'rgba(107, 114, 128, 0.2)',
        borderWidth: 1,
      },
      title: title
        ? {
            display: true,
            text: title,
            font: {
              size: 16,
              weight: 'bold' as const,
            },
            color: '#1F2937',
            padding: {
              top: 10,
              bottom: 20,
            },
          }
        : undefined,
    },
    scales:
      config.type === 'line' || config.type === 'bar'
        ? {
            x: {
              grid: {
                color: 'rgba(107, 114, 128, 0.1)',
              },
              ticks: {
                color: '#6B7280',
              },
            },
            y: {
              grid: {
                color: 'rgba(107, 114, 128, 0.1)',
              },
              ticks: {
                color: '#6B7280',
              },
            },
          }
        : undefined,
  });

  // Merge with custom options
  const chartOptions = {
    ...getDefaultOptions(),
    ...(config.options || {}),
  };

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return <Line data={config.data} options={chartOptions} />;

      case 'bar':
        return <Bar data={config.data} options={chartOptions} />;

      case 'doughnut':
        return (
          <Doughnut
            data={config.data}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  ...chartOptions.plugins?.legend,
                  position: 'right' as const,
                },
              },
            }}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            지원하지 않는 차트 유형입니다: {config.type}
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="w-full" style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartRenderer;
