import { MobileHeader } from '../components/MobileHeader';

export function TermsAndConditionsPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="이용약관" />
      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">이용약관</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              본 이용약관은 CareGuide 서비스의 이용과 관련된 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">제1조 (목적)</h3>
            <p className="text-gray-700 mb-4">
              이 약관은 CareGuide가 제공하는 서비스의 이용조건 및 절차, 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">제2조 (정의)</h3>
            <p className="text-gray-700 mb-4">
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            {/* 추가 약관 내용 */}
          </div>
        </div>
      </div>
    </div>
  );
}

