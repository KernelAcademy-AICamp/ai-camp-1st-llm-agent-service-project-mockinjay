import { Heart } from 'lucide-react';

export function Logo({ size = 'md', showTextOnMobile = true }: { size?: 'sm' | 'md' | 'lg'; showTextOnMobile?: boolean }) {
  const sizes = {
    sm: { icon: 16, text: 'text-lg' },
    md: { icon: 24, text: 'text-2xl' },
    lg: { icon: 32, text: 'text-3xl' }
  };
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="flex items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #00C8B4 0%, #9F7AEA 100%)',
          width: sizes[size].icon * 1.8,
          height: sizes[size].icon * 1.8
        }}
      >
        <Heart 
          size={sizes[size].icon} 
          fill="white" 
          color="white"
        />
      </div>
      {showTextOnMobile && (
        <span 
          className={`${sizes[size].text} font-semibold`}
          style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)' }}
        >
          CarePlus
        </span>
      )}
    </div>
  );
}