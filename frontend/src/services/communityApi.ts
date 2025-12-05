import type { AxiosRequestConfig } from 'axios';

import api from './api';
import type { Post, Comment, CreatePostRequest, UpdatePostRequest } from '../types/community';

const COMMUNITY_BASE_URL = '/api/community';
const POSTS_ENDPOINT = `${COMMUNITY_BASE_URL}/posts`;
const COMMENTS_ENDPOINT = `${COMMUNITY_BASE_URL}/comments`;
const ANONYMOUS_ID_KEY = 'careguide_anonymous_id';
const SECURE_TOKEN_STORAGE_KEY = 'app.security.token';
const LEGACY_TOKEN_KEY = 'careguide_token';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

type FetchPostsResponse = {
  posts?: Post[];
  total?: number;
  count?: number;
  totalCount?: number;
};

type PostDetailResponsePayload = Post | { post?: Post; comments?: Comment[] };

type LikeResponsePayload = {
  likeCount?: number;
  likes?: number;
  liked?: boolean;
};

type CommentCreatePayload = {
  postId: string;
  content: string;
  isAnonymous?: boolean;
  anonymousId?: string;
};

const isBrowser = typeof window !== 'undefined';

function getLocalStorage(): Storage | null {
  if (!isBrowser) {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function generateAnonymousToken(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoObj?.randomUUID) {
    return `anon_${cryptoObj.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }

  if (cryptoObj?.getRandomValues) {
    const buffer = new Uint8Array(8);
    cryptoObj.getRandomValues(buffer);
    return `anon_${Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  }

  return `anon_${Math.random().toString(36).slice(2, 12)}`;
}

export function getAnonymousId(): string {
  const storage = getLocalStorage();
  if (!storage) {
    return generateAnonymousToken();
  }

  const existing = storage.getItem(ANONYMOUS_ID_KEY);
  if (existing) {
    return existing;
  }

  const anonymousId = generateAnonymousToken();

  try {
    storage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  } catch (error) {
    console.warn('[communityApi] Failed to persist anonymous ID', error);
  }

  return anonymousId;
}

function parseSecureToken(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as { token?: string; expiresAt?: number };
    if (!parsed.token) {
      return null;
    }

    if (typeof parsed.expiresAt === 'number' && parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed.token;
  } catch {
    return null;
  }
}

function hasAuthToken(): boolean {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  const securePayload = storage.getItem(SECURE_TOKEN_STORAGE_KEY);
  if (securePayload && parseSecureToken(securePayload)) {
    return true;
  }

  const legacyToken = storage.getItem(LEGACY_TOKEN_KEY);
  return Boolean(legacyToken);
}

function withAnonymousHeader<T>(config?: AxiosRequestConfig<T>): AxiosRequestConfig<T> {
  if (hasAuthToken()) {
    return config ?? {};
  }

  const anonymousId = getAnonymousId();

  return {
    ...(config ?? {}),
    headers: {
      ...(config?.headers ?? {}),
      anonymous_id: anonymousId,
    },
  };
}

function extractPost(payload: unknown): Post {
  if (payload && typeof payload === 'object') {
    const withPost = payload as PostDetailResponsePayload;
    if ('post' in withPost && withPost.post) {
      return withPost.post as Post;
    }

    if ('id' in (payload as Record<string, unknown>)) {
      return payload as Post;
    }
  }

  throw new Error('게시글 정보를 불러오지 못했습니다.');
}

function extractComments(payload: unknown): Comment[] {
  if (Array.isArray(payload)) {
    return payload as Comment[];
  }

  if (payload && typeof payload === 'object') {
    const withComments = payload as { comments?: Comment[] };
    if (Array.isArray(withComments.comments)) {
      return withComments.comments;
    }
  }

  return [];
}

function resolveLikeCount(payload?: LikeResponsePayload): number {
  if (!payload) {
    return 0;
  }

  if (typeof payload.likeCount === 'number') {
    return payload.likeCount;
  }

  if (typeof payload.likes === 'number') {
    return payload.likes;
  }

  return 0;
}

export async function fetchPosts(
  category?: string,
  page: number = DEFAULT_PAGE,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ posts: Post[]; total: number }> {
  const params: Record<string, unknown> = {
    page,
    pageSize,
  };

  if (category) {
    params.category = category;
  }

  const config = withAnonymousHeader({ params });
  const { data } = await api.get<FetchPostsResponse>(POSTS_ENDPOINT, config);

  const posts = Array.isArray(data?.posts) ? data.posts : [];
  const total =
    typeof data?.total === 'number'
      ? data.total
      : typeof data?.count === 'number'
        ? data.count
        : typeof data?.totalCount === 'number'
          ? data.totalCount
          : posts.length;

  return { posts, total };
}

export async function fetchPost(postId: string): Promise<Post> {
  if (!postId) {
    throw new Error('게시글 ID를 입력해주세요.');
  }

  const config = withAnonymousHeader();
  const { data } = await api.get<PostDetailResponsePayload>(`${POSTS_ENDPOINT}/${postId}`, config);
  return extractPost(data);
}

export async function createPost(payload: CreatePostRequest): Promise<Post> {
  const config = withAnonymousHeader<CreatePostRequest>();
  const response = await api.post<Post>(POSTS_ENDPOINT, payload, config);
  return response.data;
}

export async function updatePost(postId: string, payload: UpdatePostRequest): Promise<Post> {
  const config = withAnonymousHeader<UpdatePostRequest>();
  const response = await api.put<Post>(`${POSTS_ENDPOINT}/${postId}`, payload, config);
  return response.data;
}

export async function deletePost(postId: string): Promise<void> {
  const config = withAnonymousHeader();
  await api.delete(`${POSTS_ENDPOINT}/${postId}`, config);
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const config = withAnonymousHeader();
  const { data } = await api.get<PostDetailResponsePayload | Comment[]>(`${POSTS_ENDPOINT}/${postId}`, config);
  return extractComments(data);
}

export async function createComment(
  postId: string,
  content: string,
  isAnonymous: boolean = false
): Promise<Comment> {
  const payload: CommentCreatePayload = {
    postId,
    content,
    isAnonymous,
  };

  if (!hasAuthToken()) {
    payload.anonymousId = getAnonymousId();
  }

  const config = withAnonymousHeader<CommentCreatePayload>();
  const response = await api.post<Comment>(COMMENTS_ENDPOINT, payload, config);
  return response.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const config = withAnonymousHeader();
  await api.delete(`${COMMENTS_ENDPOINT}/${commentId}`, config);
}

export async function likePost(postId: string): Promise<{ likeCount: number; liked: boolean }> {
  const config = withAnonymousHeader();
  const { data } = await api.post<LikeResponsePayload>(`${POSTS_ENDPOINT}/${postId}/like`, {}, config);
  return {
    likeCount: resolveLikeCount(data),
    liked: data?.liked ?? true,
  };
}

export async function unlikePost(postId: string): Promise<{ likeCount: number; liked: boolean }> {
  const config = withAnonymousHeader();
  const { data } = await api.delete<LikeResponsePayload>(`${POSTS_ENDPOINT}/${postId}/like`, config);
  return {
    likeCount: resolveLikeCount(data),
    liked: data?.liked ?? false,
  };
}
