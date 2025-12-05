/**
 * Community API Service
 * 커뮤니티 게시글 관련 API
 */

import api from './api';
import { getAnonymousId } from '../utils/storage';
import type {
  Post,
  PostCard,
  PostListResponse,
  FeaturedPostsResponse,
  PostDetail,
  PostDetailResponse,
  PostCreateRequest,
  PostUpdateRequest,
  Comment,
  CommentCreateRequest,
  CommentUpdateRequest,
  UploadImageResponse,
  PostType,
} from '../types/community';

const COMMUNITY_BASE = '/api/community';

// ==================== Posts API ====================

/**
 * Fetch posts with infinite scroll (cursor-based pagination)
 */
export const fetchPosts = async (params: {
  limit?: number;
  cursor?: string | null;
  postType?: PostType;
  sortBy?: 'createdAt' | 'likes' | 'lastActivityAt';
}): Promise<PostListResponse> => {
  const { data } = await api.get<PostListResponse>(`${COMMUNITY_BASE}/posts`, { params });
  return data;
};

/**
 * Fetch top 3 featured posts
 */
export const fetchFeaturedPosts = async (): Promise<PostCard[]> => {
  const { data } = await api.get<FeaturedPostsResponse>(`${COMMUNITY_BASE}/posts/featured`);
  return data.featuredPosts;
};

/**
 * Fetch single post by ID
 */
export const fetchPostById = async (postId: string): Promise<Post> => {
  const { data } = await api.get<Post>(`${COMMUNITY_BASE}/posts/${postId}`);
  return data;
};

/**
 * Fetch post detail page with comments
 */
export const fetchPostDetailPage = async (postId: string): Promise<PostDetailResponse> => {
  const { data } = await api.get<PostDetailResponse>(`${COMMUNITY_BASE}/posts/${postId}`);
  return data;
};

/**
 * Create new post
 */
export const createPost = async (postData: PostCreateRequest): Promise<Post> => {
  const { data } = await api.post<Post>(`${COMMUNITY_BASE}/posts`, postData);
  return data;
};

/**
 * Update post
 */
export const updatePost = async (postId: string, postData: PostUpdateRequest): Promise<Post> => {
  const { data } = await api.put<Post>(`${COMMUNITY_BASE}/posts/${postId}`, postData);
  return data;
};

/**
 * Delete post (hard delete)
 * Only the post author can delete their post.
 */
export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`${COMMUNITY_BASE}/posts/${postId}`, {
    params: { anonymousId: getAnonymousId() }
  });
};

/**
 * Toggle like on a post
 */
export const toggleLike = async (postId: string, isLiked: boolean): Promise<void> => {
  if (isLiked) {
    await api.delete(`${COMMUNITY_BASE}/posts/${postId}/like`);
  } else {
    await api.post(`${COMMUNITY_BASE}/posts/${postId}/like`, {});
  }
};

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<void> => {
  await api.post(`${COMMUNITY_BASE}/posts/${postId}/like`);
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(`${COMMUNITY_BASE}/posts/${postId}/like`);
};

// ==================== Comments API ====================

/**
 * Create comment
 */
export const createComment = async (commentData: CommentCreateRequest): Promise<Comment> => {
  const { data } = await api.post<Comment>(`${COMMUNITY_BASE}/comments`, commentData);
  return data;
};

/**
 * Update comment
 */
export const updateComment = async (
  commentId: string,
  commentData: CommentUpdateRequest
): Promise<Comment> => {
  const { data } = await api.put<Comment>(`${COMMUNITY_BASE}/comments/${commentId}`, commentData);
  return data;
};

/**
 * Delete comment
 * Comment author OR post author can delete the comment.
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`${COMMUNITY_BASE}/comments/${commentId}`, {
    params: { anonymousId: getAnonymousId() }
  });
};

// ==================== Image Upload API ====================

/**
 * Upload image
 */
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  // Use axios without Content-Type header (let browser set it automatically)
  const { data } = await api.post<UploadImageResponse>(`${COMMUNITY_BASE}/uploads`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

// ==================== Auth API (Dev only) ====================

/**
 * Dev login for testing
 */
export const devLogin = async (): Promise<{
  token: string;
  userId: string;
  user: { name: string };
}> => {
  const { data } = await api.post('/api/auth/dev-login');
  return data;
};

// ==================== Legacy API Functions (for backward compatibility) ====================

/**
 * @deprecated Use fetchPosts instead
 */
export const getPosts = async (
  limit = 20,
  cursor?: string,
  postType?: PostType,
  sortBy: 'createdAt' | 'likes' | 'lastActivityAt' = 'lastActivityAt'
): Promise<PostListResponse> => {
  return fetchPosts({ limit, cursor, postType, sortBy });
};

/**
 * @deprecated Use fetchPostById instead
 */
export const getPostDetail = async (postId: string): Promise<Post> => {
  return fetchPostById(postId);
};

// Re-export types for convenience
export type { Post, PostCard, PostDetail, Comment, PostType };
