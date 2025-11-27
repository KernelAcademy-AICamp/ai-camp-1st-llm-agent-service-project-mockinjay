import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, FileText } from 'lucide-react';
import { MobileHeader } from '../components/layout/MobileHeader';

type TabType = 'faq' | 'contact' | 'guide';

const faqs = [
  {
    question: '신장병 환자가 주의해야 할 음식은 무엇인가요?',
    answer: '신장병 환자는 칼륨, 인, 나트륨이 높은 음식을 제한해야 합니다. 바나나, 토마토, 유제품, 가공식품 등은 섭취를 줄이는 것이 좋습니다.'
  },
  {
    question: '투석은 언제부터 시작해야 하나요?',
    answer: '일반적으로 사구체 여과율(GFR)이 15 이하로 떨어지거나 심각한 증상이 나타날 때 투석을 시작합니다. 정확한 시기는 담당 의사와 상담이 필요합니다.'
  },
  {
    question: 'AI 챗봇은 어떻게 활용하나요?',
    answer: 'AI 챗봇 페이지에서 의료/복지, 식이/영양, 연구/논문 중 원하는 카테고리를 선택한 후 질문을 입력하면 됩니다. 식이영양 탭에서는 음식 사진을 업로드하여 영양 분석도 받을 수 있습니다.'
  },
  {
    question: '퀴즈 레벨은 어떻게 올리나요?',
    answer: '각 레벨 퀴즈에서 10문제 중 8개 이상 맞추면 다음 레벨로 진급합니다. 레벨테스트부터 시작하여 1-5레벨까지 도전할 수 있습니다.'
  },
  {
    question: '커뮤니티에서 다른 환우와 소통하려면?',
    answer: '커뮤니티 페이지에서 게시글을 작성하고 댓글을 달 수 있습니다. 자유, 챌린지, 설문조사 등 다양한 카테고리로 정보를 나눌 수 있습니다.'
  }
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<TabType>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="도움말 및 지원" />

      {/* Tabs */}
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('faq')}
              className={`relative px-5 py-4 transition-all duration-200 text-[15px] ${
                activeTab === 'faq' ? 'text-[#00C8B4] font-bold' : 'text-[#999999] font-normal'
              }`}
            >
              자주 묻는 질문
              {activeTab === 'faq' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9F7AEA]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`relative px-5 py-4 transition-all duration-200 text-[15px] ${
                activeTab === 'contact' ? 'text-[#00C8B4] font-bold' : 'text-[#999999] font-normal'
              }`}
            >
              문의하기
              {activeTab === 'contact' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9F7AEA]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`relative px-5 py-4 transition-all duration-200 text-[15px] ${
                activeTab === 'guide' ? 'text-[#00C8B4] font-bold' : 'text-[#999999] font-normal'
              }`}
            >
              사용 가이드
              {activeTab === 'guide' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#9F7AEA]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 pb-24 lg:pb-6 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                    expandedFaq === index ? 'border-[#00C8B4]' : 'border-[#E5E7EB]'
                  } bg-white`}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[15px] text-[#1F2937] font-medium">
                      {faq.question}
                    </span>
                    <span
                      className={`text-2xl transition-transform text-[#00C8B4] ${
                        expandedFaq === index ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 border-t border-[#E5E7EB]">
                      <p className="pt-3 text-sm text-[#6B7280] leading-[1.6]">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white text-center">
                  <MessageCircle size={32} className="text-[#00C8B4] mx-auto mb-3" />
                  <h3 className="mb-2 text-[16px] text-[#1F2937]">채팅 상담</h3>
                  <p className="text-[13px] text-[#6B7280]">평일 9:00 - 18:00</p>
                </div>
                <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white text-center">
                  <Mail size={32} className="text-[#00C8B4] mx-auto mb-3" />
                  <h3 className="mb-2 text-[16px] text-[#1F2937]">이메일</h3>
                  <p className="text-[13px] text-[#6B7280]">support@careplus.com</p>
                </div>
                <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white text-center">
                  <Phone size={32} className="text-[#00C8B4] mx-auto mb-3" />
                  <h3 className="mb-2 text-[16px] text-[#1F2937]">전화</h3>
                  <p className="text-[13px] text-[#6B7280]">1588-0000</p>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white">
                <h3 className="mb-4 text-[18px] text-[#1F2937]">문의하기</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm text-[#374151] block mb-2">이름</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#374151] block mb-2">이메일</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#374151] block mb-2">제목</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#374151] block mb-2">문의 내용</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full p-4 rounded-xl border border-[#E0E0E0] outline-none focus:border-[#00C9B7] resize-none"
                      rows={6}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-[52px] rounded-xl bg-[#00C9B7] text-white font-medium hover:bg-[#00B3A3]"
                  >
                    문의 접수
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Guide Tab */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={24} className="text-[#00C8B4]" />
                  <h3 className="text-[18px] text-[#1F2937]">AI 챗봇 사용법</h3>
                </div>
                <ol className="space-y-2 text-sm text-[#6B7280] pl-5">
                  <li>1. AI 챗봇 메뉴를 선택합니다.</li>
                  <li>2. 상단에서 원하는 카테고리(의료/복지, 식이/영양, 연구/논문)를 선택합니다.</li>
                  <li>3. 질문을 입력창에 작성하고 전송 버튼을 클릭합니다.</li>
                  <li>4. 식이/영양 탭에서는 이미지 버튼으로 음식 사진을 업로드할 수 있습니다.</li>
                </ol>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={24} className="text-[#00C8B4]" />
                  <h3 className="text-[18px] text-[#1F2937]">식단 케어 기능</h3>
                </div>
                <ol className="space-y-2 text-sm text-[#6B7280] pl-5">
                  <li>1. 식단케어 메뉴에서 뉴트리코치 또는 식단로그를 선택합니다.</li>
                  <li>2. 뉴트리코치: AI 영양사와 대화하며 식단 조언을 받을 수 있습니다.</li>
                  <li>3. 식단로그: 매일의 식사를 기록하고 영양 목표를 관리합니다.</li>
                  <li>4. 목표 설정: 식단로그 상단에서 일일 영양 목표를 설정할 수 있습니다.</li>
                </ol>
              </div>

              <div className="p-6 rounded-xl border border-[#E5E7EB] bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={24} className="text-[#00C8B4]" />
                  <h3 className="text-[18px] text-[#1F2937]">퀴즈 미션</h3>
                </div>
                <ol className="space-y-2 text-sm text-[#6B7280] pl-5">
                  <li>1. 레벨테스트로 시작하여 자신의 수준을 확인합니다.</li>
                  <li>2. 각 레벨(1-5레벨)은 10문제로 구성되어 있습니다.</li>
                  <li>3. 8문제 이상 맞추면 다음 레벨로 진급합니다.</li>
                  <li>4. 퀴즈를 통해 신장병 관련 지식을 쌓고 지식 레벨을 올릴 수 있습니다.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
