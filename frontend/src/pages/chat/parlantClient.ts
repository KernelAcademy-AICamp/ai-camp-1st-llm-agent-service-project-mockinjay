import axios, { AxiosInstance, isAxiosError } from 'axios'

export type Profile = 'researcher' | 'patient' | 'general'

export interface ParlantConfig {
  baseUrl: string
  agentId?: string
  agentName?: string
  defaultProfile?: Profile
  httpTimeoutMs?: number
}

export interface ParlantEvent {
  id?: string
  kind: string
  source?: string
  offset?: number
  correlation_id?: string
  data?: any
  message?: string
  created_at?: string
}

export interface SessionState {
  sessionId: string
  customerId?: string
  profile: Profile
  lastOffset: number
}

interface Tag {
  id: string
  name: string
}

interface Customer {
  id: string
  name: string
  tags?: string[]
}

interface Session {
  id: string
  agent_id: string
  customer_id: string
  metadata?: Record<string, unknown>
}

interface Agent {
  id: string
  name: string
}

export class ParlantClient {
  private readonly axios: AxiosInstance
  private readonly config: ParlantConfig
  private resolvedAgentId?: string

  constructor(config: ParlantConfig) {
    this.config = config
    this.axios = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      timeout: config.httpTimeoutMs ?? 610_000
    })
    console.log('[ParlantClient] init config', this.config)
  }

  async resolveAgentId(): Promise<string> {
    console.log('[ParlantClient] resolveAgentId start')
    if (this.config.agentId) {
      console.log('[ParlantClient] resolveAgentId using provided agentId', this.config.agentId)
      return this.config.agentId
    }

    if (this.resolvedAgentId) {
      console.log('[ParlantClient] resolveAgentId using cached agentId', this.resolvedAgentId)
      return this.resolvedAgentId
    }

    const agentName = this.config.agentName || 'CareGuide_v2'
    const { data } = await this.axios.get<Agent[]>(`/agents`)
    const agent = data.find((a) => a.name === agentName)

    if (!agent?.id) {
      throw new Error(
        `No agent named "${agentName}" found. Set VITE_PARLANT_AGENT_ID to bypass lookup.`
      )
    }

    this.resolvedAgentId = agent.id
    console.log('[ParlantClient] resolveAgentId discovered', agent.id)
    return agent.id
  }

  async listTags(): Promise<Tag[]> {
    console.log('[ParlantClient] listTags request')
    const { data } = await this.axios.get<Tag[]>(`/tags`)
    console.log('[ParlantClient] listTags response count', data.length)
    return data
  }

  async ensureProfileTag(profile: Profile): Promise<Tag> {
    const tagName = `profile:${profile}`
    const tags = await this.listTags()
    const existing = tags.find((tag) => tag.name === tagName)
    if (existing) {
      console.log('[ParlantClient] ensureProfileTag existing', tagName, existing.id)
      return existing
    }

    console.log('[ParlantClient] ensureProfileTag creating', tagName)
    const { data } = await this.axios.post<Tag>(`/tags`, { name: tagName })
    console.log('[ParlantClient] ensureProfileTag created', data.id)
    return data
  }

  async createCustomerForProfile(profile: Profile): Promise<Customer> {
    console.log('[ParlantClient] createCustomerForProfile start', profile)
    const tag = await this.ensureProfileTag(profile)
    const shortId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10)

    const { data } = await this.axios.post<Customer>(`/customers`, {
      name: `user_${shortId}`,
      tags: [tag.id]
    })
    console.log('[ParlantClient] createCustomerForProfile created', data.id)
    return data
  }

  async createSessionForProfile(profile: Profile): Promise<SessionState> {
    console.log('[ParlantClient] createSessionForProfile start', profile)
    const agentId = await this.resolveAgentId()
    const customer = await this.createCustomerForProfile(profile)
    const metadata = { careguide_profile: profile }

    const { data } = await this.axios.post<Session>(
      `/sessions`,
      {
        agent_id: agentId,
        customer_id: customer.id,
        metadata
      },
      { params: { allow_greeting: 'false' } }
    )

    const sessionState = {
      sessionId: data.id,
      customerId: customer.id,
      profile,
      lastOffset: 0
    }
    console.log('[ParlantClient] createSessionForProfile created', sessionState)
    return sessionState
  }

  async postCustomerMessage(sessionId: string, message: string) {
    console.log('[ParlantClient] postCustomerMessage', { sessionId, message })
    return this.axios.post(`/sessions/${sessionId}/events`, {
      kind: 'message',
      source: 'customer',
      message
    })
  }

  async listEvents(
    sessionId: string,
    minOffset: number,
    waitForData = 20,
    kinds = 'message,status,tool'
  ): Promise<ParlantEvent[]> {
    console.log('[ParlantClient] listEvents request', { sessionId, minOffset, waitForData, kinds })
    try {
      const { data } = await this.axios.get<ParlantEvent[]>(
        `/sessions/${sessionId}/events`,
        {
          params: { min_offset: minOffset, wait_for_data: waitForData, kinds }
        }
      )
      console.log('[ParlantClient] listEvents response count', data?.length || 0)
      return data || []
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 504) {
        console.log('[ParlantClient] listEvents timeout 504 - returning empty')
        return []
      }
        console.error('[ParlantClient] listEvents error', err)
      throw err
    }
  }
}
