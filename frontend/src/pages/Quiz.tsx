import { useState } from 'react'
import { useSession } from '../context/SessionContext'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'CKD 환자가 가장 주의해야 할 영양소는?',
    options: ['탄수화물', '지방', '나트륨', '비타민'],
    correctAnswer: 2,
    explanation: '나트륨은 혈압 상승과 부종을 유발할 수 있어 CKD 환자는 섭취를 제한해야 합니다.',
  },
  {
    id: 2,
    question: 'CKD 환자의 하루 권장 수분 섭취량은?',
    options: ['제한 없음', '500ml', '개인별 상태에 따라 다름', '3리터 이상'],
    correctAnswer: 2,
    explanation: '수분 섭취량은 환자의 신장 기능, 투석 여부 등에 따라 달라지므로 의료진과 상담이 필요합니다.',
  },
]

export default function Quiz() {
  const { updateLastActivity } = useSession()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const handleActivity = () => {
    updateLastActivity()
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    setShowExplanation(true)

    if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setScore(0)
    setQuizCompleted(false)
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
            퀴즈 완료!
          </h1>
          <p className="text-4xl font-bold mb-4">
            {score} / {quizQuestions.length}
          </p>
          <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            {score === quizQuestions.length
              ? '완벽합니다! 🎉'
              : score >= quizQuestions.length / 2
              ? '잘하셨습니다! 👏'
              : '다시 도전해보세요! 💪'}
          </p>
          <button onClick={handleRestart} className="btn-primary">
            다시 시작
          </button>
        </div>
      </div>
    )
  }

  const question = quizQuestions[currentQuestion]

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" onClick={handleActivity}>
      {/* 헤더 */}
      <header className="bg-white border-b border-[var(--color-line-medium)]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            건강 퀴즈
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            CKD 관리에 대한 지식을 테스트해보세요
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 진행 상황 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: 'var(--color-text-secondary)' }}>
              문제 {currentQuestion + 1} / {quizQuestions.length}
            </span>
            <span style={{ color: 'var(--color-primary)' }}>
              점수: {score}
            </span>
          </div>
          <div className="w-full bg-[var(--color-line-light)] rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%`,
                background: 'var(--gradient-primary)',
              }}
            />
          </div>
        </div>

        {/* 질문 */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-6">{question.question}</h2>

          {/* 선택지 */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !showExplanation && handleAnswerSelect(index)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  selectedAnswer === index
                    ? index === question.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : showExplanation && index === question.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : 'border-[var(--color-line-medium)] hover:border-[var(--color-primary)]'
                } ${showExplanation ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full border-2 mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 설명 */}
        {showExplanation && (
          <div className="card mb-6 bg-[var(--color-input-bar)]">
            <h3 className="font-semibold mb-2">
              {selectedAnswer === question.correctAnswer ? '정답입니다! ✓' : '오답입니다 ✗'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {question.explanation}
            </p>
          </div>
        )}

        {/* 다음 버튼 */}
        {showExplanation && (
          <button onClick={handleNextQuestion} className="btn-primary w-full">
            {currentQuestion < quizQuestions.length - 1 ? '다음 문제' : '결과 보기'}
          </button>
        )}
      </main>
    </div>
  )
}
