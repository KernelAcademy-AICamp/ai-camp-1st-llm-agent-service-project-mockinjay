interface NutrientData {
  name: string
  value: number
  max: number
  unit: string
  status: 'safe' | 'warning' | 'danger'
}

interface Recipe {
  name: string
  description: string
  image?: string
  nutrients: {
    sodium: number
    potassium: number
    phosphorus: number
    protein: number
  }
}

interface NutritionAnalysisCardProps {
  data?: {
    dishName: string
    nutrients: NutrientData[]
    alternatives: Recipe[]
    guideline?: string
  }
}

function CircularGauge({ nutrient }: { nutrient: NutrientData }) {
  const percentage = Math.min((nutrient.value / nutrient.max) * 100, 100)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (nutrient.status === 'safe') return '#10b981'
    if (nutrient.status === 'warning') return '#f59e0b'
    return '#ef4444'
  }

  const getStatusText = () => {
    if (nutrient.status === 'safe') return '안전'
    if (nutrient.status === 'warning') return '주의'
    return '위험'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={getColor()}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-700">{nutrient.name}</p>
      <p className="text-xs text-gray-500">
        {nutrient.value}{nutrient.unit} / {nutrient.max}{nutrient.unit}
      </p>
      <span
        className={`mt-1 text-xs px-2 py-1 rounded-full ${
          nutrient.status === 'safe'
            ? 'bg-green-100 text-green-700'
            : nutrient.status === 'warning'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        {getStatusText()}
      </span>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      {recipe.image && (
        <div className="h-32 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
          <span className="text-4xl">🍽️</span>
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2">{recipe.name}</h4>
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{recipe.description}</p>
        <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
          <div className="flex justify-between">
            <span className="text-gray-600">나트륨:</span>
            <span className="font-medium text-emerald-700">{recipe.nutrients.sodium}mg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">칼륨:</span>
            <span className="font-medium text-emerald-700">{recipe.nutrients.potassium}mg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">인:</span>
            <span className="font-medium text-emerald-700">{recipe.nutrients.phosphorus}mg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">단백질:</span>
            <span className="font-medium text-emerald-700">{recipe.nutrients.protein}g</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NutritionAnalysisCard({ data }: NutritionAnalysisCardProps) {
  // data가 없으면 아무것도 표시하지 않음 (더미 데이터 완전 제거)
  if (!data) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-200 my-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">영양소 분석</h3>
        <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
          {data.dishName}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {data.nutrients.map((nutrient, idx) => (
          <CircularGauge key={idx} nutrient={nutrient} />
        ))}
      </div>

      {data.alternatives && data.alternatives.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>🥗</span>
            신장병에 더 안전한 대체 방법
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-emerald-100">
            {data.alternatives.map((recipe, idx) => (
              <RecipeCard key={idx} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {data.guideline && (
        <div className="mt-6 bg-white rounded-xl p-4 border border-emerald-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>📋</span>
            신장병 환자 식사 원칙
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
            {data.guideline}
          </p>
        </div>
      )}
    </div>
  )
}
