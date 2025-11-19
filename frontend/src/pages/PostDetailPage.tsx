import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPostDetailPage, toggleLike, createComment, deletePost, updatePost } from '../api/community.ts';
import type { PostDetail, Comment } from '../types/community.ts';
import CommentList from '../components/CommentList.tsx';
import CommentForm from '../components/CommentForm.tsx';
import './PostDetailPage.css';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  // Inline editing state (COM-009)
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Current user ID (from localStorage - replace with actual auth context in production)
  const currentUserId = localStorage.getItem('userId');
  const isLoggedIn = !!localStorage.getItem('token');

  // Load post detail
  useEffect(() => {
    // Create a flag to track if component is mounted (prevent double API calls in StrictMode)
    let isMounted = true;

    const loadDetail = async () => {
      if (!postId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await fetchPostDetailPage(postId);
        if (isMounted) {
          setPost(data.post);
          setComments(data.comments);
          setEditTitle(data.post.title);
          setEditContent(data.post.content);
        }
      } catch (err: any) {
        if (isMounted) {
          const errorMsg = err.response?.data?.detail || '게시글을 불러올 수 없습니다';
          setError(errorMsg);
          console.error('Error loading post detail:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetail();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [postId]);

  // Used for reloading post data after edit/delete operations
  const loadPostDetail = async () => {
    if (!postId) return;

    try {
      const data = await fetchPostDetailPage(postId);
      setPost(data.post);
      setComments(data.comments);
      setEditTitle(data.post.title);
      setEditContent(data.post.content);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '게시글을 불러올 수 없습니다';
      setError(errorMsg);
      console.error('Error loading post detail:', err);
    }
  };

  // Handle edit start
  const handleEditStart = () => {
    setIsEditing(true);
    setEditTitle(post!.title);
    setEditContent(post!.content);
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(post!.title);
    setEditContent(post!.content);
  };

  // Handle edit save (COM-009)
  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      alert('제목을 입력해주세요');
      return;
    }
    if (!editContent.trim()) {
      alert('내용을 입력해주세요');
      return;
    }

    // 변경 감지: 수정 전후 내용이 같으면 저장 안 함
    if (editTitle === post!.title && editContent === post!.content) {
      alert('변경된 내용이 없습니다');
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      await updatePost(postId!, {
        title: editTitle,
        content: editContent,
        imageUrls: post!.imageUrls
      });

      // 수정 후 전체 게시글 데이터를 다시 로드 (댓글 등 모든 정보 동기화)
      await loadPostDetail();
      setIsEditing(false);
      alert('게시글이 수정되었습니다');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '수정 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error updating post:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle like toggle
  const handleLikeToggle = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (!post) return;

    try {
      setIsTogglingLike(true);
      await toggleLike(postId!, post.likedByMe);

      // Update local state
      setPost(prev => prev ? {
        ...prev,
        likedByMe: !prev.likedByMe,
        likes: prev.likedByMe ? prev.likes - 1 : prev.likes + 1
      } : null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '좋아요 처리 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error toggling like:', err);
    } finally {
      setIsTogglingLike(false);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (content: string) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (!postId) return;

    try {
      const newComment = await createComment({
        postId,
        content
      });

      setComments(prev => [...prev, newComment]);
      if (post) {
        setPost(prev => prev ? {
          ...prev,
          commentCount: prev.commentCount + 1
        } : null);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '댓글 작성 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error creating comment:', err);
    }
  };

  // Handle local comment update (maintains order)
  const handleCommentUpdateLocal = (updatedComment: Comment) => {
    // Check if this is a deletion (only has id property)
    if (Object.keys(updatedComment).length === 1) {
      // Delete: filter out the comment
      setComments(prev => prev.filter(comment => comment.id !== updatedComment.id));
      if (post) {
        setPost(prev => prev ? {
          ...prev,
          commentCount: prev.commentCount - 1
        } : null);
      }
    } else {
      // Update: replace the comment while maintaining order
      setComments(prev => prev.map(comment =>
        comment.id === updatedComment.id ? updatedComment : comment
      ));
    }
  };

  // Handle post delete
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    if (!postId) return;

    try {
      setIsDeleting(true);
      await deletePost(postId);
      alert('게시글이 삭제되었습니다');
      navigate('/community');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '삭제 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error deleting post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
        <button
          onClick={() => navigate('/community')}
          className="mt-6 flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>목록으로 돌아가기</span>
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => navigate('/community')}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            커뮤니티로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-gray-600 mb-4">게시글을 찾을 수 없습니다</div>
          <button
            onClick={() => navigate('/community')}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-medium transition-colors"
          >
            커뮤니티로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isAuthor = currentUserId === post.authorId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="post-detail-container">
        {/* Back Button */}
        <button
          onClick={() => navigate('/community')}
          className="mb-6 flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>목록으로 돌아가기</span>
        </button>

        {/* Post Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Type Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
              {post.postType}
            </span>
          </div>

          {/* Title - View or Edit Mode */}
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              style={{
                width: '100%',
                maxWidth: '100%',
                fontSize: '24px',
                fontWeight: 'bold',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              disabled={isUpdating}
            />
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>
          )}

          {/* Author & Meta */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4 flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              {post.author.profileImage && (
                <img
                  src={post.author.profileImage}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium text-gray-900">{post.author.name}</p>
                <p className="text-sm text-gray-500">
                  작성: {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <p className="text-sm text-gray-400">
                    수정됨: {new Date(post.updatedAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>조회 {post.viewCount}</span>
            <span>댓글 {post.commentCount}</span>
            <span>좋아요 {post.likes}</span>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* Text Content - View or Edit Mode */}
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={12}
              style={{
                width: '100%',
                maxWidth: '100%',
                padding: '15px',
                marginBottom: '24px',
                fontSize: '16px',
                lineHeight: '1.6',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: '#ffffff'
              }}
              disabled={isUpdating}
            />
          ) : (
            <div className="mb-6 max-h-96 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words">
                {post.content}
              </div>
            </div>
          )}

          {/* Images */}
          {post.imageUrls.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {post.imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`이미지 ${index + 1}`}
                  className="w-full h-auto rounded-lg object-cover max-h-64"
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit/Delete Buttons (Author Only) */}
        {isAuthor && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex gap-3">
            {isEditing ? (
              // Save/Cancel buttons in edit mode
              <>
                <button
                  onClick={handleEditSave}
                  disabled={isUpdating}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isUpdating ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  취소
                </button>
              </>
            ) : (
              // Edit/Delete buttons in view mode
              <>
                <button
                  onClick={handleEditStart}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Like Button (Hidden in edit mode) */}
        {!isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <button
              onClick={handleLikeToggle}
              disabled={!isLoggedIn || isTogglingLike}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                post.likedByMe
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } ${(!isLoggedIn || isTogglingLike) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-xl">❤️</span>
              <span>
                {post.likedByMe ? '좋아요 취소' : '좋아요'}
              </span>
              <span className="text-sm">({post.likes})</span>
            </button>
            {!isLoggedIn && (
              <p className="text-sm text-gray-500 mt-2">좋아요 기능을 사용하려면 로그인이 필요합니다.</p>
            )}
          </div>
        )}

        {/* Comments Section (Hidden in edit mode) */}
        {!isEditing && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              댓글 {comments.length}개
            </h3>

            {/* Comment Form */}
            <CommentForm
              onSubmit={handleCommentSubmit}
              isLoggedIn={isLoggedIn}
            />

            {/* Comment List */}
            <CommentList
              comments={comments}
              currentUserId={currentUserId}
              onCommentUpdateLocal={handleCommentUpdateLocal}
            />
          </div>
        )}

        {/* Bottom Back Button */}
        <button
          onClick={() => navigate('/community')}
          className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 font-medium transition-colors mx-auto"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>목록으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};

export default PostDetailPage;
