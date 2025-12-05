/**
 * Legal Pages - Terms of Service, Privacy Policy, Cookie Policy
 * 법률 페이지 - 이용약관, 개인정보처리방침, 쿠키 정책
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Shield, Cookie } from 'lucide-react';

// Common layout for legal pages
const LegalPageLayout: React.FC<{
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="prose prose-gray max-w-none">{children}</div>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-500 text-center mt-6">
        최종 업데이트: 2024년 1월 1일
      </p>
    </div>
  );
};

/**
 * Terms of Service Page
 */
export const TermsConditionsPage: React.FC = () => {
  return (
    <LegalPageLayout title="이용약관" icon={FileText}>
      <h2>제1조 (목적)</h2>
      <p>
        이 약관은 CareGuide (이하 "회사")가 제공하는 서비스의 이용조건 및 절차,
        회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
      </p>

      <h2>제2조 (정의)</h2>
      <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
      <ul>
        <li>"서비스"라 함은 회사가 제공하는 건강관리 및 AI 상담 서비스를 말합니다.</li>
        <li>"이용자"라 함은 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
        <li>"회원"이라 함은 서비스에 가입하여 이용계약을 체결한 자를 말합니다.</li>
      </ul>

      <h2>제3조 (서비스의 내용)</h2>
      <p>회사가 제공하는 서비스의 내용은 다음과 같습니다:</p>
      <ul>
        <li>AI 기반 건강 상담 서비스</li>
        <li>영양 관리 및 식단 분석 서비스</li>
        <li>건강 정보 제공 서비스</li>
        <li>커뮤니티 서비스</li>
        <li>건강 관련 퀴즈 및 교육 서비스</li>
      </ul>

      <h2>제4조 (서비스 이용)</h2>
      <p>
        서비스 이용시간은 회사의 업무상 또는 기술상 특별한 지장이 없는 한
        연중무휴, 1일 24시간을 원칙으로 합니다.
      </p>

      <h2>제5조 (이용자의 의무)</h2>
      <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
      <ul>
        <li>타인의 정보 도용</li>
        <li>서비스에 게시된 정보의 무단 변경</li>
        <li>회사가 정한 정보 이외의 정보 송신 또는 게시</li>
        <li>회사 및 제3자의 저작권 등 지적재산권에 대한 침해</li>
        <li>회사 및 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
      </ul>

      <h2>제6조 (면책조항)</h2>
      <p>
        본 서비스에서 제공하는 건강 정보는 참고용이며, 전문적인 의료 조언을 대체할 수 없습니다.
        건강 문제에 대해서는 반드시 의료 전문가와 상담하시기 바랍니다.
      </p>

      <h2>제7조 (분쟁 해결)</h2>
      <p>
        서비스 이용으로 발생한 분쟁에 대해 회사와 이용자는 상호 협의하여 해결하며,
        협의가 이루어지지 않을 경우 관할 법원에서 해결합니다.
      </p>
    </LegalPageLayout>
  );
};

/**
 * Privacy Policy Page
 */
export const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalPageLayout title="개인정보처리방침" icon={Shield}>
      <h2>1. 개인정보의 수집 및 이용 목적</h2>
      <p>
        CareGuide는 다음의 목적을 위하여 개인정보를 처리합니다:
      </p>
      <ul>
        <li>회원 가입 및 관리</li>
        <li>서비스 제공 및 개선</li>
        <li>개인 맞춤형 건강 정보 제공</li>
        <li>고객 문의 응대</li>
        <li>마케팅 및 광고 (선택적 동의 시)</li>
      </ul>

      <h2>2. 수집하는 개인정보 항목</h2>
      <p>회사는 다음과 같은 개인정보를 수집합니다:</p>
      <ul>
        <li>필수항목: 이메일, 비밀번호, 닉네임</li>
        <li>선택항목: 이름, 생년월일, 건강 정보, 프로필 이미지</li>
        <li>자동수집항목: IP 주소, 쿠키, 접속 로그, 서비스 이용 기록</li>
      </ul>

      <h2>3. 개인정보의 보유 및 이용 기간</h2>
      <p>
        회원의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.
        단, 관계 법령에 의해 보존이 필요한 경우에는 일정 기간 보관합니다:
      </p>
      <ul>
        <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
        <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
        <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년</li>
        <li>표시/광고에 관한 기록: 6개월</li>
      </ul>

      <h2>4. 개인정보의 제3자 제공</h2>
      <p>
        회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
        다만, 다음의 경우에는 예외로 합니다:
      </p>
      <ul>
        <li>이용자가 사전에 동의한 경우</li>
        <li>법령의 규정에 의한 경우</li>
        <li>수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우</li>
      </ul>

      <h2>5. 개인정보의 안전성 확보 조치</h2>
      <p>회사는 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다:</p>
      <ul>
        <li>개인정보의 암호화</li>
        <li>해킹 등에 대비한 기술적 대책</li>
        <li>개인정보에 대한 접근 제한</li>
        <li>개인정보 취급 직원의 최소화 및 교육</li>
      </ul>

      <h2>6. 정보주체의 권리</h2>
      <p>이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
      <ul>
        <li>개인정보 열람 요구</li>
        <li>오류 등이 있을 경우 정정 요구</li>
        <li>삭제 요구</li>
        <li>처리정지 요구</li>
      </ul>

      <h2>7. 개인정보 보호책임자</h2>
      <p>
        개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 정보주체의
        불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
      </p>
      <p>
        이메일: privacy@careguide.com<br />
        전화: 02-0000-0000
      </p>
    </LegalPageLayout>
  );
};

/**
 * Cookie Policy Page
 */
export const CookieConsentPage: React.FC = () => {
  return (
    <LegalPageLayout title="쿠키 정책" icon={Cookie}>
      <h2>쿠키란?</h2>
      <p>
        쿠키는 웹사이트를 방문할 때 브라우저에 저장되는 작은 텍스트 파일입니다.
        쿠키는 웹사이트가 사용자를 기억하고 더 나은 경험을 제공하는 데 도움을 줍니다.
      </p>

      <h2>사용하는 쿠키의 종류</h2>

      <h3>필수 쿠키</h3>
      <p>
        웹사이트의 기본 기능을 활성화하는 데 필요한 쿠키입니다.
        이 쿠키 없이는 로그인, 장바구니 등 기본 서비스를 이용할 수 없습니다.
      </p>

      <h3>기능 쿠키</h3>
      <p>
        사용자의 선호도(언어, 지역 등)를 기억하여 맞춤형 경험을 제공하는 쿠키입니다.
      </p>

      <h3>분석 쿠키</h3>
      <p>
        웹사이트 사용 방식에 대한 정보를 수집하여 서비스 개선에 활용하는 쿠키입니다.
        이 정보는 익명으로 수집되며 개인을 식별하지 않습니다.
      </p>

      <h3>마케팅 쿠키</h3>
      <p>
        관심사에 맞는 광고를 제공하기 위해 사용되는 쿠키입니다.
        이 쿠키는 사용자의 동의 시에만 활성화됩니다.
      </p>

      <h2>쿠키 관리 방법</h2>
      <p>
        대부분의 웹 브라우저에서는 쿠키를 관리할 수 있습니다.
        브라우저 설정에서 쿠키를 삭제하거나 차단할 수 있습니다:
      </p>
      <ul>
        <li>Chrome: 설정 &gt; 개인정보 및 보안 &gt; 쿠키 및 기타 사이트 데이터</li>
        <li>Firefox: 설정 &gt; 개인 정보 및 보안 &gt; 쿠키 및 사이트 데이터</li>
        <li>Safari: 환경설정 &gt; 개인 정보 보호 &gt; 쿠키 및 웹사이트 데이터</li>
        <li>Edge: 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키</li>
      </ul>

      <h2>쿠키 차단 시 영향</h2>
      <p>
        필수 쿠키를 차단하면 일부 서비스 기능이 제대로 작동하지 않을 수 있습니다.
        분석 및 마케팅 쿠키를 차단해도 서비스 이용에는 영향이 없습니다.
      </p>

      <h2>쿠키 설정 변경</h2>
      <p>
        언제든지 쿠키 설정을 변경할 수 있습니다.
        페이지 하단의 "쿠키 설정" 링크를 클릭하여 설정을 관리하세요.
      </p>

      <h2>문의</h2>
      <p>
        쿠키 정책에 대한 질문이 있으시면 privacy@careguide.com으로 문의해 주세요.
      </p>
    </LegalPageLayout>
  );
};

export default { TermsConditionsPage, PrivacyPolicyPage, CookieConsentPage };
