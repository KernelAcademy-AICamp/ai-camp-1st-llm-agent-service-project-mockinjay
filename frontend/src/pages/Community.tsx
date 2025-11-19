import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard.tsx';
import FeaturedCard from '../components/FeaturedCard.tsx';
import CreatePostModal from '../components/CreatePostModal.tsx';
import { fetchPosts, fetchFeaturedPosts } from '../api/community.ts';
import type { PostCard as PostCardType } from '../types/community.ts';
import './Community.css';

const Community: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [featuredPosts, setFeaturedPosts] = useState<PostCardType[]>([]);
  const [posts, setPosts] = useState<PostCardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [featuredPostIds, setFeaturedPostIds] = useState<Set<string>>(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName'));

  // Refs
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMorePosts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load featured posts
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        setFeaturedLoading(true);
        const data = await fetchFeaturedPosts();
        setFeaturedPosts(data);
        // Store featured post IDs to filter them out from regular posts
        setFeaturedPostIds(new Set(data.map(post => post.id)));
      } catch (err) {
        console.error('Failed to load featured posts:', err);
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadFeatured();
  }, []);

  // Load initial posts
  useEffect(() => {
    loadMorePosts();
  }, []);

  // Load more posts
  const loadMorePosts = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetchPosts({
        limit: 20,
        cursor: cursor,
        sortBy: 'lastActivityAt',
      });

      // Filter out duplicate posts and featured posts to avoid duplicate keys
      const newPosts = response.posts.filter(
        newPost => !posts.some(existingPost => existingPost.id === newPost.id) &&
                   !featuredPostIds.has(newPost.id)
      );

      setPosts((prev) => [...prev, ...newPosts]);
      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Handle post click
  const handlePostClick = (postId: string) => {
    navigate(`/community/${postId}`);
  };

  // Handle write button click
  const handleWriteClick = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다');
      navigate('/login');
      return;
    }
    setIsCreateModalOpen(true);
  };

  // Development: Quick login bypass for testing
  const handleDevLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/dev-login', {
        method: 'POST',
      });
      const data = await response.json();

      // Store token and user info in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userName', data.user.name);

      // Update state
      setIsLoggedIn(true);
      setUserName(data.user.name);

      alert('테스트 로그인 성공! 🎉\n이제 글을 작성할 수 있습니다.');
    } catch (err) {
      console.error('Dev login failed:', err);
      alert('로그인 우회에 실패했습니다.');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setUserName(null);
    alert('로그아웃 완료!');
  };

  // Handle post deletion - remove from list immediately
  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  // Handle create post success
  const handleCreateSuccess = (postId: string) => {
    navigate(`/community/${postId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full box-border">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">커뮤니티</h1>
            <div className="flex items-center space-x-3">
              {/* Login Status & Dev Login */}
              {!isLoggedIn ? (
                <button
                  onClick={handleDevLogin}
                  className="flex items-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                  title="개발 전용: 로그인 우회 버튼"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h12.5A2.5 2.5 0 0121 12a2.5 2.5 0 01-2.5 2.5M11 16l-4-4m0 0l4-4m-4 4h12.5A2.5 2.5 0 0121 12a2.5 2.5 0 01-2.5 2.5"
                    />
                  </svg>
                  <span>테스트 로그인</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 font-medium">
                    {userName}님
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>로그아웃</span>
                  </button>
                </div>
              )}

              {/* Write Button */}
              <button
                onClick={handleWriteClick}
                className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>글쓰기</span>
              </button>
            </div>
          </div>
          <p className="text-gray-600">
            질문과 답변을 통해 지식을 나누세요. 상단의 인기 게시글을 확인해보세요.
          </p>
        </div>

        {/* Featured Posts */}
        <div className="mb-8">
          {featuredLoading ? (
            <div className="flex space-x-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md min-w-[280px] h-64 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {featuredPosts.map((post) => (
                <FeaturedCard
                  key={post.id}
                  post={post}
                  onClick={handlePostClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main Posts List */}
        <div className="space-y-4">
          {(() => {
            // Filter out featured posts to avoid duplicate rendering with same keys
            const filteredPosts = posts.filter(post => !featuredPostIds.has(post.id));
            return filteredPosts.map((post, index) => {
              if (filteredPosts.length === index + 1) {
                return (
                  <div key={post.id} ref={lastPostRef}>
                    <PostCard
                      post={post}
                      onClick={handlePostClick}
                      onDelete={handlePostDelete}
                    />
                  </div>
                );
              } else {
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={handlePostClick}
                    onDelete={handlePostDelete}
                  />
                );
              }
            });
          })()}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500" />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={loadMorePosts}
                className="mt-4 text-teal-500 hover:text-teal-600 font-medium"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* No More Posts */}
          {!loading && !hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              모든 게시글을 불러왔습니다.
            </div>
          )}

          {/* Empty State */}
          {!loading && posts.length === 0 && !error && (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                게시글이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">첫 번째 글을 작성해보세요!</p>
              <button
                onClick={handleWriteClick}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                글쓰기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Community;
