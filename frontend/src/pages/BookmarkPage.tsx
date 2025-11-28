import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';

// TODO: API에서 즐겨찾기 데이터를 가져오도록 구현 필요
interface BookmarkedNews {
  id: string;
  title: string;
  source: string;
  date: string;
  thumbnail: string | null;
}

interface BookmarkedPaper {
  id: string;
  title: string;
  authors: string;
  date: string;
  pmid: string;
  url: string;
}

// 초기 빈 데이터
const initialNews: BookmarkedNews[] = [];
const initialPapers: BookmarkedPaper[] = [];

export function BookmarkPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'news' | 'papers'>('news');
  const [newsList, setNewsList] = useState<BookmarkedNews[]>(initialNews);
  const [paperList, setPaperList] = useState<BookmarkedPaper[]>(initialPapers);

  const iconStyle = { strokeWidth: 2 };

  const removeNews = (id: string) => {
    if(window.confirm('즐겨찾기에서 삭제하시겠습니까?')) {
      setNewsList(newsList.filter(n => n.id !== id));
    }
  };

  const removePaper = (id: string) => {
    if(window.confirm('즐겨찾기에서 삭제하시겠습니까?')) {
      setPaperList(paperList.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="즐겨찾기" />

      {/* Tabs - Below Header */}
      <div className="px-5 border-b border-[#E0E0E0] bg-white sticky top-[52px] z-40">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('news')}
            className={`pb-3 text-base font-medium transition-colors relative ${
              activeTab === 'news' ? 'text-[#00C9B7]' : 'text-[#999999]'
            }`}
          >
            뉴스
            {activeTab === 'news' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00C9B7]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`pb-3 text-base font-medium transition-colors relative ${
              activeTab === 'papers' ? 'text-[#00C9B7]' : 'text-[#999999]'
            }`}
          >
            논문
            {activeTab === 'papers' && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#00C9B7]" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        {activeTab === 'news' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newsList.length > 0 ? (
              newsList.map((news) => (
                <div 
                  key={news.id} 
                  className="flex gap-4 p-4 rounded-xl border border-[#E0E0E0] bg-white h-full"
                  style={{ boxShadow: 'none' }}
                >
                  <div 
                    className="w-[80px] h-[80px] bg-gray-100 rounded-lg flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/news/detail/${news.id}`)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 
                        className="text-[15px] font-bold text-[#1F2937] leading-[1.4] line-clamp-2 cursor-pointer hover:text-[#00C9B7]"
                        onClick={() => navigate(`/news/detail/${news.id}`)}
                      >
                        {news.title}
                      </h3>
                      <button 
                        onClick={() => removeNews(news.id)}
                        className="text-[#FFD700] flex-shrink-0"
                      >
                        <Star size={20} fill="#FFD700" style={iconStyle} />
                      </button>
                    </div>
                    <div className="text-xs text-[#999999] flex gap-2">
                      <span>{news.source}</span>
                      <span>•</span>
                      <span>{news.date}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
               <div className="flex flex-col items-center justify-center py-20 text-[#999999]">
                 <Star size={40} className="mb-3 opacity-30" />
                 <p>즐겨찾기한 뉴스가 없습니다.</p>
               </div>
            )}
          </div>
        )}

        {activeTab === 'papers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paperList.length > 0 ? (
              paperList.map((paper) => (
                <div 
                  key={paper.id} 
                  className="p-5 rounded-xl border border-[#E0E0E0] bg-white h-full flex flex-col"
                  style={{ boxShadow: 'none' }}
                >
                   <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-[16px] font-bold text-[#1F2937] leading-[1.4]">
                        {paper.title}
                      </h3>
                      <button 
                        onClick={() => removePaper(paper.id)}
                        className="text-[#FFD700] flex-shrink-0"
                      >
                        <Star size={20} fill="#FFD700" style={iconStyle} />
                      </button>
                   </div>
                   
                   <div className="text-sm text-[#666666] mb-1">{paper.authors}</div>
                   <div className="flex items-center gap-3 text-xs text-[#999999] mb-4">
                     <span>{paper.date}</span>
                     <span>PMID: {paper.pmid}</span>
                   </div>

                   <a 
                     href={paper.url} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center justify-center gap-2 w-full h-[44px] rounded-lg border border-[#E0E0E0] bg-white text-[#1F2937] font-medium hover:bg-gray-50 transition-colors"
                     style={{ boxShadow: 'none' }}
                   >
                     <span>논문 보기</span>
                     <ExternalLink size={16} style={iconStyle} />
                   </a>
                </div>
              ))
            ) : (
               <div className="flex flex-col items-center justify-center py-20 text-[#999999]">
                 <Star size={40} className="mb-3 opacity-30" />
                 <p>즐겨찾기한 논문이 없습니다.</p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
