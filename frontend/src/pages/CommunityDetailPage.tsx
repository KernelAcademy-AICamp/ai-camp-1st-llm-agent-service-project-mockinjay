import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MoreVertical, Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Mock Data
const mockPost = {
  id: '1',
  title: '신장병 진단 후 식단 관리가 너무 어렵네요 ㅠㅠ',
  author: {
    name: '건강지킴이',
    avatar: null, 
  },
  createdAt: '2025.02.24 14:30',
  category: '식단고민',
  content: `처음 진단 받고 나서는 무엇을 먹어야 할지 정말 막막했습니다.
저칼륨, 저인 식단을 지키려고 노력 중인데, 
매일 똑같은 음식만 먹다 보니 식욕도 떨어지고 우울해지네요.

다른 환우분들은 어떻게 식단 관리하고 계신가요?
맛있게 먹을 수 있는 레시피나 팁이 있다면 공유 부탁드립니다.`,
  images: ['figma:asset/example_image.png'], 
  likes: 15,
  comments: 12,
};

const mockComments = [
  {
    id: 'c1',
    author: { name: '긍정마인드', avatar: null },
    content: '저도 처음엔 그랬어요. 시간이 지나면 조금씩 요령이 생기더라고요. 화이팅하세요!',
    createdAt: '1시간 전',
    isOwner: false,
  },
  {
    id: 'c2',
    author: { name: '건강지킴이', avatar: null },
    content: '감사합니다. 힘내볼게요!',
    createdAt: '방금 전',
    isOwner: true,
  }
];

export function CommunityDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [comment, setComment] = useState('');

  const iconStyle = { strokeWidth: 2 };

  const handleMenuClick = () => {
    setIsMenuOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-white relative">
      {/* Header */}
      <MobileHeader 
        title="커뮤니티 상세" 
        rightAction={
          <button onClick={handleMenuClick} className="p-1">
            <MoreVertical size={24} color="#1F2937" style={iconStyle} />
          </button>
        }
      />

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-[80px] lg:pb-24 no-scrollbar">
        <div className="p-5 max-w-3xl mx-auto">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium">
              {mockPost.author.name[0]}
            </div>
            <div>
              <div className="text-sm font-medium text-[#1F2937]">{mockPost.author.name}</div>
              <div className="text-xs text-[#999999]">{mockPost.createdAt}</div>
            </div>
            <div className="ml-auto px-2 py-1 bg-[#F5F5F5] rounded text-xs text-[#666666]">
              {mockPost.category}
            </div>
          </div>

          {/* Post Content */}
          <div className="text-base text-[#1F2937] leading-[1.6] whitespace-pre-line mb-6">
            {mockPost.content}
          </div>

          {/* Image Placeholder */}
          {mockPost.images && mockPost.images.length > 0 && (
            <div className="w-full bg-gray-100 rounded-xl mb-6 overflow-hidden">
               <ImageWithFallback 
                 src={mockPost.images[0]} 
                 alt="Post image" 
                 className="w-full h-auto object-cover"
               />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 border-b border-[#E0E0E0] pb-4 mb-6">
            <button className="flex items-center gap-1.5 text-[#666666]">
              <Heart size={20} style={iconStyle} />
              <span className="text-sm">{mockPost.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-[#666666]">
              <MessageCircle size={20} style={iconStyle} />
              <span className="text-sm">{mockPost.comments}</span>
            </button>
            <button className="ml-auto text-[#666666]">
              <Share2 size={20} style={iconStyle} />
            </button>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-[16px] font-bold text-[#1F2937] mb-4">댓글 {mockPost.comments}개</h3>
            <div className="space-y-6">
              {mockComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-medium">
                     {comment.author.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1F2937]">{comment.author.name}</span>
                        <span className="text-xs text-[#999999]">{comment.createdAt}</span>
                      </div>
                      {comment.isOwner && (
                         <button className="text-[#999999]">
                           <MoreVertical size={16} style={iconStyle} />
                         </button>
                      )}
                    </div>
                    <p className="text-sm text-[#1F2937] leading-[1.6] mb-2">{comment.content}</p>
                    <button className="text-xs text-[#666666] font-medium">답글 달기</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Comment Input */}
      <div 
        className="fixed bottom-[64px] left-0 right-0 bg-white border-t border-[#E0E0E0] lg:bottom-6 lg:w-[800px] lg:mx-auto lg:rounded-xl lg:border z-50"
        style={{ boxShadow: 'none' }} 
      >
        <div className="flex items-center gap-3 p-3 lg:p-4">
           <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs font-medium">
             나
           </div>
           <div className="flex-1 relative">
             <input 
               type="text" 
               placeholder="댓글을 입력하세요"
               className="w-full pl-4 pr-10 py-2.5 rounded-full border border-[#E0E0E0] text-sm outline-none focus:border-[#00C9B7] transition-colors"
               value={comment}
               onChange={(e) => setComment(e.target.value)}
               style={{ boxShadow: 'none' }} 
             />
             <button 
               className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full flex items-center justify-center transition-all"
               disabled={!comment.trim()}
               style={{ 
                 backgroundColor: comment.trim() ? '#00C9B7' : '#E0E0E0',
                 color: 'white'
               }}
             >
               <Send size={14} strokeWidth={2} />
             </button>
           </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div 
            className="w-full max-w-md bg-white rounded-t-2xl p-4 space-y-2 animate-slide-up mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => navigate(`/community/edit/${mockPost.id}`)} 
              className="w-full py-3 text-center text-[#1F2937] font-medium border-b border-[#F3F4F6]"
            >
              수정하기
            </button>
            <button 
              onClick={() => {
                alert('삭제되었습니다.');
                navigate('/community');
              }}
              className="w-full py-3 text-center text-[#EF4444] font-medium border-b border-[#F3F4F6]"
            >
              삭제하기
            </button>
            <button 
              className="w-full py-3 text-center text-[#666666]" 
              onClick={() => setIsMenuOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
