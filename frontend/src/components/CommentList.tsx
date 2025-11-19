import React, { useState } from 'react';
import type { Comment } from '../types/community.ts';
import { deleteComment, updateComment } from '../api/community.ts';

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  onCommentUpdate?: () => void;
  onCommentUpdateLocal?: (updatedComment: Comment) => void;
}

interface EditingState {
  commentId: string | null;
  content: string;
}

// Safe date formatting utility
const formatCommentDate = (dateString: string | undefined): string => {
  if (!dateString) return '날짜 정보 없음';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '날짜 정보 없음';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '날짜 정보 없음';
  }
};

const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  onCommentUpdate,
  onCommentUpdateLocal
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState>({
    commentId: null,
    content: '',
  });
  const [updating, setUpdating] = useState(false);

  // Handle edit start
  const handleEditStart = (comment: Comment) => {
    setEditingState({
      commentId: comment.id,
      content: comment.content,
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingState({
      commentId: null,
      content: '',
    });
  };

  // Handle edit save
  const handleEditSave = async (commentId: string) => {
    if (!editingState.content.trim()) {
      alert('댓글 내용을 입력해주세요');
      return;
    }

    try {
      setUpdating(true);
      const updatedComment = await updateComment(commentId, {
        content: editingState.content,
      });

      // Use local update callback to maintain comment order
      if (onCommentUpdateLocal) {
        onCommentUpdateLocal(updatedComment);
      }

      setEditingState({
        commentId: null,
        content: '',
      });
      alert('댓글이 수정되었습니다');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '댓글 수정 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error updating comment:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      setDeletingId(commentId);
      await deleteComment(commentId);

      // Use local update to maintain order by filtering out deleted comment
      if (onCommentUpdateLocal) {
        // Send a special marker to indicate deletion
        onCommentUpdateLocal({ id: commentId } as Comment);
      }

      alert('댓글이 삭제되었습니다');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || '댓글 삭제 중 오류가 발생했습니다';
      alert(errorMsg);
      console.error('Error deleting comment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>첫 댓글을 작성해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => {
        const isAuthor = currentUserId === comment.authorId;
        const isEditing = editingState.commentId === comment.id;

        return (
          <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
            {/* Comment Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                {comment.author.profileImage && (
                  <img
                    src={comment.author.profileImage}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{comment.author.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCommentDate(comment.createdAt)}
                  </p>
                </div>
              </div>

              {/* Action Buttons - Only for author */}
              {isAuthor && (
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    // Save/Cancel buttons in edit mode
                    <>
                      <button
                        onClick={() => handleEditSave(comment.id)}
                        disabled={updating}
                        className="text-teal-500 hover:text-teal-700 text-xs font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        {updating ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={updating}
                        className="text-gray-500 hover:text-gray-700 text-xs font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    // Edit/Delete buttons in view mode
                    <>
                      <button
                        onClick={() => handleEditStart(comment)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        {deletingId === comment.id ? '삭제 중...' : '삭제'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Comment Content - View or Edit Mode */}
            {isEditing ? (
              // Edit mode
              <div className="ml-11">
                <textarea
                  value={editingState.content}
                  onChange={(e) =>
                    setEditingState({
                      ...editingState,
                      content: e.target.value,
                    })
                  }
                  disabled={updating}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  aria-label="댓글 내용 수정"
                />
              </div>
            ) : (
              // View mode
              <p className="text-gray-700 whitespace-pre-wrap ml-11">
                {comment.content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CommentList;
