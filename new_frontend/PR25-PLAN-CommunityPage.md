# PR25-PLAN-CommunityPage

## CommunityPage 이식 상세 계획서

**Source**: `frontend/src/pages/CommunityPage.tsx` (317 lines)
**Target**: `new_frontend/src/pages/CommunityPageEnhanced.tsx` (636 lines)

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| Knowledge Badge | ✅ "환우 \| 레벨 3" (164-173) | ❌ 없음 | **P0 필수** |
| 2-Column Grid | ✅ 데스크탑 2열 (144-285) | ❌ 단일열 | **P0 필수** |
| Inline Edit/Delete | ✅ 헤더에 버튼 (179-216) | ✅ 있음 (다른 위치) | 스타일 조정 |
| Unified Category Color | ✅ 틸 색상 (313-316) | ❌ 파란색 사용 | **P1 권장** |
| Relative Time | ✅ "방금 전" 포맷 (302-311) | ✅ formatDate 사용 | 형식 통일 |
| Mock User Data | ✅ 하드코딩 | ✅ API 연동 | 유지 |
| Infinite Scroll | ❌ 없음 | ✅ 있음 | 유지 |
| Featured Posts | ❌ 없음 | ✅ 있음 | 유지 |
| Create Post Modal | ❌ navigate 방식 | ✅ 모달 방식 | 유지 |

---

## 2. 이식할 코드 스니펫

### P0-1: Knowledge Badge 컴포넌트

**Source Location**: `frontend/src/pages/CommunityPage.tsx:164-173`

```tsx
// 지식 레벨 배지 (환우 | 레벨 3)
<span
  className="text-xs px-2 py-1 rounded"
  style={{
    background: '#F3F4F6',
    color: '#6B7280',
    fontSize: '11px'
  }}
>
  {post.authorType} | 레벨 {post.knowledgeLevel}
</span>
```

**데이터 모델 확장**:
```typescript
interface Post {
  // 기존 필드...
  authorType: '일반인' | '환우' | '연구자';  // 추가 필요
  knowledgeLevel: number;  // 추가 필요
}
```

---

### P0-2: 2-Column Grid 레이아웃

**Source Location**: `frontend/src/pages/CommunityPage.tsx:144`

```tsx
// 데스크탑에서 2열 그리드 (모바일 1열)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {filteredPosts.map((post) => (
    <article
      key={post.id}
      onClick={() => navigate(`/community/detail/${post.id}`)}
      className="card hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* ... */}
    </article>
  ))}
</div>
```

**vs new_frontend**:
```tsx
// 현재 단일열
<div className="space-y-4">
  {posts.map((post) => (
    <PostCard ... />
  ))}
</div>
```

**수정 방안**: `space-y-4` → `grid grid-cols-1 lg:grid-cols-2 gap-4`

---

### P1-1: Inline Edit/Delete 버튼 (헤더 내)

**Source Location**: `frontend/src/pages/CommunityPage.tsx:179-216`

```tsx
// 게시글 헤더에 수정/삭제 버튼 (작성자만 표시)
{(userType === 'user' && post.authorId === currentUserId) && (
  <div className="flex items-center gap-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleEdit(post.id);
      }}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="수정"
    >
      <Edit2 size={16} color="#6B7280" />
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDelete(post.id);
      }}
      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
      title="삭제"
    >
      <Trash2 size={16} color="#EF4444" />
    </button>
  </div>
)}

{/* Admin은 삭제만 가능 */}
{userType === 'admin' && (
  <div className="flex items-center gap-2">
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDelete(post.id);
      }}
      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
      title="삭제"
    >
      <Trash2 size={16} color="#EF4444" />
    </button>
  </div>
)}
```

---

### P1-2: Unified Category Color

**Source Location**: `frontend/src/pages/CommunityPage.tsx:313-316`

```tsx
// 모든 카테고리 동일 틸 색상
function getCategoryColor(category: Post['category']) {
  // 모든 카테고리 태그는 동일한 Category Tag 스타일 적용
  return { bg: '#F2FFFD', text: '#00C8B4' };
}
```

**적용 위치**:
```tsx
<span
  className="text-xs px-3 py-1 rounded-full font-medium"
  style={{
    background: getCategoryColor(post.category).bg,
    color: getCategoryColor(post.category).text
  }}
>
  {post.category}
</span>
```

---

### P2-1: Relative Time 포맷

**Source Location**: `frontend/src/pages/CommunityPage.tsx:302-311`

```tsx
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}일 전`;

  return date.toLocaleDateString('ko-KR');
}
```

**vs new_frontend formatDate**:
```tsx
// 절대 시간 표시 (한국 시간대)
const formatDate = (dateString: string) => {
  const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  const date = new Date(utcDateString);
  return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  });
};
```

**권장**: 리스트에서는 `getTimeAgo`, 상세에서는 `formatDate` 사용

---

## 3. Post 타입 확장

**Source Location**: `frontend/src/pages/CommunityPage.tsx:6-20`

```typescript
interface Post {
  id: string;
  category: '자유' | '챌린지' | '설문조사' | '질문' | '정보';
  author: string;
  authorId: string;
  authorType: '일반인' | '환우' | '연구자';  // 추가 필요
  knowledgeLevel: number;  // 추가 필요
  title: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
}
```

**new_frontend PostCard 타입 확장 필요**:
```typescript
// new_frontend/src/types/community.ts
export interface PostCard {
  // 기존 필드...
  authorType?: '일반인' | '환우' | '연구자';
  knowledgeLevel?: number;
}
```

---

## 4. 구현 계획

### Phase 1: Knowledge Badge

1. `PostCard` 타입에 `authorType`, `knowledgeLevel` 추가
2. `PostCard.tsx` 컴포넌트에 배지 UI 추가
3. Backend API에서 해당 필드 반환 확인

### Phase 2: 2-Column Grid

1. `CommunityListView`의 posts 컨테이너 수정
2. `grid grid-cols-1 lg:grid-cols-2 gap-4` 적용
3. `PostCard` 컴포넌트 높이 일관성 확인

### Phase 3: Category Color 통일

1. `getCategoryColor` 유틸 함수 생성
2. `PostCard.tsx`에서 카테고리 배지 스타일 적용

### Phase 4: Relative Time

1. `getTimeAgo` 유틸 함수 생성
2. 리스트 뷰에서 사용, 상세에서는 기존 formatDate 유지

---

## 5. UX 개선 포인트

| 개선 영역 | 설명 |
|-----------|------|
| **Information Density** | 2열 그리드로 한 화면에 더 많은 콘텐츠 표시 |
| **Gamification** | 지식 레벨 배지로 사용자 신뢰도/참여도 향상 |
| **Quick Actions** | 인라인 수정/삭제로 클릭 수 감소 |
| **Visual Consistency** | 통일된 카테고리 색상으로 시각적 일관성 |

---

## 6. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| Knowledge Badge 배경 | `#F3F4F6` |
| Knowledge Badge 텍스트 | `#6B7280`, `11px` |
| Category Tag 배경 | `#F2FFFD` |
| Category Tag 텍스트 | `#00C8B4` |
| Edit 버튼 hover | `hover:bg-gray-100` |
| Delete 버튼 hover | `hover:bg-red-50` |

---

*Generated: 2025-11-27*
