import React, { useState } from 'react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isLoggedIn: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ onSubmit, isLoggedIn }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(content);
      setContent(''); // Clear form after successful submission
    } catch (err) {
      // Error is handled by parent component
      console.error('Comment submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 text-center">
        <p className="text-gray-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
        <a
          href="/login"
          className="inline-block bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          로그인하기
        </a>
      </div>
    );
  }

  return (
    <form className="mb-6" onSubmit={handleSubmit}>
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          rows={3}
          disabled={submitting}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {submitting ? '작성 중...' : '댓글 작성'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
