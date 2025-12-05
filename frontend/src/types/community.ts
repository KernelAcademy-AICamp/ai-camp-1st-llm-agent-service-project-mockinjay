export type PostCategory = 'general' | 'question' | 'information' | 'support';

export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    isAnonymous: boolean;
    anonymousNumber: number;
    category: PostCategory;
    tags: string[];
    likeCount: number;
    commentCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    postId: string;
    content: string;
    authorId: string;
    authorName: string;
    isAnonymous: boolean;
    anonymousNumber: number;
    createdAt: string;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    category: PostCategory;
    tags: string[];
    isAnonymous?: boolean;
    anonymousNumber?: number;
}

export interface UpdatePostRequest {
    title?: string;
    content?: string;
    category?: PostCategory;
    tags?: string[];
    isAnonymous?: boolean;
    anonymousNumber?: number;
}
