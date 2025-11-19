import React from 'react';
import type { PostCard } from '../types/community.ts';

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
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex-1 min-w-[280px] max-w-[350px]"
    >
      {/* Thumbnail Image */}
      <div className="w-full h-48 bg-gradient-to-br from-teal-400 to-cyan-500 relative overflow-hidden">
        {post.thumbnailUrl ? (
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {post.title}
        </h3>
      </div>
    </div>
  );
};

export default FeaturedCard;
