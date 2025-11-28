import { useEffect, useRef, useState } from 'react'
import NutritionAnalysisCard from '../../components/NutritionAnalysisCard'

type AgentType = 'medical_welfare' | 'nutrition' | 'research_paper'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  type?: 'nutrition_analysis' | 'profile_question' | 'general'
  nutritionData?: any
  imageUrl?: string
}

const AGENT_CONFIG = {
  medical_welfare: {
    name: 'Medical & Welfare',
    nameKo: '의료 복지',
    description: 'Healthcare benefits and welfare information'
  },
  nutrition: {
    name: 'Nutrition & Recipe',
    nameKo: '영양 레시피',
    description: 'CKD nutrition analysis and recipe recommendations'
  },
  research_paper: {
    name: 'Research & Papers',
    nameKo: '연구 논문',
    description: 'Medical research papers and literature'
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  // Handle nutrition_analysis type
  if (!isUser && message.type === 'nutrition_analysis') {
    return (
      <div className="flex justify-start mb-3 w-full">
        <div className="max-w-4xl">
          <NutritionAnalysisCard data={message.nutritionData} />
          {message.text && (
            <div className="mt-2 bg-white text-gray-800 border border-gray-200 rounded-xl px-4 py-3 shadow">
              <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Handle profile_question type with mint background
  const getBubbleStyle = () => {
    if (isUser) return 'bg-blue-600 text-white rounded-br-md'
    if (message.type === 'profile_question') return 'bg-emerald-100 text-gray-800 border border-emerald-300 rounded-bl-md'
    return 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xl rounded-2xl px-4 py-3 shadow ${getBubbleStyle()}`}>
        {message.imageUrl && (
          <img src={message.imageUrl} alt="uploaded" className="max-w-xs rounded-lg mb-2" />
        )}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</div>
      </div>
    </div>
  )
}

export default function SimpleChatPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('nutrition')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'demo-1',
      role: 'assistant',
      text: 'Hello! Upload a food image or ask me about CKD nutrition.',
      type: 'general'
    }
  ])
  const [input, setInput] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: input || 'Uploaded an image',
      imageUrl: imagePreview || undefined
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsSending(true)
    setError(null)

    try {
      // TODO: Replace with actual backend API call
      // For now, simulate nutrition analysis response
      await new Promise(resolve => setTimeout(resolve, 1500))

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'Nutrition analysis complete! Here are the results:',
        type: selectedFile ? 'nutrition_analysis' : 'general'
      }
      setMessages(prev => [...prev, assistantMessage])

      handleRemoveImage()
    } catch (err: any) {
      setError(err?.message || 'Failed to send message')
      console.error('Send error:', err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CareGuide AI Chat</h1>
        <p className="text-gray-600 text-sm">
          {AGENT_CONFIG[selectedAgent].description}
        </p>
      </div>

      {/* Agent Selection - Desktop */}
      <div className="hidden md:flex gap-4 mb-6">
        {(Object.keys(AGENT_CONFIG) as AgentType[]).map((agent) => (
          <button
            key={agent}
            onClick={() => {
              setSelectedAgent(agent)
              setMessages([])
              handleRemoveImage()
            }}
            className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all ${
              selectedAgent === agent
                ? 'bg-emerald-50 border-emerald-500 shadow-md'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">{AGENT_CONFIG[agent].nameKo}</div>
            <div className="text-xs text-gray-500 mt-1">{AGENT_CONFIG[agent].name}</div>
          </button>
        ))}
      </div>

      {/* Agent Selection - Mobile */}
      <div className="md:hidden mb-6">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-between"
        >
          <div>
            <div className="font-semibold text-gray-900">{AGENT_CONFIG[selectedAgent].nameKo}</div>
            <div className="text-xs text-gray-500">{AGENT_CONFIG[selectedAgent].name}</div>
          </div>
          <svg className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileMenuOpen && (
          <div className="mt-2 bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
            {(Object.keys(AGENT_CONFIG) as AgentType[]).map((agent) => (
              <button
                key={agent}
                onClick={() => {
                  setSelectedAgent(agent)
                  setMobileMenuOpen(false)
                  setMessages([])
                  handleRemoveImage()
                }}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-0 ${
                  selectedAgent === agent ? 'bg-emerald-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-gray-900">{AGENT_CONFIG[agent].nameKo}</div>
                <div className="text-xs text-gray-500">{AGENT_CONFIG[agent].name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="h-[65vh] overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              <p className="text-lg font-medium mb-2">
                {selectedAgent === 'nutrition' && 'Upload a food image or ask about nutrition'}
                {selectedAgent === 'medical_welfare' && 'Ask about medical benefits and welfare'}
                {selectedAgent === 'research_paper' && 'Search for research papers and literature'}
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={imagePreview} alt="preview" className="max-h-32 rounded-lg" />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* Image upload button - ONLY for nutrition agent */}
            {selectedAgent === 'nutrition' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="flex-shrink-0 p-3 rounded-xl border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                  title="Upload food image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              className="flex-1 rounded-xl border-2 border-gray-300 px-4 py-2 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder={
                selectedAgent === 'nutrition'
                  ? 'Type a message or upload a food image...'
                  : 'Type your message...'
              }
              disabled={isSending}
            />

            <button
              onClick={handleSend}
              disabled={isSending || (!input.trim() && !selectedFile)}
              className="flex-shrink-0 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
