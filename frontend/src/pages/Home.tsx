import { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiResponse {
  message: string
  version?: string
}

interface DbCheckResponse {
  status: 'connected' | 'disconnected'
  message: string
  database?: string
  collections?: number
  collection_names?: string[]
  error?: string
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiResponse | null>(null)
  const [dbStatus, setDbStatus] = useState<DbCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // API 상태 확인
        const apiRes = await axios.get<ApiResponse>(`${API_URL}/`)
        setApiStatus(apiRes.data)

        // DB 연결 상태 확인
        const dbRes = await axios.get<DbCheckResponse>(`${API_URL}/db-check`)
        setDbStatus(dbRes.data)
      } catch (error) {
        console.error('Connection error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-600">
          CareGuide
        </h1>
        <p className="text-center text-gray-600 mb-8">
          만성콩팥병(CKD) 환자를 위한 종합 케어 플랫폼
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-semibold mb-4">시스템 상태</h2>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">연결 확인 중...</p>
            </div>
          ) : (
            <>
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-700">Backend API</h3>
                <p className="text-sm text-gray-600">
                  {apiStatus?.message || 'API 연결 실패'}
                </p>
                {apiStatus?.version && (
                  <p className="text-xs text-gray-500">Version: {apiStatus.version}</p>
                )}
              </div>

              <div className={`border-l-4 ${dbStatus?.status === 'connected' ? 'border-green-500' : 'border-red-500'} pl-4 py-2`}>
                <h3 className="font-semibold text-gray-700">MongoDB</h3>
                <p className="text-sm text-gray-600">
                  {dbStatus?.message || 'DB 연결 실패'}
                </p>
                <p className={`text-xs ${dbStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
                  {dbStatus?.status === 'connected' ? '✓ 연결됨' : '✗ 연결 실패'}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>프로젝트 초기 설정이 완료되었습니다.</p>
          <p className="mt-2">팀원별 기능 개발을 시작하세요.</p>
        </div>
      </div>
    </div>
  )
}
