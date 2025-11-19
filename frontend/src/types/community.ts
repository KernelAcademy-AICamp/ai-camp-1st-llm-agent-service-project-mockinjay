// Post type enum
export type PostType = "BOARD" | "CHALLENGE" | "SURVEY";

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

  createdAt: string;  // ISO string from backend
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
  userId: string;  // Added for edit/delete permission check
  title: string;
  authorName: string;
  postType: PostType;
  thumbnailUrl?: string;
  createdAt: string;
  lastActivityAt: string;
  likes: number;
  commentCount: number;
  previewText: string;  // First 100 chars of content
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
 * Post detail model (for detail page view - COM-007)
 */
export interface PostDetail {
  id: string;
  title: string;
  content: string;
  author: Author;
  authorId: string;  // For checking if current user is author
  postType: PostType;
  imageUrls: string[];
  viewCount: number;
  likes: number;
  likedByMe: boolean;  // True if logged-in user liked, false otherwise
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
  authorId: string;  // For checking if current user is author
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
}

export interface PostUpdateRequest {
  title?: string;
  content?: string;
  imageUrls?: string[];
}

export interface CommentCreateRequest {
  postId: string;
  content: string;
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
