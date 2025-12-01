import { useState } from 'react'
import { useSession } from '../context/SessionContext'

interface Post {
  id: string
  author: string
  title: string
  content: string
  date: string
  likes: number
  comments: number
  category: string
}

const samplePosts: Post[] = [
  {
    id: '1',
    author: '건강지킴이',
    title: '저염식 요리 꿀팁 공유합니다',
    content: '소금 대신 허브와 향신료를 활용하면 맛있게 요리할 수 있어요!',
    date: '2024-11-26',
    likes: 24,
    comments: 12,
    category: '식단관리',
  },
  {
    id: '2',
    author: '희망찬내일',
    title: '투석 받으면서도 건강하게 지내는 방법',
    content: '저도 처음엔 힘들었지만, 규칙적인 생활과 긍정적인 마인드가 중요해요.',
    date: '2024-11-25',
    likes: 45,
    comments: 23,
    category: '경험공유',
  },
]

export default function Community() {
  const { updateLastActivity } = useSession()
  const [posts] = useState<Post[]>(samplePosts)
  const [selectedCategory, setSelectedCategory] = useState<string>('전체')

  const categories = ['전체', '식단관리', '경험공유', '질문답변', '응원메시지']

  const handleActivity = () => {
    updateLastActivity()
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" onClick={handleActivity}>
      {/* 헤더 */}
      <header className="bg-white border-b border-[var(--color-line-medium)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            커뮤니티
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            CKD 환자들과 경험과 정보를 나눠요
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 카테고리 필터 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'agent-selector-selected'
                  : 'agent-selector-unselected'
              }
            >
              {category}
            </button>
          ))}
        </div>

        {/* 글쓰기 버튼 */}
        <div className="mb-6">
          <button className="btn-primary w-full md:w-auto">
            + 새 글 작성
          </button>
        </div>

        {/* 게시글 리스트 */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="category-tag">{post.category}</span>
                  <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                    {post.author}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {post.date}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {post.title}
              </h3>

              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                {post.content}
              </p>

              <div className="flex gap-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>👍 {post.likes}</span>
                <span>💬 {post.comments}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 인기 게시글 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">이번 주 인기 글</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
              <span className="category-tag mb-2 inline-block">경험공유</span>
              <h3 className="font-semibold mb-2">CKD 진단 후 5년, 이렇게 지내고 있어요</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                꾸준한 관리와 긍정적인 마인드로...
              </p>
              <div className="mt-3 flex gap-3 text-xs text-[var(--color-text-tertiary)]">
                <span>👍 128</span>
                <span>💬 45</span>
              </div>
            </div>
            <div className="card bg-gradient-to-r from-green-50 to-blue-50">
              <span className="category-tag mb-2 inline-block">식단관리</span>
              <h3 className="font-semibold mb-2">저단백 고칼로리 간식 레시피 모음</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                맛있고 건강한 간식을 만들어보세요
              </p>
              <div className="mt-3 flex gap-3 text-xs text-[var(--color-text-tertiary)]">
                <span>👍 95</span>
                <span>💬 32</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
