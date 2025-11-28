/**
 * ResearchTrendsChart Component - Usage Examples
 *
 * This file demonstrates various ways to use the ResearchTrendsChart component.
 * These examples can be copied into your application code.
 */

import { ResearchTrendsChart } from './ResearchTrendsChart';
import type { ResearchDataPoint } from './ResearchTrendsChart';

/**
 * Example 1: Basic Usage
 * Uses default data and settings
 */
export function BasicExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Research Publication Trends</h2>
      <ResearchTrendsChart />
    </div>
  );
}

/**
 * Example 2: Custom Data
 * Provides custom research data
 */
export function CustomDataExample() {
  const customData: ResearchDataPoint[] = [
    { date: '2020', ckd: 100, treatment: 60, diet: 80 },
    { date: '2021', ckd: 135, treatment: 85, diet: 105 },
    { date: '2022', ckd: 165, treatment: 110, diet: 125 },
    { date: '2023', ckd: 200, treatment: 145, diet: 155 },
    { date: '2024', ckd: 240, treatment: 180, diet: 190 },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Custom Research Data</h2>
      <ResearchTrendsChart data={customData} />
    </div>
  );
}

/**
 * Example 3: Custom Height
 * Displays chart with increased height
 */
export function CustomHeightExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Taller Chart</h2>
      <ResearchTrendsChart height={600} />
    </div>
  );
}

/**
 * Example 4: With Custom Styling
 * Adds custom CSS classes to the container
 */
export function CustomStylingExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Styled Chart</h2>
      <ResearchTrendsChart className="shadow-xl border-2 border-blue-200" />
    </div>
  );
}

/**
 * Example 5: Integration with TrendsPage
 * Shows how to integrate into the TrendsPage layout
 */
export function TrendsPageIntegration() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <section className="mb-8">
        <h3 className="mb-4 font-bold text-[#1F2937] text-lg">
          📊 연구 트렌드
        </h3>
        <ResearchTrendsChart />
      </section>
    </div>
  );
}

/**
 * Example 6: With Loading State
 * Demonstrates handling async data loading
 */
export function WithLoadingStateExample() {
  const [data, setData] = useState<ResearchDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData: ResearchDataPoint[] = [
          { date: '2020', ckd: 120, treatment: 80, diet: 95 },
          { date: '2021', ckd: 145, treatment: 98, diet: 112 },
          { date: '2022', ckd: 178, treatment: 125, diet: 134 },
          { date: '2023', ckd: 210, treatment: 156, diet: 167 },
          { date: '2024', ckd: 245, treatment: 189, diet: 198 },
        ];
        setData(mockData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C8B4]" />
      </div>
    );
  }

  return <ResearchTrendsChart data={data} />;
}

/**
 * Example 7: Responsive Grid Layout
 * Shows multiple charts in a responsive grid
 */
export function ResponsiveGridExample() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      <div>
        <h3 className="font-bold mb-3">Overall Trends</h3>
        <ResearchTrendsChart height={300} />
      </div>
      <div>
        <h3 className="font-bold mb-3">Recent Years</h3>
        <ResearchTrendsChart
          height={300}
          data={[
            { date: '2023', ckd: 210, treatment: 156, diet: 167 },
            { date: '2024', ckd: 245, treatment: 189, diet: 198 },
            { date: '2025', ckd: 268, treatment: 215, diet: 223 },
          ]}
        />
      </div>
    </div>
  );
}

/**
 * Example 8: Complete Page Implementation
 * Full page example with header and description
 */
export function CompletePageExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Research Trends Analysis
          </h1>
          <p className="text-gray-600">
            신장병 관련 연구 논문 발행 추이를 확인하세요
          </p>
        </header>

        {/* Chart Section */}
        <section className="mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              📊 연구 트렌드
            </h2>
            <ResearchTrendsChart />
          </div>
        </section>

        {/* Stats Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">만성신장병</h3>
            <p className="text-2xl font-bold text-[#00C8B4]">268편</p>
            <p className="text-xs text-gray-500">2025년 기준</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">치료법</h3>
            <p className="text-2xl font-bold text-[#9F7AEA]">215편</p>
            <p className="text-xs text-gray-500">2025년 기준</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-600">식이요법</h3>
            <p className="text-2xl font-bold text-[#FFB84D]">223편</p>
            <p className="text-xs text-gray-500">2025년 기준</p>
          </div>
        </section>
      </div>
    </div>
  );
}

// Note: Add these imports if using Examples 6-8
import { useState, useEffect } from 'react';
