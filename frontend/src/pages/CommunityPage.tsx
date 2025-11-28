import { useState } from 'react';
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

// TODO: API에서 게시글 목록을 가져오도록 구현 필요
const initialPosts: Post[] = [];

export function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState<'전체' | '자유' | '챌린지' | '설문조사'>('전체');

  // TODO: 실제 인증 컨텍스트에서 사용자 정보를 가져오도록 구현 필요
  const currentUserId = ''; // 로그인한 사용자 ID
  const userType = 'guest' as 'guest' | 'user' | 'admin';

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

function getCategoryColor(_category: Post['category']) {
  // 모든 카테고리 태그는 동일한 Category Tag 스타일 적용
  return { bg: '#F2FFFD', text: '#00C8B4' };
}
