import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Mock Data
const mockNews = {
  id: '1',
  title: '2025 미국신장학회 신장주간서 FINE-ONE 3상 연구 결과 발표',
  source: '메디컬헤럴드',
  date: '2025.02.23',
  thumbnail: 'figma:asset/news_thumb_1.png',
  content: `FINE-ONE 연구 결과, 1형 당뇨병 동반 만성 신장병 환자를 대상으로 피네레논(Finerenone)의 유의한 알부민뇨 감소 효과를 확인했다.
  
전 세계 만성신장병(Chronic Kidney Disease, CKD) 환자가 급증하는 가운데, 이번 연구 결과는 1형 당뇨병 환자들에게 새로운 치료 옵션을 제시할 것으로 기대된다.

이번 연구는 1형 당뇨병 환자 200명을 대상으로 진행되었으며, 6개월간의 추적 관찰 결과 피네레논 투여군에서 위약군 대비 UACR이 30% 이상 감소한 것으로 나타났다.

연구 책임자는 "이번 결과는 1형 당뇨병 환자의 신장 보호에 있어 중요한 이정표가 될 것"이라고 밝혔다.`,
  url: 'https://www.medical-herald.com'
};

const relatedNews = [
  {
    id: '2',
    title: '전 세계 CKD 성인환자 8억 명',
    date: '3일전',
    thumbnail: null 
  },
  {
    id: '3',
    title: '만성신장병 급여확대 포시가 제네릭은 되고, 자디앙 안된 이유',
    date: '2일전',
    thumbnail: null
  },
  {
    id: '4',
    title: '신장 건강을 위한 5가지 생활 습관',
    date: '1일전',
    thumbnail: null
  }
];

export function NewsDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Styles
  const iconStyle = { strokeWidth: 2 };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <MobileHeader 
        title="새소식" 
        rightAction={
          <button onClick={() => setIsBookmarked(!isBookmarked)} className="p-1">
             <Star 
               size={24} 
               color={isBookmarked ? "#FFD700" : "#E0E0E0"} 
               fill={isBookmarked ? "#FFD700" : "none"}
               style={iconStyle} 
             />
          </button>
        }
      />

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 pb-10 no-scrollbar">
        <div className="max-w-4xl mx-auto">
          {/* Thumbnail (16:9) */}
          <div className="w-full aspect-video bg-gray-100 rounded-xl mb-6 overflow-hidden">
            {mockNews.thumbnail ? (
               <ImageWithFallback 
                 src={mockNews.thumbnail} 
                 alt="News thumbnail" 
                 className="w-full h-full object-cover"
               />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-gray-400">
                 뉴스 썸네일 이미지
               </div>
            )}
          </div>

          {/* Title & Meta */}
          <h1 className="text-[18px] lg:text-2xl font-bold text-[#1F2937] leading-[1.4] mb-3">
            {mockNews.title}
          </h1>
          <div className="text-xs lg:text-sm text-[#999999] mb-6 flex items-center gap-2">
            <span>{mockNews.source}</span>
            <span>•</span>
            <span>{mockNews.date}</span>
          </div>

          <div className="h-[1px] bg-[#E0E0E0] w-full mb-8"></div>

          {/* Body */}
          <div className="text-base text-[#1F2937] leading-[1.6] whitespace-pre-line mb-10">
            {mockNews.content}
          </div>

          {/* Link Button */}
          <a 
            href={mockNews.url} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl border border-[#E0E0E0] bg-white text-[#1F2937] font-medium mb-12 hover:bg-gray-50 transition-colors"
            style={{ boxShadow: 'none' }}
          >
            <span>원문 보기</span>
            <ChevronRight size={20} style={iconStyle} />
          </a>

          {/* Related News */}
          <div>
            <h2 className="text-[18px] font-bold text-[#1F2937] mb-4">관련 뉴스</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedNews.map((news) => (
                <button 
                  key={news.id} 
                  onClick={() => navigate(`/news/detail/${news.id}`)}
                  className="flex md:flex-col gap-3 p-3 rounded-xl border border-[#E0E0E0] bg-white text-left hover:bg-gray-50 transition-colors h-full"
                  style={{ boxShadow: 'none' }}
                >
                  <div className="w-[80px] h-[80px] md:w-full md:h-[140px] bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {/* Placeholder or Image */}
                  </div>
                  <div className="flex flex-col justify-center md:justify-start flex-1">
                    <h3 className="text-[14px] font-bold text-[#1F2937] leading-[1.4] mb-1 line-clamp-2">
                      {news.title}
                    </h3>
                    <span className="text-xs text-[#999999]">{news.date}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
