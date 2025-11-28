import React from 'react';
import biLogoPng from '../assets/bi_logo_careplus.png';

export function Logo({ size = 'md', showTextOnMobile = true }: { size?: 'sm' | 'md' | 'lg'; showTextOnMobile?: boolean }) {
  const sizes = {
    sm: { width: 38.4, height: 38.4, text: 'text-lg' },
    md: { width: 48, height: 48, text: 'text-2xl' },
    lg: { width: 57.6, height: 57.6, text: 'text-3xl' }
  };

  return (
    <div className="flex items-center">
      <img
        src={biLogoPng}
        alt="CarePlus Logo"
        style={{
          width: sizes[size].width,
          height: sizes[size].height
        }}
      />
      {showTextOnMobile && (
        <span
          className={`${sizes[size].text} font-semibold`}
          style={{
            fontFamily: 'Inter, sans-serif',
            background: 'linear-gradient(135deg, rgb(0, 200, 180) 0%, rgb(110, 100, 210) 55%, rgb(159, 122, 234) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          CarePlus
        </span>
      )}
    </div>
  );
}