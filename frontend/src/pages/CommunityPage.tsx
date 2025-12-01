import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Plus, Edit2, Trash2 } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';

interface Post {
  id: string;
  category: '자유' | '챌린지' | '설문조사' | '질문' | '정보';
  author: string;
  authorId: string;
  authorType: '일반인' | '환우' | '연구자';
  knowledgeLevel: number;
  title: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
}

const mockPosts: Post[] = [
  {
    id: '1',
    category: '자유',
    author: '건강지킴이',
    authorId: 'user123',
    authorType: '환우',
    knowledgeLevel: 3,
    title: '저칼륨 식단 1주일 도전 후기',
    content: '신장병 진단 받고 나서 식단 조절이 가장 어려웠는데, 저칼륨 식단을 1주일 동안 실천해봤어요. 생각보다 맛있는 레시피가 많더라구요!',
    image: 'https://images.unsplash.com/photo-1642339800099-921df1a0a958?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwZm9vZCUyMGJvd2x8ZW58MXx8fHwxNzYzODE0MTc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    likes: 24,
    comments: 8,
    shares: 3,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    category: '챌린지',
    author: '김연구',
    authorId: 'user456',
    authorType: '연구자',
    knowledgeLevel: 5,
    title: '신장병 환자를 위한 운동 가이드',
    content: '최근 연구에 따르면 적절한 유산소 운동이 신장 기능 개선에 도움이 된다고 합니다. 하루 30분 걷기부터 시작해보세요.',
    likes: 45,
    comments: 12,
    shares: 8,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: '3',
    category: '설문조사',
    author: '희망이',
    authorId: 'currentUser',
    authorType: '환우',
    knowledgeLevel: 2,
    title: '투석 5년차, 긍정적인 마음가짐의 중요성',
    content: '투석을 시작한 지 5년이 되었습니다. 처음엔 힘들었지만 긍정적인 마음과 주변 분들의 응원으로 잘 이겨내고 있어요. 함께 힘내요!',
    likes: 67,
    comments: 23,
    shares: 5,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

export function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedCategory, setSelectedCategory] = useState<'전체' | '자유' | '챌린지' | '설문조사'>('전체');

  // Mock user data - In real app, this would come from auth context
  const currentUserId = 'currentUser'; // ID of logged-in user
  const userType: 'guest' | 'user' | 'admin' = 'user'; // 'guest', 'user', or 'admin'

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const handleEdit = (postId: string) => {
    // Navigate to edit page or open edit modal
    navigate(`/community/edit/${postId}`);
  };

  const handleDelete = (postId: string) => {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
  };
  
  const filteredPosts = posts.filter(post =>
    selectedCategory === '전체' || post.category === selectedCategory
  );
  
  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FFFFFF' }}>
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader 
          title="커뮤니티" 
          showMenu={true} 
          showProfile={true}
        />
      </div>

      <div className="p-6 lg:max-w-[832px] mx-auto pb-24 lg:pb-6">
        {/* Desktop Title Removed */}
        
        {/* Category Tabs - Moved directly under header area */}
        <div className="border-b mb-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex gap-6">
            {(['전체', '자유', '챌린지', '설문조사'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="relative pb-3 transition-all duration-200"
                style={{
                  color: selectedCategory === cat ? '#00C9B7' : '#9CA3AF',
                  fontSize: '15px',
                  fontWeight: selectedCategory === cat ? '600' : '400'
                }}
              >
                {cat}
                {selectedCategory === cat && (
                  <div 
                    className="absolute bottom-0 left-0 right-0"
                    style={{ 
                      height: '2px',
                      background: '#9F7AEA'
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPosts.map((post) => (
            <article 
              key={post.id}
              onClick={() => navigate(`/community/detail/${post.id}`)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ background: '#D1D5DB' }}
                >
                  {post.author[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {post.author}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        background: '#F3F4F6',
                        color: '#6B7280',
                        fontSize: '11px'
                      }}
                    >
                      {post.authorType} | 레벨 {post.knowledgeLevel}
                    </span>
                  </div>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    {getTimeAgo(post.timestamp)}
                  </span>
                </div>
                {/* Edit/Delete Buttons */}
                {(userType === 'user' && post.authorId === currentUserId) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(post.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit2 size={16} color="#6B7280" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </div>
                )}
                {userType === 'admin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ 
                    background: getCategoryColor(post.category).bg,
                    color: getCategoryColor(post.category).text
                  }}
                >
                  {post.category}
                </span>
              </div>
              
              <h3 
                style={{ 
                  color: 'var(--color-text-primary)',
                  fontSize: '11pt',
                  lineHeight: '1.4'
                }}
              >
                {post.title}
              </h3>
              <p 
                className="mb-3 line-clamp-2" 
                style={{ 
                  color: 'var(--color-text-secondary)',
                  fontSize: '10pt',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {post.content}
              </p>
              
              {post.image && (
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                  className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                >
                  <Heart size={18} />
                  <span>{post.likes}</span>
                </button>
                <div className="flex items-center gap-1">
                  <MessageCircle size={18} />
                  <span>{post.comments}</span>
                </div>
                <button className="flex items-center gap-1 hover:opacity-70 transition-opacity">
                  <Share2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Floating Create Button */}
        <button
          onClick={() => navigate('/community/create')}
          className="fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50"
          style={{
            background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)'
          }}
        >
          <Plus size={28} color="white" />
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;
  
  return date.toLocaleDateString('ko-KR');
}

function getCategoryColor(category: Post['category']) {
  // 모든 카테고리 태그는 동일한 Category Tag 스타일 적용
  return { bg: '#F2FFFD', text: '#00C8B4' };
}
