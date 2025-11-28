/**
 * Community Types
 * 커뮤니티 게시글 관련 타입 정의
 */

// Post type enum
export type PostType = 'BOARD' | 'CHALLENGE' | 'SURVEY';

/**
 * Full post model (matches backend Post model)
 */
export interface Post {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  postType: PostType;

  imageUrls: string[];
  thumbnailUrl?: string;

  likes: number;
  commentCount: number;

  createdAt: string; // ISO string from backend
  updatedAt: string;
  lastActivityAt: string;

  isPinned: boolean;
  isDeleted: boolean;
}

/**
 * Simplified post for list view
 */
export interface PostCard {
  id: string;
  userId: string; // Added for edit/delete permission check
  title: string;
  authorName: string;
  postType: PostType;
  thumbnailUrl?: string;
  createdAt: string;
  lastActivityAt: string;
  likes: number;
  commentCount: number;
  previewText: string; // First 100 chars of content
  authorType?: '일반인' | '환우' | '연구자'; // Author type
  knowledgeLevel?: number; // Knowledge level (1-5)
}

/**
 * Author information model
 */
export interface Author {
  id: string;
  name: string;
  profileImage?: string;
}

/**
 * Post detail model (for detail page view)
 */
export interface PostDetail {
  id: string;
  userId: string; // Original user ID from database
  title: string;
  content: string;
  author: Author;
  authorId: string; // For checking if current user is author
  postType: PostType;
  imageUrls: string[];
  viewCount: number;
  likes: number;
  likedByMe: boolean; // True if logged-in user liked, false otherwise
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  isDeleted: boolean;
}

/**
 * Comment model
 */
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  author: Author;
  authorId: string; // For checking if current user is author
  authorName?: string; // Fallback for author name
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

/**
 * API Request types
 */
export interface PostCreateRequest {
  title: string;
  content: string;
  postType: PostType;
  imageUrls: string[];
  isAnonymous?: boolean;
  anonymousId?: string;   // Client-side ID for consistent anonymous identification
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  imageUrls?: string[];
}

export interface CommentCreateRequest {
  postId: string;
  content: string;
  isAnonymous?: boolean;  // For logged-in users to choose anonymous posting
  anonymousId?: string;   // Client-side ID for consistent anonymous numbering
}

export interface CommentUpdateRequest {
  content: string;
}

/**
 * API Response types
 */
export interface PostListResponse {
  posts: PostCard[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeaturedPostsResponse {
  featuredPosts: PostCard[];
}

export interface PostDetailResponse {
  post: PostDetail;
  comments: Comment[];
}

export interface UploadImageResponse {
  url: string;
  filename: string;
}
