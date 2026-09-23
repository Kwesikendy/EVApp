import React from 'react';

interface XChargeLogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * ChargeLink GH official brand logo component (web)
 * Replaces the legacy XCHARGE cyan blade logo with the ChargeLink GH green identity.
 * Component name intentionally preserved to avoid cascading refactor.
 */
export const XChargeLogo: React.FC<XChargeLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  const markSizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const fontSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* ChargeLink GH "C + plug + leaf" glyph */}
      <div className={`relative flex items-center justify-center shrink-0 ${markSizeMap[size]}`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="clLeafWeb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="clCWeb" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
          </defs>

          {/* C-shaped arc */}
          <path
            d="M 68 18 A 42 42 0 1 0 68 102 L 68 86 A 26 26 0 1 1 68 34 Z"
            fill="url(#clCWeb)"
          />

          {/* EV plug body */}
          <rect x="60" y="50" width="28" height="18" rx="5" fill="url(#clLeafWeb)" />
          <rect x="88" y="55" width="10" height="3" rx="1.5" fill="url(#clLeafWeb)" />
          <rect x="88" y="62" width="10" height="3" rx="1.5" fill="url(#clLeafWeb)" />
          {/* Lightning bolt */}
          <path d="M72 54 L69 61 L73 61 L70 68 L77 60 L73 60 Z" fill="#ffffff" />

          {/* Leaf swoosh */}
          <path
            d="M 40 82 Q 58 70 82 76 Q 64 86 46 90 Z"
            fill="url(#clLeafWeb)"
            opacity="0.9"
          />
        </svg>
      </div>

      {variant === 'full' && (
        <div className={`flex items-center font-extrabold font-sans leading-none ${fontSizeMap[size]}`}>
          <span className="text-[#22c55e]">Charge</span>
          <span className="text-white">Link</span>
          <span className="text-[#4ade80] ml-1">GH</span>
        </div>
      )}
    </div>
  );
};
