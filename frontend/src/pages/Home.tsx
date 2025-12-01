import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface ApiResponse {
  message: string
  version?: string
}

interface DbCheckResponse {
  status: string
  message: string
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<ApiResponse | null>(null)
  const [dbStatus, setDbStatus] = useState<DbCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fullText = '케어플러스는 신장병 환우, 간병인, 연구자분들을 위해 만들어진 따뜻한 AI 파트너입니다. 의료·복지, 식이·영양, 연구 정보를 편하게 찾을 수 있도록 정성껏 도와드려요.'

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

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0
    const typingSpeed = 50
    let timeoutId: number

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1))
        currentIndex++
        timeoutId = window.setTimeout(typeNextChar, typingSpeed)
      }
    }

    const startDelay = window.setTimeout(() => {
      typeNextChar()
    }, 500)

    return () => {
      clearTimeout(startDelay)
      clearTimeout(timeoutId)
    }
  }, [fullText])

  // Water flow particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      console.warn('WebGL not supported, skipping particle animation')
      return
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const vs = `
      attribute vec2 position;
      void main() {
        gl_PointSize = 2.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `
    const fs = `
      precision mediump float;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        vec3 color = vec3(0.31, 0.76, 0.97);
        gl_FragColor = vec4(color, (1.0 - dist * 2.0) * 0.6);
      }
    `

    const program = gl.createProgram()
    const vshader = gl.createShader(gl.VERTEX_SHADER)
    const fshader = gl.createShader(gl.FRAGMENT_SHADER)

    if (!program || !vshader || !fshader) return

    gl.shaderSource(vshader, vs)
    gl.shaderSource(fshader, fs)
    gl.compileShader(vshader)
    gl.compileShader(fshader)
    gl.attachShader(program, vshader)
    gl.attachShader(program, fshader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)

    const particles = 800
    const data = new Float32Array(particles * 2)
    const velocity = new Float32Array(particles * 2)

    for (let i = 0; i < particles; i++) {
      data[i * 2] = Math.random() * 2 - 1
      data[i * 2 + 1] = Math.random() * 2 - 1
      velocity[i * 2] = (Math.random() - 0.5) * 0.0005
      velocity[i * 2 + 1] = (Math.random() - 0.5) * 0.001 + 0.0005
    }

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    let animationId: number

    const animate = () => {
      for (let i = 0; i < particles; i++) {
        data[i * 2] += velocity[i * 2]
        data[i * 2 + 1] += velocity[i * 2 + 1]

        if (data[i * 2] > 1) data[i * 2] = -1
        if (data[i * 2] < -1) data[i * 2] = 1
        if (data[i * 2 + 1] > 1) data[i * 2 + 1] = -1
      }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)

      gl.clearColor(0.04, 0.1, 0.18, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
      gl.drawArrays(gl.POINTS, 0, particles)

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
        style={{ zIndex: 0 }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8" style={{ color: '#4fc3f7' }}>
            CareGuide
          </h1>

          <div className="text-center mb-6">
            <p
              style={{
                color: 'rgb(242, 255, 253)',
                lineHeight: 1.8,
                minHeight: '3em',
                fontSize: '1.1rem'
              }}
            >
              {displayedText}
              <span className="animate-pulse">|</span>
            </p>
          </div>

          <div className="bg-white bg-opacity-95 rounded-lg shadow-md p-6 space-y-4">
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

                <div className={`border-l-4 ${dbStatus?.status === 'success' ? 'border-green-500' : 'border-red-500'} pl-4 py-2`}>
                  <h3 className="font-semibold text-gray-700">MongoDB</h3>
                  <p className="text-sm text-gray-600">
                    {dbStatus?.message || 'DB 연결 실패'}
                  </p>
                  <p className={`text-xs ${dbStatus?.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {dbStatus?.status === 'success' ? '✓ 연결됨' : '✗ 연결 실패'}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="mt-8 text-center text-sm" style={{ color: 'rgba(242, 255, 253, 0.7)' }}>
            <p>프로젝트 초기 설정이 완료되었습니다.</p>
            <p className="mt-2">팀원별 기능 개발을 시작하세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
