import { ParlantEvent, Profile } from './parlantClient'

export interface DishCandidate {
  dish_name: string
  confidence: number
  dish_data: any
}

export interface RecommendedDish {
  dishName: string
  description: string
  estimatedNutrients: {
    sodium: number
    potassium: number
    phosphorus: number
    protein: number
  }
}

export interface IngredientCandidate {
  name: string
  nutrients: {
    sodium: number
    potassium: number
    phosphorus: number
    protein: number
  }
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  status?: string
  correlationId?: string
  createdAt: number
  type?: 'nutrition_analysis' | 'profile_question' | 'general' | 'dish_selection' | 'ingredient_single' | 'ingredient_multiple' | 'error'
  nutritionData?: any
  imageUrl?: string
  dishCandidates?: DishCandidate[]
  recommendedDishes?: RecommendedDish[]
  ingredientCandidates?: IngredientCandidate[]
  analysisType?: string
}

export interface PaperResult {
  id: string
  title?: string
  authors?: string
  abstract?: string
  source?: string
  url?: string
  score?: number
}

export const PROFILE_LABELS: Record<Profile, string> = {
  researcher: '연구자',
  patient: '환우',
  general: '일반인'
}

export const PROFILE_MAX_RESULTS: Record<Profile, number> = {
  researcher: 10,
  patient: 5,
  general: 3
}

export function groupByCorrelation(
  events: ParlantEvent[]
): Record<string, ParlantEvent[]> {
  return events.reduce<Record<string, ParlantEvent[]>>((acc, event) => {
    const base = (event.correlation_id || 'unknown').split('::')[0]
    acc[base] = acc[base] || []
    acc[base].push(event)
    return acc
  }, {})
}

function getMessageText(payload: any): string | null {
  if (!payload) return null
  if (typeof payload === 'string') return payload

  if (typeof payload === 'object') {
    const text =
      payload.message ||
      payload.text ||
      payload.content ||
      payload.utterance ||
      payload.response

    if (typeof text === 'string') return text
    if (typeof text === 'object' && text) {
      return text.text || text.content || text.message || null
    }
  }

  return null
}

export function extractAssistantMessages(
  events: ParlantEvent[]
): ChatMessage[] {
  const grouped = groupByCorrelation(events)
  const messages: ChatMessage[] = []

  for (const event of events) {
    if (event.kind !== 'message') continue
    if (!['ai_agent', 'human_agent_on_behalf_of_ai_agent', 'agent'].includes(event.source || '')) {
      continue
    }

    const text = getMessageText(event.data ?? event.message)
    if (!text) continue

    const correlationId = event.correlation_id
    const statusEvents = correlationId ? grouped[correlationId]?.filter((e) => e.kind === 'status') : []
    const lastStatus =
      statusEvents && statusEvents.length > 0
        ? statusEvents[statusEvents.length - 1]
        : undefined
    const status =
      lastStatus?.data?.status ||
      lastStatus?.data?.state ||
      lastStatus?.data?.stage ||
      'ready'

    messages.push({
      id: `${event.id || `${Date.now()}`}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'assistant',
      text,
      status,
      correlationId,
      createdAt: Date.now()
    })
  }

  return messages
}

export function extractPaperResults(events: ParlantEvent[]): PaperResult[] {
  const papers: PaperResult[] = []

  for (const event of events) {
    if (event.kind === 'tool') {
      const payload = event.data || {}
      const toolName = payload.tool || payload.tool_name

      if (toolName === 'search_medical_qa') {
        const results =
          payload.output?.papers ||
          payload.output?.results ||
          payload.output ||
          payload.tool_output

        if (Array.isArray(results)) {
          for (const paper of results) {
            papers.push({
              id:
                paper.id ||
                paper.pmid ||
                paper.doi ||
                `${paper.title || 'paper'}-${Math.random().toString(36).slice(2, 8)}`,
              title: paper.title,
              authors: paper.authors,
              abstract: paper.abstract,
              source: paper.journal || paper.source || paper.sourcename,
              url: paper.url || paper.doi,
              score: paper.score
            })
          }
        }
      }
    }
  }

  return papers
}
