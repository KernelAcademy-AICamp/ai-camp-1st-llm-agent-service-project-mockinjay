/**
 * FeaturedCard Component
 * 인기 게시글 카드 컴포넌트
 */
import React from 'react';
import { FileText } from 'lucide-react';
import type { PostCard } from '../../types/community';

interface FeaturedCardProps {
  post: PostCard;
  onClick?: (postId: string) => void;
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({ post, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(post.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl
        dark:shadow-gray-900/30 dark:hover:shadow-gray-900/50
        transition-all duration-200 cursor-pointer overflow-hidden
        flex-1 min-w-[280px] max-w-[350px] border border-gray-200 dark:border-gray-700"
    >
      {/* Thumbnail Image */}
      <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-cyan-500 dark:from-blue-600 dark:to-cyan-700 relative overflow-hidden">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText size={64} className="text-white opacity-50" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{post.authorName}</p>
      </div>
    </div>
  );
};

export default FeaturedCard;
