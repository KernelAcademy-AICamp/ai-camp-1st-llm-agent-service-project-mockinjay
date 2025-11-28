import { Heart } from 'lucide-react';

export function Logo({ size = 'md', showTextOnMobile = true }: { size?: 'sm' | 'md' | 'lg'; showTextOnMobile?: boolean }) {
  const sizes = {
    sm: { icon: 16, text: 'text-lg', container: 'w-8 h-8' },
    md: { icon: 24, text: 'text-2xl', container: 'w-10 h-10' },
    lg: { icon: 32, text: 'text-3xl', container: 'w-14 h-14' }
  };
  
  return (
    <div className="flex items-center gap-3 group cursor-default">
      <div 
        className={`${sizes[size].container} flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
      >
        <Heart 
          size={sizes[size].icon} 
          className="text-white fill-white animate-pulse-slow"
        />
      </div>
      <span 
        className={`${sizes[size].text} font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 ${!showTextOnMobile ? 'hidden md:block' : ''}`}
      >
        CarePlus
      </span>
    </div>
  );
}
