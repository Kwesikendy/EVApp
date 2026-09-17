import React, { useState } from 'react';

interface XChargeLogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const XChargeLogo: React.FC<XChargeLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  // Height mappings based on size
  const heightMap = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  const markSizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* 1. Try loading uploaded xcharge.png image */}
      {!imgFailed ? (
        <img
          src="/xcharge.png"
          alt="XCHARGE Logo"
          className={`${heightMap[size]} w-auto object-contain drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        /* 2. Seamless Vector SVG Fallback replicating the uploaded XCHARGE blade design */
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 100 100"
            className={`${markSizeMap[size]} shrink-0`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="xchargeCyanGrad" x1="10%" y1="90%" x2="90%" y2="10%">
                <stop offset="0%" stopColor="#00d2ff" />
                <stop offset="60%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#33f3ff" />
              </linearGradient>
              <linearGradient id="xchargeWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
              <filter id="xchargeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Top-Left White Wing */}
            <path
              d="M 32 24 L 46 24 C 49 24 51 27 49 30 L 44 38 C 42 41 38 41 36 38 L 30 29 C 29 27 30 24 32 24 Z"
              fill="url(#xchargeWhiteGrad)"
              opacity="0.95"
            />

            {/* Bottom-Right White Wing */}
            <path
              d="M 52 48 L 57 44 C 59 42 63 43 65 46 L 70 54 C 71 56 70 59 67 59 L 58 59 C 55 59 53 56 55 53 Z"
              fill="url(#xchargeWhiteGrad)"
              opacity="0.9"
            />

            {/* Main Cyan Diagonal Blade */}
            <path
              d="M 28 64 L 42 46 C 44 43 47 41 50 39 L 68 25 C 71 23 74 25 73 28 L 68 34 C 66 36 63 38 60 41 L 44 60 C 42 63 38 65 34 66 L 27 67 C 25 67 25 65 28 64 Z"
              fill="url(#xchargeCyanGrad)"
              filter="url(#xchargeGlow)"
            />
          </svg>

          {variant === 'full' && (
            <div className="flex items-center tracking-widest font-bold font-sans">
              <span className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">X</span>
              <span className="text-white tracking-[0.2em] ml-0.5">CHARGE</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
