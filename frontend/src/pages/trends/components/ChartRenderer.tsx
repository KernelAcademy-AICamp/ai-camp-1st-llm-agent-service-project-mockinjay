/**
 * ChartRenderer Component
 * Renders charts using Chart.js
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
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { ChartConfig } from '../types';

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
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ config, title }) => {
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
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 6
      },
      title: title ? {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      } : undefined
    }
  });

  // Merge with custom options
  const chartOptions = {
    ...getDefaultOptions(),
    ...config.options
  };

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return <Line data={config.data} options={chartOptions} />;

      case 'bar':
        return <Bar data={config.data} options={chartOptions} />;

      case 'doughnut':
        return <Doughnut data={config.data} options={chartOptions} />;

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            지원하지 않는 차트 유형입니다: {config.type}
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="w-full" style={{ height: '400px' }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default ChartRenderer;
