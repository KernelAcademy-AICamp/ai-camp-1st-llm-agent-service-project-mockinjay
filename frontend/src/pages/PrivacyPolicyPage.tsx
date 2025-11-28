import { MobileHeader } from '../components/MobileHeader';

export function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <MobileHeader title="개인정보처리방침" />
      <div className="flex-1 overflow-y-auto p-5 pb-24 lg:pb-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">개인정보처리방침</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">
              CareGuide는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」에 따라 이용자의 개인정보 보호 및 권익을 보호하고자 합니다.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">제1조 (개인정보의 처리목적)</h3>
            <p className="text-gray-700 mb-4">
              CareGuide는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <h3 className="text-xl font-semibold mt-6 mb-3">제2조 (개인정보의 처리 및 보유기간)</h3>
            <p className="text-gray-700 mb-4">
              이용자의 개인정보는 원칙적으로 개인정보의 처리목적이 달성되면 지체 없이 파기합니다.
            </p>
            {/* 추가 개인정보처리방침 내용 */}
          </div>
        </div>
      </div>
    </div>
  );
}

