import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ParlantClient,
  ParlantEvent,
  Profile,
  SessionState
} from './parlantClient'
import {
  ChatMessage,
  PaperResult,
  PROFILE_LABELS,
  PROFILE_MAX_RESULTS,
  extractAssistantMessages,
  extractPaperResults
} from './utils'
import { sleep } from './sleep'

const BASE_URL = import.meta.env.VITE_PARLANT_SERVER || 'http://localhost:8800'
const DEFAULT_PROFILE: Profile =
  (import.meta.env.VITE_CARE_GUIDE_DEFAULT_PROFILE as Profile) || 'general'

const agentIdEnv = import.meta.env.VITE_PARLANT_AGENT_ID as string | undefined
const agentNameEnv = import.meta.env.VITE_PARLANT_AGENT_NAME as string | undefined

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-3 shadow ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</div>
        {!isUser && message.status && message.status !== 'ready' && (
          <div className="mt-1 text-xs text-gray-500">status: {message.status}</div>
        )}
      </div>
    </div>
  )
}

function PaperList({ papers }: { papers: PaperResult[] }) {
  if (!papers.length) return null
  return (
    <div className="mt-6 border border-gray-200 rounded-xl bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">
          참고 문헌 / 자료 ({papers.length})
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {papers.map((paper) => (
          <div key={paper.id} className="px-4 py-3">
            <div className="font-medium text-gray-900">{paper.title || 'Untitled'}</div>
            {paper.authors && (
              <div className="text-xs text-gray-600 mt-1">{paper.authors}</div>
            )}
            {paper.abstract && (
              <div className="text-sm text-gray-700 mt-2">{paper.abstract}</div>
            )}
            <div className="text-xs text-gray-500 mt-2 flex gap-3">
              {paper.source && <span>{paper.source}</span>}
              {paper.url && (
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  원문 보기
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [session, setSession] = useState<SessionState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [papers, setPapers] = useState<PaperResult[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stopRequested, setStopRequested] = useState(false)
  const stopRequestedRef = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const parlClient = useMemo(
    () =>
      new ParlantClient({
        baseUrl: BASE_URL,
        agentId: agentIdEnv,
        agentName: agentNameEnv || 'CareGuide_v2',
        defaultProfile: DEFAULT_PROFILE
      }),
    []
  )

  useEffect(() => {
    console.log('[ChatPage] profile changed, bootstrapping session', profile)
    let cancelled = false
    const bootstrap = async () => {
      setIsBootstrapping(true)
      setError(null)
      try {
        const sessionState = await parlClient.createSessionForProfile(profile)
        if (!cancelled) {
          setSession(sessionState)
          setMessages([])
          setPapers([])
          console.log('[ChatPage] bootstrap success', sessionState)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || '세션 생성 중 오류가 발생했습니다.')
          console.error('[ChatPage] bootstrap error', err)
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
          console.log('[ChatPage] bootstrap finished')
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [profile, parlClient])

  const handleSend = async () => {
    if (!session || !input.trim()) {
      console.log('[ChatPage] handleSend blocked - missing session or empty input')
      return
    }
    stopRequestedRef.current = false
    setStopRequested(false)
    const text = input.trim()
    setInput('')
    setIsSending(true)
    setError(null)
    console.log('[ChatPage] handleSend start', { sessionId: session.sessionId, text })

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      createdAt: Date.now()
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      await parlClient.postCustomerMessage(session.sessionId, text)
      console.log('[ChatPage] message posted, polling for updates')
      const { offsetDelta } = await pollAgentUpdatesWithBackoff(session)

      setSession((prev) =>
        prev ? { ...prev, lastOffset: prev.lastOffset + offsetDelta } : prev
      )
    } catch (err: any) {
      setError(err?.message || '메시지 전송 중 오류가 발생했습니다.')
      console.error('[ChatPage] handleSend error', err)
    } finally {
      setIsSending(false)
      console.log('[ChatPage] handleSend finished')
    }
  }

  // Poll Parlant events with backoff (bridge-style)
  const pollAgentUpdatesWithBackoff = async (
    state: SessionState
  ): Promise<{ offsetDelta: number }> => {
    let offset = state.lastOffset
    let delayMs = 800
    const maxDelayMs = 6000
    const maxIdleMs = 10 * 60 * 1000 // 10 minutes without new data
    let lastEventAt = Date.now()
    let attempt = 0

    while (Date.now() - lastEventAt < maxIdleMs) {
      if (stopRequestedRef.current) {
        console.log('[ChatPage] poll stopping - user requested stop')
        break
      }
      attempt += 1
      console.log('[ChatPage] poll attempt', { attempt, offset, delayMs })
      const events = await parlClient.listEvents(state.sessionId, offset)

      if (events.length) {
        const latestOffset = Math.max(...events.map((e) => e.offset || -1))
        offset = latestOffset + 1
        console.log('[ChatPage] poll got events', {
          count: events.length,
          newOffset: offset
        })
        lastEventAt = Date.now()

        // Apply messages/papers to UI immediately
        const newAssistantMessages = extractAssistantMessages(events)
        const newPapers = extractPaperResults(events)
        console.log('[ChatPage] events batch', {
          total: events.length,
          assistant: newAssistantMessages.length,
          papers: newPapers.length
        })

        if (newAssistantMessages.length) {
          setMessages((prev) => [...prev, ...newAssistantMessages])

          // Stop polling if disclaimer is received
          const hasDisclaimer = newAssistantMessages.some((m) =>
            m.text?.includes('⚠️ 이 답변은 교육 목적이며')
          )
          if (hasDisclaimer) {
            console.log('[ChatPage] disclaimer detected - stopping poll')
            stopRequestedRef.current = true
            setStopRequested(true)
          }
        }

        if (newPapers.length) {
          setPapers((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const unique = newPapers.filter((p) => !existingIds.has(p.id))
            return [...prev, ...unique]
          })
        }
      }

      // wait with backoff until idle threshold or stop
      console.log('[ChatPage] poll waiting', { delayMs })
      await sleep(delayMs)
      delayMs = Math.min(Math.round(delayMs * 1.6), maxDelayMs)
    }

    return { offsetDelta: offset - state.lastOffset }
  }

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleNewSession = async () => {
    console.log('[ChatPage] handleNewSession start')
    setMessages([])
    setPapers([])
    setSession(null)
    setError(null)
    setIsBootstrapping(true)
    try {
      const sessionState = await parlClient.createSessionForProfile(profile)
      setSession(sessionState)
      console.log('[ChatPage] handleNewSession success', sessionState)
    } catch (err: any) {
      setError(err?.message || '세션 생성 중 오류가 발생했습니다.')
      console.error('[ChatPage] handleNewSession error', err)
    } finally {
      setIsBootstrapping(false)
      console.log('[ChatPage] handleNewSession finished')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CareGuide 챗봇</h1>
          <p className="text-gray-600 mt-1">
            Parlant 세션을 사용해 하이브리드 검색 기반의 의료 정보를 제공합니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-gray-100 p-1">
            {(['general', 'patient', 'researcher'] as Profile[]).map((p) => (
              <button
                key={p}
                onClick={() => setProfile(p)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile === p ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                }`}
              >
                {PROFILE_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={handleNewSession}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            새 세션
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 flex gap-3">
        <span>Agent: {agentNameEnv || 'CareGuide_v2'}</span>
        {session?.sessionId && <span>Session: {session.sessionId}</span>}
        <span>Max results: {PROFILE_MAX_RESULTS[profile]} per source</span>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-[65vh] overflow-y-auto rounded-2xl bg-gray-50 border border-gray-200 p-4">
            {isBootstrapping && (
              <div className="flex items-center justify-center py-10 text-gray-600 text-sm">
                Parlant 세션을 준비 중입니다...
              </div>
            )}
            {!isBootstrapping && messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-10">
                프로필을 선택한 뒤 질문을 입력하세요.
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              질문 입력
            </label>
            <div className="flex items-center gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 신장이식 후 생활 관리 방법 알려줘"
                disabled={isSending || isBootstrapping}
              />
              <button
                onClick={() => {
                  stopRequestedRef.current = true
                  setStopRequested(true)
                  console.log('[ChatPage] stop requested by user')
                }}
                disabled={!isSending}
                className="h-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white shadow disabled:opacity-50"
              >
                중지
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || isBootstrapping || !input.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow disabled:opacity-50"
              >
                {isSending ? '전송 중...' : '보내기'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-800">세션 상태</h3>
            <dl className="mt-3 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <dt>프로필</dt>
                <dd className="font-medium text-gray-900">{PROFILE_LABELS[profile]}</dd>
              </div>
              <div className="flex justify-between">
                <dt>세션ID</dt>
                <dd className="truncate max-w-[12rem] text-right">
                  {session?.sessionId || '생성 중'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>오프셋</dt>
                <dd>{session?.lastOffset ?? 0}</dd>
              </div>
            </dl>
          </div>

          <PaperList papers={papers} />
        </div>
      </div>
    </div>
  )
}
