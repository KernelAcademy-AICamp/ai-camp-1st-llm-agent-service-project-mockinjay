import { useState } from 'react'
import { useSession } from '../context/SessionContext'

export default function Trends() {
  const { updateLastActivity } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week')

  const handleActivity = () => {
    updateLastActivity()
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" onClick={handleActivity}>
      {/* 헤더 */}
      <header className="bg-white border-b border-[var(--color-line-medium)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            건강 트렌드
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            나의 건강 데이터를 분석하고 추이를 확인하세요
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 기간 선택 */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={selectedPeriod === 'week' ? 'tab-selected' : 'tab-unselected'}
          >
            주간
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={selectedPeriod === 'month' ? 'tab-selected' : 'tab-unselected'}
          >
            월간
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={selectedPeriod === 'year' ? 'tab-selected' : 'tab-unselected'}
          >
            연간
          </button>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">평균 혈압</p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">120/80</p>
            <p className="text-xs text-green-600 mt-1">↓ 정상 범위</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">평균 체중</p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">68.5kg</p>
            <p className="text-xs text-blue-600 mt-1">→ 유지 중</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">일일 수분</p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">1.5L</p>
            <p className="text-xs text-green-600 mt-1">↓ 적정</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">식단 준수율</p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">85%</p>
            <p className="text-xs text-green-600 mt-1">↑ 개선됨</p>
          </div>
        </div>

        {/* 차트 영역 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">혈압 추이</h2>
          <div className="h-64 flex items-center justify-center bg-[var(--color-surface)] rounded">
            <p className="text-[var(--color-text-secondary)]">
              차트 데이터 시각화 영역
              <br />
              <span className="text-sm">(Chart.js 또는 Recharts 라이브러리 사용 권장)</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 체중 추이 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">체중 추이</h2>
            <div className="h-48 flex items-center justify-center bg-[var(--color-surface)] rounded">
              <p className="text-[var(--color-text-secondary)] text-sm">체중 차트</p>
            </div>
          </div>

          {/* 영양 섭취 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">영양 섭취 분석</h2>
            <div className="h-48 flex items-center justify-center bg-[var(--color-surface)] rounded">
              <p className="text-[var(--color-text-secondary)] text-sm">영양소 차트</p>
            </div>
          </div>
        </div>

        {/* 주간 요약 */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold mb-4">이번 주 건강 요약</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium">식단 관리 우수</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  저염식 준수율 90%, 계속 유지하세요!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium">수분 섭취 주의</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  권장량보다 200ml 초과, 조절이 필요합니다
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium">운동량 증가</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  지난 주 대비 30% 증가, 잘하고 계십니다!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
