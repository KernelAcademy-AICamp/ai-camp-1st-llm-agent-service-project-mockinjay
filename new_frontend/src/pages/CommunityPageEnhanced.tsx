/**
 * CommunityPageEnhanced
 * 커뮤니티 페이지 - 게시글 목록, 인기 게시글, 글쓰기, 상세 페이지
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import {
  Users,
  PenSquare,
  Loader2,
  AlertCircle,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
  Heart,
  Send,
  Calendar,
  Trash2,
} from 'lucide-react';

// Components
import { PostCard, FeaturedCard, CreatePostModal } from '../components/community';

// API
import { fetchPosts, fetchFeaturedPosts, fetchPostDetailPage, createComment, deleteComment, toggleLike, deletePost } from '../services/communityApi';

// Utils
import { storage, getAnonymousId } from '../utils/storage';
import type { PostCard as PostCardType, PostDetail, Comment } from '../types/community';

const CommunityPageEnhanced: React.FC = () => {
  const { language } = useApp();
  const { postId } = useParams<{ postId: string }>();

  // If postId exists, show detail view
  if (postId) {
    return <PostDetailView postId={postId} language={language} />;
  }

  return <CommunityListView language={language} />;
};

// ==================== Post Detail View ====================
const PostDetailView: React.FC<{ postId: string; language: 'en' | 'ko' }> = ({ postId, language }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);

  const isLoggedIn = !!storage.get('careguide_token');

  const t = {
    back: language === 'ko' ? '목록으로' : 'Back to list',
    comments: language === 'ko' ? '댓글' : 'Comments',
    writeComment: language === 'ko' ? '댓글을 작성하세요...' : 'Write a comment...',
    submit: language === 'ko' ? '등록' : 'Submit',
    loginRequired: language === 'ko' ? '로그인이 필요합니다' : 'Login required',
    deleteConfirm: language === 'ko' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete?',
    deleted: language === 'ko' ? '삭제되었습니다' : 'Deleted',
    loadError: language === 'ko' ? '게시글을 불러오는데 실패했습니다.' : 'Failed to load post.',
    notFound: language === 'ko' ? '게시글을 찾을 수 없습니다.' : 'Post not found.',
    anonymous: language === 'ko' ? '익명' : 'Anonymous',
    anonymousTooltip: language === 'ko' ? '익명으로 댓글 작성 (같은 게시글에서 같은 번호 유지)' : 'Post comment anonymously (same number within same post)',
  };

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        const data = await fetchPostDetailPage(postId);
        setPost(data.post);
        setComments(data.comments || []);
        setIsLiked(data.post.likedByMe);
        setLikeCount(data.post.likes);
      } catch (err: any) {
        console.error('Failed to load post:', err);
        setError(err.response?.status === 404 ? t.notFound : t.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const handleBack = () => navigate('/community');

  const handleLike = async () => {
    // Anonymous users can now like posts too (backend supports it)
    try {
      await toggleLike(postId, isLiked);
      setIsLiked(!isLiked);
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleSubmitComment = async () => {
    // Anonymous users can now comment too (backend supports it)
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      // Include anonymousId for consistent anonymous numbering
      // 에브리타임 스타일: 같은 게시글에서 같은 사용자는 같은 번호 유지
      const comment = await createComment({
        postId,
        content: newComment.trim(),
        anonymousId: getAnonymousId(),  // Always send for consistent identification
        isAnonymous: isLoggedIn ? isCommentAnonymous : true,  // Logged-in users can choose, non-logged-in always anonymous
      });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      // Reset anonymous toggle after submission (optional - you can keep it checked)
      // setIsCommentAnonymous(false);
    } catch (err) {
      console.error('Failed to create comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deletePost(postId);
      alert(t.deleted);
      navigate('/community');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const formatDate = (dateString: string) => {
    // Backend stores UTC time without timezone indicator, so add 'Z' to parse as UTC
    const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcDateString);
    // Convert to Korean timezone (UTC+9)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error || t.notFound}</p>
        <button
          onClick={handleBack}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={20} />
          {t.back}
        </button>
      </div>
    );
  }

  // Check if current user can delete post (author only)
  // 사용자가 게시글 작성자인 경우에만 삭제 가능 (Check if user is the post author)
  // 로그인 사용자: user.id 비교, 익명 사용자: getAnonymousId() 비교
  const savedUser = storage.get<{ id: string }>('careguide_user');
  const currentUserId = savedUser?.id || getAnonymousId();
  const canDeletePost = currentUserId === post.authorId || currentUserId === post.userId;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        {t.back}
      </button>

      {/* Post Content */}
      <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full mb-2">
              {post.postType}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
          </div>
          {canDeletePost && (
            <div className="flex gap-2">
              <button
                onClick={handleDeletePost}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                title={language === 'ko' ? '게시글 삭제' : 'Delete post'}
              >
                <Trash2 size={20} />
                <span className="text-sm">{language === 'ko' ? '삭제' : 'Delete'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Author & Date */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-medium text-gray-900 dark:text-white">{post.author.name}</span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.createdAt)}
          </span>
        </div>

        {/* Images - 2/3 width, centered, 2-column grid layout */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-6 flex justify-center">
            <div className="w-2/3 grid grid-cols-2 gap-3">
              {post.imageUrls.slice(0, 5).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Post image ${idx + 1}`}
                  className="w-full aspect-square object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none mb-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isLiked
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MessageSquare size={20} />
            <span>{comments.length}</span>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t.comments} ({comments.length})
        </h2>

        {/* Comment Input */}
        <div className="mb-6">
          <div className="flex gap-3 mb-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t.writeComment}
              className="input-field flex-1 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
            />
            <button
              onClick={handleSubmitComment}
              disabled={submittingComment || !newComment.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submittingComment ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {t.submit}
            </button>
          </div>
          {/* Anonymous Checkbox (only for logged-in users) */}
          {isLoggedIn && (
            <label className="flex items-center gap-2 cursor-pointer text-sm" title={t.anonymousTooltip}>
              <input
                type="checkbox"
                checked={isCommentAnonymous}
                onChange={(e) => setIsCommentAnonymous(e.target.checked)}
                disabled={submittingComment}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded
                  focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800
                  dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-gray-600 dark:text-gray-400">{t.anonymous}</span>
            </label>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => {
            // Check if current user can delete comment (author only)
            // 사용자가 댓글 작성자인 경우에만 삭제 가능 (Check if user is the comment author)
            // 로그인 사용자: user.id 비교, 익명 사용자: getAnonymousId() 비교
            const commentSavedUser = storage.get<{ id: string }>('careguide_user');
            const commentCurrentUserId = commentSavedUser?.id || getAnonymousId();
            const canDeleteComment = commentCurrentUserId === comment.authorId || commentCurrentUserId === comment.userId;
            return (
              <div
                key={comment.id}
                className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.author?.name || comment.authorName || '익명'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {canDeleteComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title={language === 'ko' ? '댓글 삭제' : 'Delete comment'}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            );
          })}

          {comments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {language === 'ko' ? '아직 댓글이 없습니다.' : 'No comments yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== Community List View ====================
const CommunityListView: React.FC<{ language: 'en' | 'ko' }> = ({ language }) => {
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Refs for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Translations
  const t = {
    title: language === 'ko' ? '커뮤니티' : 'Community',
    subtitle: language === 'ko'
      ? '질문과 답변을 통해 지식을 나누세요. 상단의 인기 게시글을 확인해보세요.'
      : 'Share knowledge through questions and answers. Check out featured posts above.',
    write: language === 'ko' ? '글쓰기' : 'Write',
    allLoaded: language === 'ko' ? '모든 게시글을 불러왔습니다.' : 'All posts loaded.',
    noPosts: language === 'ko' ? '게시글이 없습니다' : 'No posts yet',
    firstPost: language === 'ko' ? '첫 번째 글을 작성해보세요!' : 'Be the first to write!',
    retry: language === 'ko' ? '다시 시도' : 'Retry',
    loadError: language === 'ko' ? '게시글을 불러오는데 실패했습니다.' : 'Failed to load posts.',
    featuredPosts: language === 'ko' ? '인기 게시글' : 'Featured Posts',
  };

  // Load featured posts
  useEffect(() => {
    const loadFeatured = async () => {
      try {
        setFeaturedLoading(true);
        const data = await fetchFeaturedPosts();
        setFeaturedPosts(data);
      } catch (err) {
        console.error('Failed to load featured posts:', err);
      } finally {
        setFeaturedLoading(false);
      }
    };

    loadFeatured();
  }, []);

  // Load more posts
  const loadMorePosts = useCallback(async (currentCursor: string | null = null) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await fetchPosts({
        limit: 20,
        cursor: currentCursor,
        sortBy: 'lastActivityAt',
      });

      // Filter out duplicate posts using functional update to get latest state
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newPosts = response.posts.filter((newPost) => !existingIds.has(newPost.id));
        return [...prev, ...newPosts];
      });

      setCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setInitialLoadDone(true);
    } catch (err) {
      console.error('Failed to load posts:', err);
      setError(t.loadError);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [t.loadError]);

  // Load initial posts
  useEffect(() => {
    loadMorePosts(null);
  }, []);

  // Infinite scroll callback
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || !initialLoadDone) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMorePosts(cursor);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, cursor, initialLoadDone, loadMorePosts]
  );

  // Handle post click
  const handlePostClick = (postId: string) => {
    navigate(`/community/${postId}`);
  };

  // Handle write button click
  const handleWriteClick = () => {
    // Anonymous users can now create posts too (backend supports it)
    setIsCreateModalOpen(true);
  };

  // Handle post deletion
  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // Handle create post success
  const handleCreateSuccess = (postId: string) => {
    navigate(`/community/${postId}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="text-primary-600" />
            {t.title}
          </h1>

          <div className="flex items-center gap-3">
            {/* Write Button */}
            <button
              onClick={handleWriteClick}
              className="btn-primary-action flex items-center gap-2"
            >
              <PenSquare size={20} />
              <span>{t.write}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">{t.subtitle}</p>
      </div>

      {/* Featured Posts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          {t.featuredPosts}
        </h2>
        {featuredLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md min-w-[280px] h-64 animate-pulse"
              />
            ))}
          </div>
        ) : featuredPosts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {featuredPosts.map((post) => (
              <FeaturedCard key={post.id} post={post} onClick={handlePostClick} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Main Posts List */}
      <div className="space-y-4">
        {posts.map((post, index) => {
          const uniqueKey = `post-${post.id}-${index}`;
          if (posts.length === index + 1) {
            return (
              <div key={uniqueKey} ref={lastPostRef}>
                <PostCard
                  post={post}
                  onClick={handlePostClick}
                  onDelete={handlePostDelete}
                  language={language}
                />
              </div>
            );
          } else {
            return (
              <PostCard
                key={uniqueKey}
                post={post}
                onClick={handlePostClick}
                onDelete={handlePostDelete}
                language={language}
              />
            );
          }
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
            <button
              onClick={() => loadMorePosts(cursor)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300
                font-medium flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} />
              {t.retry}
            </button>
          </div>
        )}

        {/* No More Posts */}
        {!loading && !hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t.allLoaded}</div>
        )}

        {/* Empty State */}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center py-16">
            <MessageSquare size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.noPosts}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t.firstPost}</p>
            <button
              onClick={handleWriteClick}
              className="btn-primary-action"
            >
              {t.write}
            </button>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        language={language}
      />
    </div>
  );
};

export default CommunityPageEnhanced;
