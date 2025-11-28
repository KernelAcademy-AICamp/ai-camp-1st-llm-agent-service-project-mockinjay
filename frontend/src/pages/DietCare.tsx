import { useState } from 'react'
import { useSession } from '../context/SessionContext'

interface MealLog {
  id: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foods: string[]
  calories?: number
  protein?: number
  sodium?: number
}

export default function DietCare() {
  const { updateLastActivity } = useSession()
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [showAddMeal, setShowAddMeal] = useState(false)

  const handleActivity = () => {
    updateLastActivity()
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" onClick={handleActivity}>
      {/* 헤더 */}
      <header className="bg-white border-b border-[var(--color-line-medium)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            식단 관리
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            오늘의 식단을 기록하고 영양 정보를 확인하세요
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 오늘의 영양 요약 */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">오늘의 영양 섭취</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[var(--color-input-bar)] rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)]">칼로리</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">1,450</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">/ 2,000 kcal</p>
            </div>
            <div className="text-center p-4 bg-[var(--color-input-bar)] rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)]">단백질</p>
              <p className="text-2xl font-bold text-[var(--color-primary)]">65g</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">/ 80g</p>
            </div>
            <div className="text-center p-4 bg-[var(--color-input-bar)] rounded-lg">
              <p className="text-sm text-[var(--color-text-secondary)]">나트륨</p>
              <p className="text-2xl font-bold text-[var(--color-warning)]">1,800mg</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">/ 2,000mg</p>
            </div>
          </div>
        </div>

        {/* 식사 기록 추가 버튼 */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddMeal(!showAddMeal)}
            className="btn-primary w-full md:w-auto"
          >
            + 식사 기록 추가
          </button>
        </div>

        {/* 식사 기록 리스트 */}
        <div className="space-y-4">
          {mealLogs.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-[var(--color-text-secondary)]">
                아직 기록된 식사가 없습니다
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                오늘의 식사를 기록해보세요
              </p>
            </div>
          ) : (
            mealLogs.map((meal) => (
              <div key={meal.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="category-tag">{meal.mealType}</span>
                    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                      {meal.date}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {meal.foods.map((food, idx) => (
                        <li key={idx} className="text-[var(--color-text-primary)]">
                          • {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right text-sm">
                    {meal.calories && <p>{meal.calories} kcal</p>}
                    {meal.protein && <p className="text-[var(--color-text-secondary)]">
                      단백질: {meal.protein}g
                    </p>}
                    {meal.sodium && <p className="text-[var(--color-text-secondary)]">
                      나트륨: {meal.sodium}mg
                    </p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 추천 식단 섹션 */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">CKD 환자를 위한 추천 식단</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-2">저염식 레시피</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                나트륨 섭취를 줄이는 건강한 식단
              </p>
              <button className="btn-secondary mt-4 text-sm">
                자세히 보기
              </button>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-2">저단백 식단</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                신장 건강을 위한 적정 단백질 관리
              </p>
              <button className="btn-secondary mt-4 text-sm">
                자세히 보기
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
