import axios from 'axios';
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
} from '../types/community.ts';

// Axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api/community',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  const { data } = await api.get<PostListResponse>('/posts', { params });
  return data;
};

/**
 * Fetch top 3 featured posts
 */
export const fetchFeaturedPosts = async (): Promise<PostCard[]> => {
  const { data } = await api.get<FeaturedPostsResponse>('/posts/featured');
  return data.featuredPosts;
};

/**
 * Fetch single post by ID (list view)
 */
export const fetchPostDetail = async (postId: string): Promise<Post> => {
  const { data } = await api.get<Post>(`/posts/${postId}`);
  return data;
};

/**
 * Fetch post detail page with comments (COM-007)
 * Increments viewCount on each fetch
 */
export const fetchPostDetailPage = async (postId: string): Promise<PostDetailResponse> => {
  const { data } = await api.get<PostDetailResponse>(`/posts/${postId}`);
  return data;
};

/**
 * Create new post
 */
export const createPost = async (postData: PostCreateRequest): Promise<Post> => {
  const { data } = await api.post<Post>('/posts', postData);
  return data;
};

/**
 * Update post
 */
export const updatePost = async (
  postId: string,
  postData: PostUpdateRequest
): Promise<Post> => {
  const { data } = await api.put<Post>(`/posts/${postId}`, postData);
  return data;
};

/**
 * Delete post (soft delete)
 */
export const deletePost = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}`);
};

/**
 * Toggle like on a post
 * First call: likes post
 * Second call: unlikes post
 */
export const toggleLike = async (postId: string, isLiked: boolean): Promise<void> => {
  if (isLiked) {
    // Unlike
    await api.delete(`/posts/${postId}/like`);
  } else {
    // Like
    await api.post(`/posts/${postId}/like`, {});
  }
};

// ==================== Comments API ====================

/**
 * Create comment
 */
export const createComment = async (
  commentData: CommentCreateRequest
): Promise<Comment> => {
  const { data } = await api.post<Comment>('/comments', commentData);
  return data;
};

/**
 * Update comment
 */
export const updateComment = async (
  commentId: string,
  commentData: CommentUpdateRequest
): Promise<Comment> => {
  const { data } = await api.put<Comment>(`/comments/${commentId}`, commentData);
  return data;
};

/**
 * Delete comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  await api.delete(`/comments/${commentId}`);
};

// ==================== Likes API ====================

/**
 * Like a post
 */
export const likePost = async (postId: string): Promise<void> => {
  await api.post(`/posts/${postId}/like`);
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string): Promise<void> => {
  await api.delete(`/posts/${postId}/like`);
};

// ==================== Image Upload API ====================

/**
 * Upload image
 */
export const uploadImage = async (file: File): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadImageResponse>('/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
