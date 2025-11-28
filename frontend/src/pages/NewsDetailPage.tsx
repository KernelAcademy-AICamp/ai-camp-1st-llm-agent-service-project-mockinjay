import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// TODO: API에서 뉴스 데이터를 가져오도록 구현 필요
interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  thumbnail: string | null;
  content: string;
  url: string;
}

interface RelatedNews {
  id: string;
  title: string;
  date: string;
  thumbnail: string | null;
}

// 초기 빈 데이터
const emptyNews: NewsItem = {
  id: '',
  title: '',
  source: '',
  date: '',
  thumbnail: null,
  content: '',
  url: ''
};

const emptyRelatedNews: RelatedNews[] = [];

export function NewsDetailPage() {
  const navigate = useNavigate();
  const { id: _id } = useParams();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newsData] = useState<NewsItem>(emptyNews);
  const [relatedNews] = useState<RelatedNews[]>(emptyRelatedNews);

  // TODO: useEffect로 id를 기반으로 API에서 뉴스 데이터를 가져오도록 구현 필요

  // Styles
  const iconStyle = { strokeWidth: 2 };

  // 데이터가 없을 때 표시
  if (!newsData.id) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <MobileHeader title="새소식" />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          뉴스를 불러오는 중...
        </div>
      </div>
    );
  }

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
            {newsData.thumbnail ? (
               <ImageWithFallback
                 src={newsData.thumbnail}
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
            {newsData.title}
          </h1>
          <div className="text-xs lg:text-sm text-[#999999] mb-6 flex items-center gap-2">
            <span>{newsData.source}</span>
            <span>•</span>
            <span>{newsData.date}</span>
          </div>

          <div className="h-[1px] bg-[#E0E0E0] w-full mb-8"></div>

          {/* Body */}
          <div className="text-base text-[#1F2937] leading-[1.6] whitespace-pre-line mb-10">
            {newsData.content}
          </div>

          {/* Link Button */}
          {newsData.url && (
            <a
              href={newsData.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full h-[52px] rounded-xl border border-[#E0E0E0] bg-white text-[#1F2937] font-medium mb-12 hover:bg-gray-50 transition-colors"
              style={{ boxShadow: 'none' }}
            >
              <span>원문 보기</span>
              <ChevronRight size={20} style={iconStyle} />
            </a>
          )}

          {/* Related News */}
          {relatedNews.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
