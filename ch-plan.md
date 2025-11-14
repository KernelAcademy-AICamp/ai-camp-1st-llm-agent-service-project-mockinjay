# ch 개발 계획 (Community)

> 커뮤니티 게시판 및 댓글 기능

## 담당 기능
- 게시글 작성/조회/수정/삭제
- 댓글 작성/삭제
- 좋아요 기능
- 게시글 검색

## 의존성
- **jk의 작업**: 인증 API, API Client, UserContext (Week 2 완료 후 시작)

## 개발 순서

### Week 3: 게시글 기능

#### 1. 데이터 모델 정의

**파일**: `backend/app/models/community.py`
```python
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class PostCreate(BaseModel):
    title: str
    content: str
    category: str  # "질문", "정보공유", "후기"

class PostResponse(BaseModel):
    postId: str  # MongoDB _id와 매핑
    userId: str
    user_name: str
    title: str
    content: str
    category: str
    likes: int
    comment_count: int
    created_at: datetime

class CommentCreate(BaseModel):
    postId: str
    content: str

class CommentResponse(BaseModel):
    commentId: str  # MongoDB _id와 매핑
    postId: str
    userId: str
    user_name: str
    content: str
    created_at: datetime
```

**체크리스트**:
- [ ] Post 모델
- [ ] Comment 모델
- [ ] 카테고리 정의

#### 2. MongoDB 스키마 설정

**파일**: `backend/app/db/connection.py` (추가)
```python
# jk가 만든 파일에 추가
posts_collection = db["posts"]
comments_collection = db["comments"]
likes_collection = db["likes"]
```

**체크리스트**:
- [ ] Collection 추가
- [ ] 인덱스 설정 (created_at, user_id)

#### 3. 게시글 API

**파일**: `backend/app/api/community.py`
```python
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.community import PostCreate, PostResponse, CommentCreate
from app.db.connection import posts_collection, comments_collection, likes_collection, users_collection
from app.services.auth import get_current_user
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/api/community", tags=["community"])

@router.post("/posts")
async def create_post(
    post: PostCreate,
    user_id: str = Depends(get_current_user)
):
    """게시글 작성"""
    # 사용자 정보 가져오기
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    post_doc = {
        "user_id": user_id,
        "user_name": user["name"],
        "title": post.title,
        "content": post.content,
        "category": post.category,
        "likes": 0,
        "views": 0,
        "created_at": datetime.utcnow()
    }
    result = posts_collection.insert_one(post_doc)
    
    return {
        "success": True,
        "id": str(result.inserted_id),
        "message": "게시글 작성 완료"
    }

@router.get("/posts")
async def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """게시글 목록 조회"""
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]
    
    # 총 개수
    total = posts_collection.count_documents(query)
    
    # 페이지네이션
    skip = (page - 1) * limit
    posts = list(posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
    
    # 각 게시글의 댓글 수 계산
    for post in posts:
        post["id"] = str(post.pop("_id"))
        post["comment_count"] = comments_collection.count_documents({"post_id": post["id"]})
    
    return {
        "success": True,
        "posts": posts,
        "total": total,
        "page": page,
        "total_pages": (total + limit - 1) // limit
    }

@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    """게시글 상세 조회"""
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    # 조회수 증가
    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$inc": {"views": 1}}
    )
    
    post["id"] = str(post.pop("_id"))
    post["comment_count"] = comments_collection.count_documents({"post_id": post_id})
    
    return {"success": True, "post": post}

@router.put("/posts/{post_id}")
async def update_post(
    post_id: str,
    title: str,
    content: str,
    user_id: str = Depends(get_current_user)
):
    """게시글 수정"""
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    if post["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다")
    
    posts_collection.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"title": title, "content": content}}
    )
    
    return {"success": True, "message": "수정 완료"}

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    """게시글 삭제"""
    post = posts_collection.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    if post["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")
    
    # 게시글 삭제
    posts_collection.delete_one({"_id": ObjectId(post_id)})
    
    # 관련 댓글 삭제
    comments_collection.delete_many({"post_id": post_id})
    
    # 관련 좋아요 삭제
    likes_collection.delete_many({"post_id": post_id})
    
    return {"success": True, "message": "삭제 완료"}
```

**main.py에 라우터 추가**:
```python
from app.api import community
app.include_router(community.router)
```

**체크리스트**:
- [ ] 게시글 작성 API
- [ ] 게시글 목록 API (페이지네이션)
- [ ] 게시글 상세 API
- [ ] 게시글 수정 API
- [ ] 게시글 삭제 API
- [ ] Postman으로 테스트

#### 4. 게시글 목록 UI

**파일**: `frontend/src/pages/Community.tsx`
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Header } from '@/components/Layout/Header';

interface Post {
  postId: string;
  title: string;
  content: string;
  category: string;
  user_name: string;
  likes: number;
  comment_count: number;
  views: number;
  created_at: string;
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, [page, category]);

  const loadPosts = async () => {
    try {
      const response = await apiClient.get('/api/community/posts', {
        params: { page, category: category || undefined, search: search || undefined }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.total_pages);
    } catch (error) {
      console.error('게시글 불러오기 실패', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPosts();
  };

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">커뮤니티</h1>
          <button
            onClick={() => navigate('/community/write')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            글쓰기
          </button>
        </div>

        {/* 카테고리 및 검색 */}
        <div className="flex gap-4 mb-6">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">전체</option>
            <option value="질문">질문</option>
            <option value="정보공유">정보공유</option>
            <option value="후기">후기</option>
          </select>
          
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="flex-1 p-2 border rounded"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              검색
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded shadow">
          {posts.length === 0 ? (
            <p className="p-8 text-center text-gray-500">게시글이 없습니다</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">카테고리</th>
                  <th className="p-4 text-left">제목</th>
                  <th className="p-4 text-left">작성자</th>
                  <th className="p-4 text-center">좋아요</th>
                  <th className="p-4 text-center">댓글</th>
                  <th className="p-4 text-center">조회</th>
                  <th className="p-4 text-left">작성일</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    onClick={() => navigate(`/community/${post.id}`)}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{post.title}</td>
                    <td className="p-4">{post.user_name}</td>
                    <td className="p-4 text-center">{post.likes}</td>
                    <td className="p-4 text-center">{post.comment_count}</td>
                    <td className="p-4 text-center">{post.views}</td>
                    <td className="p-4">{new Date(post.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 게시글 목록 테이블
- [ ] 카테고리 필터
- [ ] 검색 기능
- [ ] 페이지네이션
- [ ] 게시글 클릭 시 상세 페이지 이동

### Week 4: 게시글 작성/상세 및 댓글 기능

#### 5. 댓글 API

**파일**: `backend/app/api/community.py` (추가)
```python
@router.post("/comments")
async def create_comment(
    comment: CommentCreate,
    user_id: str = Depends(get_current_user)
):
    """댓글 작성"""
    # 게시글 존재 확인
    post = posts_collection.find_one({"_id": ObjectId(comment.post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다")
    
    # 사용자 정보
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    
    comment_doc = {
        "post_id": comment.post_id,
        "user_id": user_id,
        "user_name": user["name"],
        "content": comment.content,
        "created_at": datetime.utcnow()
    }
    result = comments_collection.insert_one(comment_doc)
    
    return {
        "success": True,
        "id": str(result.inserted_id),
        "message": "댓글 작성 완료"
    }

@router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    """게시글의 댓글 목록"""
    comments = list(comments_collection.find({"post_id": post_id}).sort("created_at", 1))
    
    for comment in comments:
        comment["id"] = str(comment.pop("_id"))
    
    return {"success": True, "comments": comments}

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    user_id: str = Depends(get_current_user)
):
    """댓글 삭제"""
    comment = comments_collection.find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다")
    
    if comment["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다")
    
    comments_collection.delete_one({"_id": ObjectId(comment_id)})
    
    return {"success": True, "message": "삭제 완료"}
```

**체크리스트**:
- [ ] 댓글 작성 API
- [ ] 댓글 목록 API
- [ ] 댓글 삭제 API

#### 6. 좋아요 API

**파일**: `backend/app/api/community.py` (추가)
```python
@router.post("/posts/{post_id}/like")
async def toggle_like(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    """좋아요 토글"""
    # 이미 좋아요했는지 확인
    existing_like = likes_collection.find_one({
        "post_id": post_id,
        "user_id": user_id
    })
    
    if existing_like:
        # 좋아요 취소
        likes_collection.delete_one({"_id": existing_like["_id"]})
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": -1}}
        )
        return {"success": True, "liked": False}
    else:
        # 좋아요 추가
        likes_collection.insert_one({
            "post_id": post_id,
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"likes": 1}}
        )
        return {"success": True, "liked": True}

@router.get("/posts/{post_id}/like/check")
async def check_like(
    post_id: str,
    user_id: str = Depends(get_current_user)
):
    """좋아요 여부 확인"""
    liked = likes_collection.find_one({
        "post_id": post_id,
        "user_id": user_id
    }) is not None
    
    return {"success": True, "liked": liked}
```

**체크리스트**:
- [ ] 좋아요 추가/취소 API
- [ ] 좋아요 여부 확인 API

#### 7. 게시글 작성 페이지

**파일**: `frontend/src/pages/CommunityWrite.tsx`
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Header } from '@/components/Layout/Header';

export default function CommunityWrite() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('질문');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/community/posts', {
        title,
        content,
        category
      });
      alert('게시글 작성 완료!');
      navigate('/community');
    } catch (error) {
      alert('작성 실패');
    }
  };

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto mt-10 p-6">
        <h1 className="text-3xl font-bold mb-6">글쓰기</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
          <div className="mb-4">
            <label className="block mb-2">카테고리</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="질문">질문</option>
              <option value="정보공유">정보공유</option>
              <option value="후기">후기</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded h-64"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              작성하기
            </button>
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 제목/내용 입력
- [ ] 카테고리 선택
- [ ] 작성 완료 후 목록으로 이동

#### 8. 게시글 상세 페이지

**파일**: `frontend/src/pages/CommunityDetail.tsx`
```typescript
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { UserContext } from '@/contexts/UserContext';
import { Header } from '@/components/Layout/Header';

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    checkLike();
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await apiClient.get(`/api/community/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      console.error('게시글 불러오기 실패', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await apiClient.get(`/api/community/posts/${id}/comments`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('댓글 불러오기 실패', error);
    }
  };

  const checkLike = async () => {
    try {
      const response = await apiClient.get(`/api/community/posts/${id}/like/check`);
      setLiked(response.data.liked);
    } catch (error) {
      console.error('좋아요 확인 실패', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await apiClient.post(`/api/community/posts/${id}/like`);
      setLiked(response.data.liked);
      loadPost(); // 좋아요 수 업데이트
    } catch (error) {
      alert('좋아요 실패');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/community/comments', {
        post_id: id,
        content: newComment
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      alert('댓글 작성 실패');
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/api/community/posts/${id}`);
      navigate('/community');
    } catch (error) {
      alert('삭제 실패');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/api/community/comments/${commentId}`);
      loadComments();
    } catch (error) {
      alert('삭제 실패');
    }
  };

  if (!post) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto mt-10 p-6">
        {/* 게시글 */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {post.category}
              </span>
              <h1 className="text-2xl font-bold mt-2">{post.title}</h1>
            </div>
            {user?.id === post.user_id && (
              <button
                onClick={handleDeletePost}
                className="text-red-500 hover:text-red-700"
              >
                삭제
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            {post.user_name} · {new Date(post.created_at).toLocaleString()} · 조회 {post.views}
          </div>
          
          <div className="mb-4 whitespace-pre-wrap">{post.content}</div>
          
          <button
            onClick={handleLike}
            className={`px-4 py-2 rounded ${
              liked ? 'bg-red-500 text-white' : 'bg-gray-200'
            }`}
          >
            ❤️ 좋아요 {post.likes}
          </button>
        </div>

        {/* 댓글 */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">댓글 {comments.length}</h2>
          
          {/* 댓글 작성 */}
          <form onSubmit={handleCommentSubmit} className="mb-6">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="w-full p-2 border rounded mb-2"
              rows={3}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              댓글 작성
            </button>
          </form>

          {/* 댓글 목록 */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{comment.user_name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  {user?.id === comment.user_id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="mt-2">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/community')}
          className="mt-6 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          목록으로
        </button>
      </div>
    </>
  );
}
```

**체크리스트**:
- [ ] 게시글 상세 표시
- [ ] 좋아요 기능
- [ ] 댓글 작성
- [ ] 댓글 목록
- [ ] 댓글 삭제
- [ ] 게시글 삭제 (작성자만)

## 완료 기준

### Backend
- [ ] 게시글 CRUD API 작동
- [ ] 댓글 작성/삭제 API 작동
- [ ] 좋아요 기능 API 작동
- [ ] 페이지네이션 작동
- [ ] 검색 기능 작동
- [ ] JWT 인증 적용

### Frontend
- [ ] 게시글 목록 페이지
- [ ] 게시글 작성 페이지
- [ ] 게시글 상세 페이지
- [ ] 댓글 기능
- [ ] 좋아요 기능
- [ ] 페이지네이션
- [ ] 검색 기능

### 통합
- [ ] jk의 인증 API와 연동
- [ ] Header 컴포넌트 사용
- [ ] API Client 사용
- [ ] UserContext 사용

## 추가 기능 (선택)
- 게시글 수정
- 대댓글 (댓글의 댓글)
- 이미지 업로드
- 인기 게시글
- 내가 쓴 글 보기
