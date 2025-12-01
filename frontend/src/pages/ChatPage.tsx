import React, { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Stethoscope, Utensils, FileText, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { MobileHeader } from '../components/MobileHeader';
import axios from 'axios';

type AgentTab = 'medical' | 'nutrition' | 'research';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  agentType?: string;
  fallbackType?: string;
}

interface SessionContext {
  selected_agent?: string;
  diseases?: string[];
  keywords?: string[];
  user_profile?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function ChatPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<AgentTab>('nutrition');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('신장병 환우');
  const [sessionId, setSessionId] = useState<string>('');
  const [context, setContext] = useState<SessionContext>({});
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const tabs = [
    { id: 'medical' as AgentTab, label: '의료 복지', icon: Stethoscope },
    { id: 'nutrition' as AgentTab, label: '식이 영양', icon: Utensils },
    { id: 'research' as AgentTab, label: '연구 논문', icon: FileText }
  ];

  const ActiveIcon = tabs.find(t => t.id === activeTab)?.icon || Stethoscope;

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Handle initial message from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.initialMessage && sessionId) {
      handleSendMessage(state.initialMessage);
    }
    if (state?.tab) {
      setActiveTab(state.tab);
    }
  }, [location, sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check if suggestions need scroll buttons
  useEffect(() => {
    const checkScroll = () => {
      if (suggestionsRef.current) {
        const { scrollWidth, clientWidth } = suggestionsRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [messages]);

  // Initialize session
  const initializeSession = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/session/create`, {
        user_id: 'user_' + Date.now(),
        metadata: {
          platform: 'web',
          page: 'chat'
        }
      });

      if (response.data.session_id) {
        setSessionId(response.data.session_id);
        console.log('✅ Session created:', response.data.session_id);
      }
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      // Generate fallback session ID
      setSessionId('session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    }
  };

  // Send message to agent
  const handleSendMessage = async (text?: string) => {
    const messageText = text || message;
    if (!messageText.trim() || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
      agentType: activeTab
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Update context with user profile and maintain selected agent
      const updatedContext: SessionContext = {
        ...context,
        selected_agent: activeTab,
        user_profile: selectedProfile
      };

      // Call agent API
      const response = await axios.post(`${API_BASE_URL}/api/agent/chat`, {
        message: messageText,
        agent_type: activeTab,
        session_id: sessionId,
        context: updatedContext
      });

      console.log('📨 Agent response:', response.data);

      // Handle response
      if (response.data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.data.message,
          timestamp: new Date(),
          agentType: response.data.agent_type
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update context if provided
        if (response.data.context_info) {
          setContext(prev => ({
            ...prev,
            ...updatedContext
          }));
        }
      } else {
        // Handle fallback message
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.data.message || '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
          timestamp: new Date(),
          agentType: activeTab,
          fallbackType: response.data.fallback_type
        };

        setMessages(prev => [...prev, fallbackMessage]);

        // Log error for debugging
        console.warn('⚠️ Fallback message:', response.data.fallback_type, response.data.error);
      }
    } catch (error: any) {
      console.error('❌ Error sending message:', error);

      // Generic error fallback
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date(),
        agentType: activeTab,
        fallbackType: 'RESPONSE_GENERATION_FAILED'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Get welcome message based on agent type
  const getWelcomeMessage = () => {
    const messages = {
      medical: '의료 복지',
      nutrition: '식이 영양',
      research: '연구 논문'
    };
    return `안녕하세요! 신장병의 ${messages[activeTab]} 정보를 알려드리는 케어가이드 챗봇입니다. 무엇이든 물어보세요.`;
  };

  // Get suggestion buttons based on agent type
  const getSuggestions = () => {
    const suggestions = {
      medical: [
        '신장병 환자를 위한 의료 복지 혜택은?',
        '투석 환자 지원 제도 알려줘'
      ],
      nutrition: [
        '저칼륨 음식 재료 알려줘',
        '신장병 환자를 위한 김장 레시피 알려줘'
      ],
      research: [
        '만성신장병 최신 연구 동향은?',
        'CKD 치료법 관련 논문 찾아줘'
      ]
    };
    return suggestions[activeTab] || suggestions.nutrition;
  };

  // Scroll suggestions
  const scrollSuggestions = (direction: 'left' | 'right') => {
    if (suggestionsRef.current) {
      const scrollAmount = 200;
      suggestionsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white relative">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <MobileHeader
          title="AI 챗봇"
          showMenu={true}
          showProfile={true}
        />
      </div>

      {/* Desktop Tabs - Agent Selection (Fixed to selected agent) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 lg:h-[68.5px] lg:pt-[12px] flex justify-center">
        <div className="w-full lg:max-w-[832px] flex gap-2 lg:gap-4 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  // Only allow tab change if no messages yet
                  if (messages.length === 0) {
                    setActiveTab(tab.id);
                  }
                }}
                disabled={messages.length > 0 && activeTab !== tab.id}
                className={`flex-1 min-w-fit h-[40px] lg:h-[43.5px] flex items-center justify-center gap-1.5 lg:gap-2 rounded-[16.4px] transition-all duration-200 relative group px-3 lg:px-0 ${
                  messages.length > 0 && activeTab !== tab.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={isActive ? {
                  background: '#FFFFFF',
                  color: '#00C9B7',
                  fontWeight: 'bold',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #00C9B7, #9F7AEA)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: '0px 0px 10px rgba(0, 201, 183, 0.1)'
                } : {
                  background: '#FFFFFF',
                  color: '#666666',
                  border: '1px solid #E5E7EB'
                }}
              >
                <Icon size={16} className="lg:w-[18px] lg:h-[18px]" strokeWidth={1.5} color={isActive ? '#00C9B7' : '#666666'} />
                <span className="text-[12px] lg:text-[13px] whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
        {messages.length > 0 && (
          <div className="text-[10px] text-gray-500 mt-2 text-center">
            대화 중에는 다른 에이전트로 변경할 수 없습니다
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white flex justify-center">
        <div className="w-full lg:max-w-[832px] p-6 lg:p-[28.5px] pb-[180px]">
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className="mb-6">
             <div className="flex items-center gap-2 mb-1">
               <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <ActiveIcon size={14} color="#4A5565" />
               </div>
               <span className="text-[12px] text-[#6a7282]">CareGuide AI</span>
             </div>
             <div className="bg-[#f0f4ff] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] p-4 max-w-[500px]">
               <p className="text-[14px] text-black leading-[22px]">
                 {getWelcomeMessage()}
               </p>
             </div>

             {/* Suggestions */}
             <div className="relative mt-4">
               {showScrollButtons && (
                 <button
                   onClick={() => scrollSuggestions('left')}
                   className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
                   style={{ border: '1px solid #E5E7EB' }}
                 >
                   <ChevronLeft size={14} color="#666666" />
                 </button>
               )}
               <div
                 ref={suggestionsRef}
                 className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
               >
                {getSuggestions().map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="bg-white border border-[#ebebeb] rounded-[8px] px-4 py-2 text-[10px] font-medium text-[#1f1f1f] hover:bg-gray-50 whitespace-nowrap text-left flex-shrink-0"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
               </div>
               {showScrollButtons && (
                 <button
                   onClick={() => scrollSuggestions('right')}
                   className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50"
                   style={{ border: '1px solid #E5E7EB' }}
                 >
                   <ChevronRight size={14} color="#666666" />
                 </button>
               )}
             </div>
          </div>
        )}

        {/* Message List */}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.type === 'ai' && (
              <div className="flex flex-col items-start max-w-[80%]">
                 <div className="flex items-center gap-2 mb-1">
                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <ActiveIcon size={14} color="#4A5565" />
                   </div>
                   <span className="text-[12px] text-[#6a7282]">CareGuide AI</span>
                   {msg.fallbackType && (
                     <span className="text-[10px] text-orange-500">⚠️</span>
                   )}
                 </div>
                 <div className={`rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] p-4 ${
                   msg.fallbackType ? 'bg-orange-50 border border-orange-200' : 'bg-[#f0f4ff]'
                 }`}>
                   <p className="text-[14px] text-black leading-[22px] whitespace-pre-wrap">{msg.content}</p>
                 </div>
              </div>
            )}

            {msg.type === 'user' && (
              <div className="bg-[#00C8B4] text-white rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] p-4 max-w-[80%]">
                <p className="text-[14px] leading-[22px] whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-[#f0f4ff] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] p-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Positioned at the bottom with enough spacing from content */}
      <div className="absolute bottom-6 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[832px] z-20">
        <div className="bg-white rounded-[16px] border border-[#e0e0e0] p-[9px] shadow-sm w-full">
           {/* Top Row: Icon + Input + Send Button */}
           <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-2 relative h-[40px]">
               {/* Image icon only shows for nutrition agent */}
               {activeTab === 'nutrition' && (
                 <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-[#99A1AF] hover:bg-gray-100 flex-shrink-0"
                    disabled={isLoading}
                 >
                    <ImageIcon size={20} strokeWidth={1.66} />
                 </button>
               )}

               <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 h-full bg-transparent outline-none text-[14px] text-[#1E2939] placeholder-[rgba(30,41,57,0.5)]"
                  disabled={isLoading}
               />

               <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
                  style={{
                     background: message.trim() && !isLoading ? 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(159, 122, 234) 100%)' : '#F3F4F6'
                  }}
               >
                  <Send
                     size={14}
                     color={message.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF'}
                     style={{
                        transform: message.trim() && !isLoading ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                     }}
                  />
               </button>
           </form>

           {/* Bottom Row: Divider + Custom Info Dropdown */}
           <div className="border-t border-gray-100 pt-[4px] flex items-center justify-between h-[33.5px]">
              <div className="flex items-center gap-2">
                 <span className="text-[11px] text-gray-500">맞춤 정보:</span>
                 <div className="relative flex items-center gap-1 cursor-pointer">
                    <span className="text-[11px] text-[#00c8b4] font-medium">{selectedProfile}</span>
                    <ChevronDown size={12} color="#00C8B4" />
                    <select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={isLoading}
                    >
                      <option value="신장병 환우">신장병 환우</option>
                      <option value="일반인">일반인(간병인)</option>
                      <option value="연구자">연구자</option>
                    </select>
                 </div>
              </div>
              {sessionId && (
                <span className="text-[9px] text-gray-400">
                  Session: {sessionId.substring(0, 8)}...
                </span>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
