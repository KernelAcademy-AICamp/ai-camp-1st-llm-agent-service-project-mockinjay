import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function DashboardPage() {
  const keywords = [
    { text: '신장 이식', change: 12, trending: 'up' },
    { text: '투석 치료', change: 8, trending: 'up' },
    { text: '저단백 식단', change: 15, trending: 'up' },
    { text: '신장병 식이', change: 5, trending: 'up' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ background: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: '18px', color: '#1F2937', marginBottom: '4px' }}>대시보드</h1>
          <p style={{ fontSize: '12px', color: '#6B7280' }}>신장병 관련 주요 키워드 트렌드를 확인하세요</p>
        </div>

        {/* Keywords Section */}
        <div className="mb-8">
          <h2 style={{ fontSize: '14px', color: '#1F2937', marginBottom: '16px' }}>인기 키워드</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keywords.map((keyword, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border transition-all duration-200 hover:shadow-sm"
                style={{ 
                  borderColor: '#E5E7EB',
                  background: '#FFFFFF'
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span 
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: '28px',
                        height: '28px',
                        background: keyword.trending === 'up' ? '#EFF6FF' : '#FEF2F2',
                        color: keyword.trending === 'up' ? '#3B82F6' : '#EF4444',
                        fontSize: '12px'
                      }}
                    >
                      {index + 1}
                    </span>
                    <span style={{ fontSize: '14px', color: '#1F2937' }}>{keyword.text}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {keyword.trending === 'up' ? (
                      <TrendingUp size={16} color="#10B981" />
                    ) : (
                      <TrendingDown size={16} color="#EF4444" />
                    )}
                    <span 
                      style={{ 
                        fontSize: '12px',
                        color: keyword.trending === 'up' ? '#10B981' : '#EF4444'
                      }}
                    >
                      {keyword.change > 0 ? '+' : ''}{keyword.change}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Trends Section */}
        <div>
          <h2 style={{ fontSize: '14px', color: '#1F2937', marginBottom: '16px' }}>연구 트렌드</h2>
          
          <div 
            className="p-6 rounded-lg border"
            style={{ 
              borderColor: '#E5E7EB',
              background: '#FFFFFF'
            }}
          >
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#9CA3AF', fontSize: '14px' }}>연구 트렌드 그래프 영역</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
