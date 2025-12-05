import React, { useState, useCallback, useMemo } from 'react';
import { MessageCircle, Mail, Phone, FileText, ChevronDown } from 'lucide-react';
import { MobileHeader } from '../components/layout/MobileHeader';

type TabType = 'faq' | 'contact' | 'guide';

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  steps: string[];
}

const faqs: FAQ[] = [
  {
    id: 'ckd-foods',
    question: '신장병 환자가 주의해야 할 음식은 무엇인가요?',
    answer: '신장병 환자는 칼륨, 인, 나트륨이 높은 음식을 제한해야 합니다. 바나나, 토마토, 유제품, 가공식품 등은 섭취를 줄이는 것이 좋습니다.'
  },
  {
    id: 'dialysis-timing',
    question: '투석은 언제부터 시작해야 하나요?',
    answer: '일반적으로 사구체 여과율(GFR)이 15 이하로 떨어지거나 심각한 증상이 나타날 때 투석을 시작합니다. 정확한 시기는 담당 의사와 상담이 필요합니다.'
  },
  {
    id: 'ai-chatbot-usage',
    question: 'AI 챗봇은 어떻게 활용하나요?',
    answer: 'AI 챗봇 페이지에서 의료/복지, 식이/영양, 연구/논문 중 원하는 카테고리를 선택한 후 질문을 입력하면 됩니다. 식이영양 탭에서는 음식 사진을 업로드하여 영양 분석도 받을 수 있습니다.'
  },
  {
    id: 'quiz-level-up',
    question: '퀴즈 레벨은 어떻게 올리나요?',
    answer: '각 레벨 퀴즈에서 10문제 중 8개 이상 맞추면 다음 레벨로 진급합니다. 레벨테스트부터 시작하여 1-5레벨까지 도전할 수 있습니다.'
  },
  {
    id: 'community-connect',
    question: '커뮤니티에서 다른 환우와 소통하려면?',
    answer: '커뮤니티 페이지에서 게시글을 작성하고 댓글을 달 수 있습니다. 자유, 챌린지, 설문조사 등 다양한 카테고리로 정보를 나눌 수 있습니다.'
  }
];

const guideData: GuideSection[] = [
  {
    id: 'chatbot',
    title: 'AI 챗봇 사용법',
    icon: FileText,
    steps: [
      '1. AI 챗봇 메뉴를 선택합니다.',
      '2. 상단에서 원하는 카테고리(의료/복지, 식이/영양, 연구/논문)를 선택합니다.',
      '3. 질문을 입력창에 작성하고 전송 버튼을 클릭합니다.',
      '4. 식이/영양 탭에서는 이미지 버튼으로 음식 사진을 업로드할 수 있습니다.'
    ]
  },
  {
    id: 'diet',
    title: '식단 케어 기능',
    icon: FileText,
    steps: [
      '1. 식단케어 메뉴에서 뉴트리코치 또는 식단로그를 선택합니다.',
      '2. 뉴트리코치: AI 영양사와 대화하며 식단 조언을 받을 수 있습니다.',
      '3. 식단로그: 매일의 식사를 기록하고 영양 목표를 관리합니다.',
      '4. 목표 설정: 식단로그 상단에서 일일 영양 목표를 설정할 수 있습니다.'
    ]
  },
  {
    id: 'quiz',
    title: '퀴즈 미션',
    icon: FileText,
    steps: [
      '1. 레벨테스트로 시작하여 자신의 수준을 확인합니다.',
      '2. 각 레벨(1-5레벨)은 10문제로 구성되어 있습니다.',
      '3. 8문제 이상 맞추면 다음 레벨로 진급합니다.',
      '4. 퀴즈를 통해 신장병 관련 지식을 쌓고 지식 레벨을 올릴 수 있습니다.'
    ]
  }
];

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Tab configuration
const tabs: { key: TabType; label: string }[] = [
  { key: 'faq', label: '자주 묻는 질문' },
  { key: 'contact', label: '문의하기' },
  { key: 'guide', label: '사용 가이드' }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFaqToggle = useCallback((faqId: string) => {
    setExpandedFaq(prev => prev === faqId ? null : faqId);
  }, []);

  const handleFormChange = useCallback((field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  }, []);

  const contactMethods = useMemo(() => [
    { icon: MessageCircle, title: '채팅 상담', info: '평일 9:00 - 18:00' },
    { icon: Mail, title: '이메일', info: 'support@careplus.com' },
    { icon: Phone, title: '전화', info: '1588-0000' }
  ], []);

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="도움말 및 지원" />

      {/* Tabs */}
      <nav className="border-b border-gray-200 bg-white" role="tablist" aria-label="도움말 탭">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 sm:gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`${tab.key}-panel`}
                id={`${tab.key}-tab`}
                className={`relative px-3 sm:px-5 py-4 transition-all duration-200 text-sm sm:text-[15px] touch-target ${
                  activeTab === tab.key ? 'text-primary font-bold' : 'text-gray-400 font-normal'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div
              id="faq-panel"
              role="tabpanel"
              aria-labelledby="faq-tab"
              className="space-y-3"
            >
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    expandedFaq === faq.id ? 'border-primary' : 'border-gray-200'
                  } bg-white`}
                >
                  <button
                    onClick={() => handleFaqToggle(faq.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors touch-target"
                    aria-expanded={expandedFaq === faq.id}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <span className="text-[15px] text-gray-900 font-medium pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-primary transition-transform duration-200 flex-shrink-0 ${
                        expandedFaq === faq.id ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {expandedFaq === faq.id && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className="px-4 pb-4 border-t border-gray-200 animate-slide-down"
                    >
                      <p className="pt-3 text-sm text-gray-500 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div
              id="contact-panel"
              role="tabpanel"
              aria-labelledby="contact-tab"
              className="space-y-6"
            >
              {/* Contact Methods */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {contactMethods.map((method) => {
                  const IconComponent = method.icon;
                  return (
                    <div key={method.title} className="p-6 rounded-xl border border-gray-200 bg-white text-center hover:border-primary transition-colors">
                      <IconComponent size={32} className="text-primary mx-auto mb-3" aria-hidden="true" />
                      <h3 className="mb-2 text-base font-medium text-gray-900">{method.title}</h3>
                      <p className="text-sm text-gray-500">{method.info}</p>
                    </div>
                  );
                })}
              </div>

              {/* Contact Form */}
              <div className="p-6 rounded-xl border border-gray-200 bg-white">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">문의하기</h3>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="contact-name" className="text-sm font-medium text-gray-700 block mb-2">이름</label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="input-field"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-sm font-medium text-gray-700 block mb-2">이메일</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="input-field"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="text-sm font-medium text-gray-700 block mb-2">제목</label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleFormChange('subject', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="text-sm font-medium text-gray-700 block mb-2">문의 내용</label>
                    <textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => handleFormChange('message', e.target.value)}
                      className="input-field resize-none"
                      rows={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full h-[52px] touch-target"
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="loading-spinner w-5 h-5" />
                        처리중...
                      </span>
                    ) : (
                      '문의 접수'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div
              id="guide-panel"
              role="tabpanel"
              aria-labelledby="guide-tab"
              className="space-y-6"
            >
              {guideData.map((guide) => {
                const IconComponent = guide.icon;
                return (
                  <article key={guide.id} className="p-6 rounded-xl border border-gray-200 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent size={24} className="text-primary" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-gray-900">{guide.title}</h3>
                    </div>
                    <ol className="space-y-2 text-sm text-gray-500 pl-5" aria-label={`${guide.title} 단계`}>
                      {guide.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
