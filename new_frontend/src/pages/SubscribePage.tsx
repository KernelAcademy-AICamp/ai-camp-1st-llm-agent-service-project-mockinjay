/**
 * SubscribePage - Subscription plans page
 * 구독 페이지
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  icon: typeof Star;
  recommended?: boolean;
  buttonText: string;
}

const SubscribePage: React.FC = () => {
  const navigate = useNavigate();

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '₩0',
      period: '/ 월',
      description: '기본 기능을 무료로 이용하세요',
      icon: Star,
      buttonText: '현재 플랜',
      features: [
        { text: 'AI 채팅 (월 50회)', included: true },
        { text: '커뮤니티 접근', included: true },
        { text: '기본 퀴즈', included: true },
        { text: '연구 트렌드 열람', included: true },
        { text: '고급 영양 분석', included: false },
        { text: '무제한 AI 상담', included: false },
        { text: '광고 제거', included: false },
      ],
    },
    {
      name: 'Premium',
      price: '₩9,900',
      period: '/ 월',
      description: '더 많은 기능을 활용하세요',
      icon: Zap,
      recommended: true,
      buttonText: '업그레이드',
      features: [
        { text: 'AI 채팅 (무제한)', included: true },
        { text: '커뮤니티 접근', included: true },
        { text: '모든 퀴즈 접근', included: true },
        { text: '연구 트렌드 열람', included: true },
        { text: '고급 영양 분석', included: true },
        { text: '무제한 AI 상담', included: true },
        { text: '광고 제거', included: true },
      ],
    },
    {
      name: 'Pro',
      price: '₩19,900',
      period: '/ 월',
      description: '전문가를 위한 최고의 서비스',
      icon: Crown,
      buttonText: '업그레이드',
      features: [
        { text: 'Premium 모든 기능', included: true },
        { text: '1:1 전문가 상담', included: true },
        { text: '맞춤형 건강 리포트', included: true },
        { text: '우선 고객 지원', included: true },
        { text: 'API 접근권한', included: true },
        { text: '데이터 내보내기', included: true },
        { text: '가족 계정 추가', included: true },
      ],
    },
  ];

  const PlanCard = ({ plan }: { plan: Plan }) => {
    const Icon = plan.icon;
    return (
      <div
        className={`relative bg-white rounded-xl shadow-sm border p-6 ${
          plan.recommended
            ? 'border-primary-500 ring-2 ring-primary-500'
            : 'border-gray-200'
        }`}
      >
        {plan.recommended && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              추천
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <div
            className={`inline-flex p-3 rounded-full mb-4 ${
              plan.recommended ? 'bg-primary-100' : 'bg-gray-100'
            }`}
          >
            <Icon
              size={24}
              className={plan.recommended ? 'text-primary-600' : 'text-gray-600'}
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
          <div className="mt-4">
            <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
            <span className="text-gray-500">{plan.period}</span>
          </div>
        </div>

        <ul className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                  feature.included
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Check size={12} />
              </div>
              <span
                className={`text-sm ${
                  feature.included ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>

        <button
          className={`w-full py-3 px-4 rounded-lg font-medium ${
            plan.name === 'Free'
              ? 'bg-gray-100 text-gray-600 cursor-default'
              : plan.recommended
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
          disabled={plan.name === 'Free'}
        >
          {plan.buttonText}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">구독 플랜</h1>
          <p className="text-gray-500">나에게 맞는 플랜을 선택하세요</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <PlanCard key={index} plan={plan} />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">자주 묻는 질문</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">언제든지 취소할 수 있나요?</h3>
            <p className="text-sm text-gray-500 mt-1">
              네, 언제든지 구독을 취소할 수 있습니다. 취소 후에도 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">환불이 가능한가요?</h3>
            <p className="text-sm text-gray-500 mt-1">
              결제 후 7일 이내에 요청하시면 전액 환불해 드립니다.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">플랜 변경은 어떻게 하나요?</h3>
            <p className="text-sm text-gray-500 mt-1">
              언제든지 더 높은 플랜으로 업그레이드할 수 있습니다. 다운그레이드는 현재 결제 기간이 끝난 후 적용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscribePage;
