import { Heart } from 'lucide-react';

interface LogoProps {
  /** 로고 크기 (sm: 작음, md: 중간, lg: 큼) */
  size?: 'sm' | 'md' | 'lg';
  /** 모바일에서 텍스트 표시 여부 */
  showTextOnMobile?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

const sizes = {
  sm: { icon: 16, text: 'text-lg', container: 28 },
  md: { icon: 24, text: 'text-2xl', container: 43 },
  lg: { icon: 32, text: 'text-3xl', container: 58 },
};

/**
 * CareGuide 로고 컴포넌트
 * CareGuide Logo Component
 *
 * 앱 전체에서 일관된 브랜딩을 위해 사용됩니다.
 * Used for consistent branding across the app.
 *
 * @example
 * ```tsx
 * <Logo size="md" />
 * <Logo size="sm" showTextOnMobile={false} />
 * ```
 */
export function Logo({
  size = 'md',
  showTextOnMobile = true,
  className = '',
  onClick,
}: LogoProps) {
  const { icon, text, container } = sizes[size];

  return (
    <div
      className={`flex items-center gap-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {/* 로고 아이콘 */}
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)',
          width: container,
          height: container,
        }}
      >
        <Heart size={icon} fill="white" color="white" />
      </div>

      {/* 로고 텍스트 */}
      <span
        className={`
          ${text} font-semibold
          ${showTextOnMobile ? '' : 'hidden sm:inline'}
        `}
        style={{
          fontFamily: 'Inter, sans-serif',
          color: 'var(--color-text-primary, #1F2937)',
        }}
      >
        CareGuide
      </span>
    </div>
  );
}

export default Logo;
