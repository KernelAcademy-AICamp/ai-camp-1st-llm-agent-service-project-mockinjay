import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { MobileHeader } from '../components/MobileHeader';
import { ClinicalTrialCard } from '../components/ClinicalTrialCard';
import { ClinicalTrialDetailModal } from '../components/ClinicalTrialDetailModal';

type TabType = 'news' | 'dashboard' | 'clinical-trials';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  category: string;
  url: string;
  time: string;
  published_at: string | null;
  image: string | null;
  relevance_score: number;
  keywords: string[];
}

const researchData = [
  { date: '2020', ckd: 120, treatment: 80, diet: 95 },
  { date: '2021', ckd: 145, treatment: 98, diet: 112 },
  { date: '2022', ckd: 178, treatment: 125, diet: 134 },
  { date: '2023', ckd: 210, treatment: 156, diet: 167 },
  { date: '2024', ckd: 245, treatment: 189, diet: 198 },
  { date: '2025', ckd: 268, treatment: 215, diet: 223 }
];

export function TrendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  const navigate = useNavigate();

  // News state
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // Clinical trials state
  const [clinicalTrials, setClinicalTrials] = useState<any[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch news when component mounts or tab changes to news
  useEffect(() => {
    if (activeTab === 'news') {
      if (newsItems.length === 0) {
        fetchNews();
      }
    }
  }, [activeTab]);

  // Fetch clinical trials when tab is activated
  useEffect(() => {
    if (activeTab === 'clinical-trials' && clinicalTrials.length === 0) {
      fetchClinicalTrials(1);
    }
  }, [activeTab]);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const response = await fetch('/api/trends/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNewsItems(data.news);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchClinicalTrials = async (page: number) => {
    setLoadingTrials(true);
    try {
      const response = await fetch('/api/clinical-trials/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condition: 'kidney',
          page: page,
          page_size: 10,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clinical trials');
      }

      const data = await response.json();
      setClinicalTrials(data.trials);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching clinical trials:', error);
    } finally {
      setLoadingTrials(false);
    }
  };

  const handleTrialClick = (nctId: string) => {
    setSelectedTrialId(nctId);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchClinicalTrials(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader 
          title="트렌드" 
          showMenu={true} 
          showProfile={true}
        />
      </div>

      <div className="p-6 lg:max-w-[832px] mx-auto pb-24 lg:pb-6">
        {/* Tabs - Exactly matching DesktopTrends.tsx Container1 */}
        <div className="border-b mb-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('news')}
              className="relative pb-3 transition-all duration-200"
              style={{
                color: activeTab === 'news' ? '#00C9B7' : '#9CA3AF',
                fontSize: '15px',
                fontWeight: activeTab === 'news' ? 'bold' : 'normal',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              새소식
              {activeTab === 'news' && (
                <div
                  className="absolute bottom-[-1px] left-0 right-0"
                  style={{
                    height: '2px',
                    background: '#9F7AEA',
                    width: '100%'
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="relative pb-3 transition-all duration-200"
              style={{
                color: activeTab === 'dashboard' ? '#00C9B7' : '#9CA3AF',
                fontSize: '15px',
                fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              연구논문
              {activeTab === 'dashboard' && (
                <div
                  className="absolute bottom-[-1px] left-0 right-0"
                  style={{
                    height: '2px',
                    background: '#9F7AEA',
                    width: '100%'
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('clinical-trials')}
              className="relative pb-3 transition-all duration-200"
              style={{
                color: activeTab === 'clinical-trials' ? '#00C9B7' : '#9CA3AF',
                fontSize: '15px',
                fontWeight: activeTab === 'clinical-trials' ? 'bold' : 'normal',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              임상시험
              {activeTab === 'clinical-trials' && (
                <div
                  className="absolute bottom-[-1px] left-0 right-0"
                  style={{
                    height: '2px',
                    background: '#9F7AEA',
                    width: '100%'
                  }}
                />
              )}
            </button>
          </div>
        </div>
        
        {/* News Tab Content */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {/* Loading State */}
            {loadingNews ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
                <p className="text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  새소식을 불러오는 중...
                </p>
              </div>
            ) : newsItems.length > 0 ? (
              newsItems.map((news) => (
                <div
                  key={news.id}
                  onClick={() => {
                    if (news.url) {
                      window.open(news.url, '_blank');
                    }
                  }}
                  className="bg-white rounded-[16px] overflow-hidden cursor-pointer transition-shadow hover:shadow-lg relative flex flex-col md:flex-row border"
                  style={{
                    boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
                    minHeight: '180px',
                    borderColor: '#E0E0E0'
                  }}
                >
                  {/* Image Section - always show */}
                  <div className="relative w-full md:w-[200px] h-[180px] md:h-auto flex-shrink-0">
                    <ImageWithFallback
                      src={news.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop'}
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-4 md:p-5 md:pl-6 flex flex-col justify-between">
                    <div className="flex-1">
                      {/* Category Badge */}
                      {news.category && (
                        <span
                          className="inline-block px-2 py-1 rounded text-xs mb-2"
                          style={{
                            backgroundColor:
                              news.category === 'policy' ? '#EFF6FF' :
                              news.category === 'nutrition' ? '#FEF3C7' :
                              news.category === 'medical' ? '#F0FDF4' :
                              '#F3F4F6',
                            color:
                              news.category === 'policy' ? '#1E40AF' :
                              news.category === 'nutrition' ? '#92400E' :
                              news.category === 'medical' ? '#15803D' :
                              '#4B5563',
                            fontFamily: 'Noto Sans KR, sans-serif'
                          }}
                        >
                          {news.category === 'policy' ? '정책' :
                           news.category === 'nutrition' ? '영양' :
                           news.category === 'medical' ? '의료' : '뉴스'}
                        </span>
                      )}

                      {/* Title */}
                      <h4
                        className="font-bold text-black mb-2 line-clamp-2"
                        style={{
                          fontSize: '15px',
                          lineHeight: '22px',
                          fontFamily: 'Noto Sans KR, sans-serif'
                        }}
                      >
                        {news.title}
                      </h4>

                      {/* Description */}
                      {news.description && news.description.trim() && (
                        <p
                          className="text-[#272727] line-clamp-2 mb-2"
                          style={{
                            fontSize: '13px',
                            lineHeight: '19px',
                            fontFamily: 'Noto Sans KR, sans-serif'
                          }}
                        >
                          {news.description}
                        </p>
                      )}

                      {/* Keywords */}
                      {news.keywords && news.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {news.keywords.slice(0, 3).map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: '#F3F4F6',
                                color: '#6B7280',
                                fontFamily: 'Noto Sans KR, sans-serif'
                              }}
                            >
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: '#E0E0E0' }}>
                      <p
                        className="text-[#777777]"
                        style={{ fontSize: '11px', fontFamily: 'Noto Sans KR, sans-serif' }}
                      >
                        {news.source} | {news.time}
                      </p>
                      <Bookmark size={20} color="#CCCCCC" strokeWidth={1.4} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  새소식을 찾을 수 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Dashboard Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 py-4">
            {/* Keywords Section */}
            <section>
              <h3 className="mb-4 font-bold text-[#1F2937]">
                📈 인기 키워드
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { text: '당뇨병성 신증', count: 1245, rank: 1 },
                  { text: '25년 복지 수당 신청', count: 1087, rank: 2 },
                  { text: '저칼륨 식단', count: 924, rank: 3 },
                  { text: '투석 관리', count: 856, rank: 4 }
                ].map((keyword, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span 
                          className="flex items-center justify-center rounded-full bg-[#EFF6FF] text-[#00C8B4] font-bold text-sm w-7 h-7"
                        >
                          {keyword.rank}
                        </span>
                        <span className="text-sm font-medium text-[#1F2937]">{keyword.text}</span>
                      </div>
                      
                      <span className="text-xs text-gray-400">
                        {keyword.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Research Trends - PubMed Data */}
            <section>
              <h3 className="mb-4 font-bold text-[#1F2937]">
                📊 연구 트렌드
              </h3>

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="mb-4 text-sm text-gray-500">
                  신장병 관련 주제별 PubMed 연구 논문 발행 추이
                </p>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={researchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ckd" 
                    stroke="#00C8B4" 
                    strokeWidth={3}
                    name="만성신장병"
                    dot={{ fill: '#00C8B4', r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="treatment" 
                    stroke="#9F7AEA" 
                    strokeWidth={3}
                    name="치료법"
                    dot={{ fill: '#9F7AEA', r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="diet" 
                    stroke="#FFB84D" 
                    strokeWidth={3}
                    name="식이요법"
                    dot={{ fill: '#FFB84D', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </section>
          </div>
        )}

        {/* Clinical Trials Tab Content */}
        {activeTab === 'clinical-trials' && (
          <div className="space-y-4">
            {/* Section Header */}
            <h3
              className="font-bold text-[#1F2937] mb-4"
              style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
            >
              임상시험
            </h3>

            {/* Info Banner */}
            <div
              className="rounded-[16px] p-4 mb-6"
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)',
                border: '1px solid #E0F2FE'
              }}
            >
              <p
                className="text-[#272727]"
                style={{ fontSize: '14px', lineHeight: '20px', fontFamily: 'Noto Sans KR, sans-serif' }}
              >
                신장 질환 관련 임상시험 정보를 ClinicalTrials.gov에서 제공받고 있습니다.
                각 임상시험을 클릭하면 AI가 요약한 정보를 확인할 수 있습니다.
                (최신 업데이트순으로 정렬됨)
              </p>
            </div>

            {/* Loading State */}
            {loadingTrials ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
                <p className="text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  임상시험 정보를 불러오는 중...
                </p>
              </div>
            ) : clinicalTrials.length > 0 ? (
              <>
                {/* Clinical Trials List */}
                <div className="grid grid-cols-1 gap-4">
                  {clinicalTrials.map((trial) => (
                    <ClinicalTrialCard
                      key={trial.nctId}
                      trial={trial}
                      onClick={() => handleTrialClick(trial.nctId)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: currentPage === 1 ? '#F3F4F6' : '#00C9B7',
                        color: currentPage === 1 ? '#9CA3AF' : 'white',
                        fontFamily: 'Noto Sans KR, sans-serif',
                        fontSize: '14px'
                      }}
                    >
                      이전
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className="w-10 h-10 rounded-lg transition-colors"
                            style={{
                              backgroundColor: currentPage === pageNum ? '#00C9B7' : '#F3F4F6',
                              color: currentPage === pageNum ? 'white' : '#272727',
                              fontFamily: 'Noto Sans KR, sans-serif',
                              fontSize: '14px',
                              fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#00C9B7',
                        color: currentPage === totalPages ? '#9CA3AF' : 'white',
                        fontFamily: 'Noto Sans KR, sans-serif',
                        fontSize: '14px'
                      }}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#9CA3AF]" style={{ fontFamily: 'Noto Sans KR, sans-serif' }}>
                  임상시험 정보를 찾을 수 없습니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clinical Trial Detail Modal */}
      <ClinicalTrialDetailModal
        nctId={selectedTrialId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
