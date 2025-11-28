/**
 * Intent-based Router Service
 * 의도분류 기반 라우팅 및 응답 생성
 */

import type { IntentCategory } from '../types/intent';
import { INTENT_CLASSIFICATIONS, EMERGENCY_KEYWORDS } from '../types/intent';
import { env } from '../config/env';

export type AgentType = 'medical_welfare' | 'nutrition' | 'research_paper' | 'router';

export interface RouterResponse {
  content: string;
  intents: IntentCategory[];
  agents: AgentType[];
  confidence: number;
  isDirectResponse: boolean;
  isEmergency: boolean;
}

export interface BackendStreamChunk {
  content?: string;
  answer?: string;
  response?: string;
  status?: 'streaming' | 'processing' | 'complete' | 'new_message';
  agent_type?: string;
  metadata?: {
    routed_to?: string[];
    synthesis?: boolean;
    individual_responses?: Record<string, string>;
  };
  error?: string;
}

export function detectIntent(text: string): IntentCategory[] {
  const lowerText = text.toLowerCase();
  const hasEmergency = EMERGENCY_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  if (hasEmergency) {
    return ['MEDICAL_INFO'];
  }
  return [];
}

function addMedicalDisclaimer(content: string, intents: IntentCategory[]): string {
  const needsDisclaimer = intents.some(
    (intent) => INTENT_CLASSIFICATIONS[intent].requiresStrictValidation
  );

  if (!needsDisclaimer) return content;

  return `${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ **중요 안내사항**
본 답변은 진단이나 치료를 대체할 수 없으며, 참고용 정보입니다.
증상이 지속되거나 악화되면 반드시 의료진과 상담하세요.

응급 상황 시 즉시 119에 연락하거나 가까운 병원을 방문하시기 바랍니다.`;
}

function generateEmergencyResponse(): string {
  return `🚨 **응급 상황 감지**

말씀하신 증상은 응급 상황일 수 있습니다.

**즉시 다음 조치를 취하세요:**
1. 119에 전화하거나
2. 가까운 응급실을 방문하세요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ AI는 응급 상황을 정확히 판단할 수 없습니다.
의심스러운 증상이 있다면 즉시 의료진의 도움을 받으시기 바랍니다.`;
}

async function callBackendAgent(query: string, agent: AgentType): Promise<string> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/chat/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query,
        agent_type: agent === 'router' ? 'auto' : agent,
        session_id: 'default',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || data.answer || '응답을 받지 못했습니다.';
  } catch (error) {
    console.error(`Error calling ${agent} agent:`, error);
    throw error;
  }
}

export interface StreamCallOptions {
  sessionId?: string;
  userId?: string;
  roomId?: string;
  userProfile?: 'general' | 'patient' | 'researcher';
}

export async function callBackendAgentStream(
  query: string,
  agent: AgentType,
  onChunk: (content: string, isComplete: boolean, metadata?: BackendStreamChunk) => void,
  onError?: (error: Error) => void,
  options?: StreamCallOptions | 'general' | 'patient' | 'researcher',
  signal?: AbortSignal
): Promise<{ agents: AgentType[]; intents: IntentCategory[] }> {
  let sessionId = 'default';
  let userId: string | undefined;
  let roomId: string | undefined;
  let userProfile: 'general' | 'patient' | 'researcher' = 'general';

  if (typeof options === 'string') {
    userProfile = options;
  } else if (options) {
    sessionId = options.sessionId || 'default';
    userId = options.userId;
    roomId = options.roomId;
    userProfile = options.userProfile || 'general';
  }

  let authToken: string | null = null;
  try {
    authToken = localStorage.getItem('careguide_token');
  } catch (e) {
    // localStorage not available
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${env.apiBaseUrl}/api/chat/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: query,
        agent_type: agent === 'router' ? 'auto' : agent,
        session_id: sessionId,
        user_id: userId,
        room_id: roomId,
        user_profile: userProfile,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is null');
    }

    const decoder = new TextDecoder();
    let accumulatedContent = '';
    let detectedAgents: AgentType[] = [];
    let detectedIntents: IntentCategory[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onChunk(accumulatedContent, true);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            onChunk(accumulatedContent, true);
            return { agents: detectedAgents, intents: detectedIntents };
          }

          try {
            const parsed: BackendStreamChunk = JSON.parse(data);

            if (parsed.metadata?.routed_to && parsed.metadata.routed_to.length > 0) {
              const VALID_AGENTS: readonly AgentType[] = ['medical_welfare', 'nutrition', 'research_paper', 'router'];
              const routedAgents = parsed.metadata.routed_to
                .filter((agentName): agentName is string => typeof agentName === 'string')
                .filter((agentName): agentName is AgentType =>
                  VALID_AGENTS.includes(agentName as AgentType)
                ) as AgentType[];

              if (routedAgents.length > 0) {
                detectedAgents = routedAgents;
                detectedIntents = mapAgentsToIntents(routedAgents);
              }
            }

            if (parsed.agent_type && !detectedAgents.includes(parsed.agent_type as AgentType)) {
              const agentType = parsed.agent_type as AgentType;
              if (!detectedAgents.includes(agentType)) {
                detectedAgents.push(agentType);
              }
            }

            let content = '';
            if (parsed.content) {
              content = parsed.content;
            } else if (parsed.answer) {
              content = parsed.answer;
            } else if (parsed.response) {
              content = parsed.response;
            }

            if (content) {
              if (parsed.status === 'streaming') {
                accumulatedContent += content;
                onChunk(accumulatedContent, false, parsed);
              } else if (parsed.status === 'new_message') {
                if (accumulatedContent) {
                  accumulatedContent += '\n\n' + content;
                } else {
                  accumulatedContent = content;
                }
                onChunk(accumulatedContent, false, parsed);
              } else {
                accumulatedContent = content;
                onChunk(accumulatedContent, false, parsed);
              }
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // Ignore JSON parse failures
          }
        }
      }
    }

    return { agents: detectedAgents, intents: detectedIntents };
  } catch (error) {
    console.error(`Error in streaming call to ${agent} agent:`, error);
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
}

function mapAgentsToIntents(agents: AgentType[]): IntentCategory[] {
  const intentMap: Record<AgentType, IntentCategory> = {
    'medical_welfare': 'MEDICAL_INFO',
    'nutrition': 'DIET_INFO',
    'research_paper': 'RESEARCH',
    'router': 'CHIT_CHAT',
  };

  return agents.map(agent => intentMap[agent] || 'CHIT_CHAT');
}

export async function routeQueryStream(
  query: string,
  onChunk: (content: string, isComplete: boolean) => void,
  onError?: (error: Error) => void,
  options?: StreamCallOptions | 'general' | 'patient' | 'researcher',
  signal?: AbortSignal
): Promise<RouterResponse> {
  const frontendIntents = detectIntent(query);
  const isEmergency = frontendIntents.length > 0 && frontendIntents[0] === 'MEDICAL_INFO';

  if (isEmergency) {
    const emergencyContent = generateEmergencyResponse();
    onChunk(emergencyContent, true);
    return {
      content: emergencyContent,
      intents: ['MEDICAL_INFO'],
      agents: [],
      confidence: 1.0,
      isDirectResponse: true,
      isEmergency: true,
    };
  }

  let finalContent = '';
  let backendAgents: AgentType[] = [];
  let backendIntents: IntentCategory[] = [];

  try {
    const { agents, intents } = await callBackendAgentStream(
      query,
      'router',
      (content, isComplete) => {
        finalContent = content;
        onChunk(content, isComplete);
      },
      onError,
      options,
      signal
    );

    backendAgents = agents.filter((a): a is AgentType =>
      ['medical_welfare', 'nutrition', 'research_paper', 'router'].includes(a)
    );
    backendIntents = intents.filter((i): i is IntentCategory =>
      ['NON_MEDICAL', 'ILLEGAL_REQUEST', 'MEDICAL_INFO', 'DIET_INFO', 'RESEARCH',
       'WELFARE_INFO', 'HEALTH_RECORD', 'LEARNING', 'POLICY', 'CHIT_CHAT'].includes(i)
    );
  } catch (error) {
    console.error('Error in streaming call:', error);

    const fallbackContent = `죄송합니다. 백엔드 서버와 통신 중 오류가 발생했습니다.

**가능한 원인:**
- 백엔드 서버가 실행 중이 아닐 수 있습니다
- 네트워크 연결 문제일 수 있습니다

백엔드 서버를 확인해주세요: http://localhost:8000

응급 상황이라면 즉시 119에 연락하거나 가까운 병원을 방문하세요.`;

    onChunk(fallbackContent, true);

    return {
      content: fallbackContent,
      intents: ['CHIT_CHAT'],
      agents: [],
      confidence: 0.0,
      isDirectResponse: true,
      isEmergency: false,
    };
  }

  const finalIntents: IntentCategory[] = backendIntents.length > 0 ? backendIntents : ['CHIT_CHAT'];
  finalContent = addMedicalDisclaimer(finalContent, finalIntents);

  return {
    content: finalContent,
    intents: finalIntents,
    agents: backendAgents,
    confidence: 0.85,
    isDirectResponse: false,
    isEmergency: false,
  };
}

export async function routeQuery(query: string): Promise<RouterResponse> {
  const frontendIntents = detectIntent(query);
  const isEmergency = frontendIntents.length > 0 && frontendIntents[0] === 'MEDICAL_INFO';

  if (isEmergency) {
    return {
      content: generateEmergencyResponse(),
      intents: ['MEDICAL_INFO'],
      agents: [],
      confidence: 1.0,
      isDirectResponse: true,
      isEmergency: true,
    };
  }

  let content: string;
  try {
    content = await callBackendAgent(query, 'router');
  } catch (error) {
    console.error('Error calling backend:', error);
    content = `죄송합니다. 백엔드 서버와 통신 중 오류가 발생했습니다.

**가능한 원인:**
- 백엔드 서버가 실행 중이 아닐 수 있습니다
- 네트워크 연결 문제일 수 있습니다

백엔드 서버를 확인해주세요: http://localhost:8000

응급 상황이라면 즉시 119에 연락하거나 가까운 병원을 방문하세요.`;

    return {
      content,
      intents: ['CHIT_CHAT'],
      agents: [],
      confidence: 0.0,
      isDirectResponse: true,
      isEmergency: false,
    };
  }

  const medicalKeywords = ['증상', '치료', '투석', '질병', '진단', '약', '병원', '검사', '수치'];
  const hasMedicalContent = medicalKeywords.some(keyword => query.toLowerCase().includes(keyword));

  if (hasMedicalContent) {
    content = addMedicalDisclaimer(content, ['MEDICAL_INFO']);
  }

  return {
    content,
    intents: [],
    agents: ['router'],
    confidence: 0.85,
    isDirectResponse: false,
    isEmergency: false,
  };
}

export function getRecommendedAgent(intent: IntentCategory): AgentType {
  const classification = INTENT_CLASSIFICATIONS[intent];
  return classification.recommendedAgent || 'research_paper';
}
