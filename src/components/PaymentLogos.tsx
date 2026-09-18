import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

/**
 * Authentic MTN MoMo Web Vector Logo (Ghana)
 * Official MTN Mobile Money dual-badge identity
 */
export const MtnMomoLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dims = {
    icon: 'w-8 h-8',
    sm: 'w-12 h-8',
    md: 'w-16 h-10',
    lg: 'w-24 h-14',
  }[size];

  if (size === 'icon') {
    return (
      <div className={`rounded-xl bg-[#FFCC00] overflow-hidden flex items-center justify-center p-1 shadow-sm border border-yellow-400/50 shrink-0 ${dims} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <ellipse cx="50" cy="50" rx="42" ry="26" fill="#004F71" />
          <text x="50" y="58" fontWeight="bold" fontSize="24" fill="#FFC400" textAnchor="middle" fontFamily="sans-serif">
            MTN
          </text>
          <rect x="47" y="60" width="6" height="3" fill="#E2001A" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-xl bg-[#FFCC00] p-1 shadow-md border border-yellow-400/60 shrink-0 ${dims} ${className}`}>
      <svg viewBox="0 0 500 340" className="w-full h-full" fill="none">
        {/* Dual yellow panels */}
        <rect x="15" y="15" width="220" height="230" rx="20" fill="#FFC400" />
        <rect x="250" y="15" width="235" height="230" rx="20" fill="#FFC400" />

        {/* Left Side: MTN Dark Cyan/Blue Oval */}
        <ellipse cx="125" cy="130" rx="92" ry="54" fill="#004F71" />
        <text x="125" y="148" fontWeight="bold" fontSize="52" fill="#FFC400" textAnchor="middle" fontFamily="sans-serif">
          MTN
        </text>
        <rect x="122" y="153" width="12" height="7" fill="#E2001A" />

        {/* Right Side: Phone & Flying Cash */}
        <g transform="translate(260, 20)">
          <rect x="75" y="60" width="85" height="150" rx="16" fill="#000000" />
          <rect x="80" y="65" width="75" height="140" rx="12" fill="#FFFFFF" />
          <rect x="105" y="73" width="25" height="4" rx="2" fill="#000000" />

          {/* Keypad dots */}
          <g fill="#000000">
            <rect x="90" y="145" width="14" height="10" rx="2" />
            <rect x="110" y="145" width="14" height="10" rx="2" />
            <rect x="130" y="145" width="14" height="10" rx="2" />
            <rect x="90" y="160" width="14" height="10" rx="2" />
            <rect x="110" y="160" width="14" height="10" rx="2" />
            <rect x="130" y="160" width="14" height="10" rx="2" />
            <rect x="90" y="175" width="14" height="10" rx="2" />
            <rect x="110" y="175" width="14" height="10" rx="2" />
            <rect x="130" y="175" width="14" height="10" rx="2" />
          </g>

          {/* Money note flying */}
          <path d="M 40 30 L 115 5 L 145 90 L 68 115 Z" fill="#008BB4" />
          <path d="M 48 35 L 110 14 L 138 84 L 72 105 Z" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <text x="92" y="65" fontWeight="bold" fontSize="24" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
            GH₵
          </text>
          <path d="M 115 5 L 145 90 L 120 70 Z" fill="#E2001A" />
        </g>

        {/* Wordmark */}
        <text x="250" y="310" fontWeight="bold" fontSize="46" fill="#004F71" textAnchor="middle" fontFamily="sans-serif">
          MTN MoMo
        </text>
      </svg>
    </div>
  );
};

/**
 * Authentic Telecel Ghana Web Vector Logo
 * Official Telecel Red badge with circular 't' and wordmark
 */
export const TelecelLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dims = {
    icon: 'w-8 h-8',
    sm: 'w-10 h-8',
    md: 'w-14 h-10',
    lg: 'w-20 h-14',
  }[size];

  if (size === 'icon') {
    return (
      <div className={`rounded-xl bg-[#E2001A] overflow-hidden flex items-center justify-center p-1 shadow-sm border border-red-500/40 shrink-0 ${dims} ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
          <circle cx="50" cy="50" r="38" fill="#FFFFFF" />
          <path
            d="M 45 32 C 45 28 48 25 52 25 L 56 25 C 60 25 63 28 63 32 L 63 42 L 72 42 C 75 42 77 44 77 47 L 77 53 C 77 56 75 58 72 58 L 63 58 L 63 74 C 63 79 66 82 71 82 C 74 82 76 81 78 80 L 78 86 C 76 88 72 90 67 90 C 56 90 50 83 50 72 L 50 58 L 42 58 C 39 58 37 56 37 53 L 37 47 C 37 44 39 42 42 42 L 50 42 Z"
            fill="#E2001A"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-xl bg-[#E2001A] p-1 shadow-md border border-red-500/50 shrink-0 ${dims} ${className}`}>
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
        <rect width="400" height="400" rx="40" fill="#E2001A" />
        <circle cx="200" cy="165" r="72" fill="#FFFFFF" />
        <path
          d="M 186 122 C 186 116 190 112 196 112 L 202 112 C 208 112 212 116 212 122 L 212 135 L 226 135 C 230 135 233 138 233 142 L 233 150 C 233 154 230 157 226 157 L 212 157 L 212 182 C 212 190 216 194 223 194 C 227 194 230 193 233 191 C 236 189 240 191 240 195 L 240 205 C 240 208 238 211 234 213 C 228 216 220 217 212 217 C 195 217 186 206 186 189 L 186 157 L 174 157 C 170 157 167 154 167 150 L 167 142 C 167 138 170 135 174 135 L 186 135 Z"
          fill="#E2001A"
        />
        <text x="200" y="300" fontWeight="bold" fontSize="64" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          telecel
        </text>
      </svg>
    </div>
  );
};

/**
 * Authentic Mastercard Web Vector Logo
 */
export const MastercardLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const dims = {
    icon: 'w-8 h-8',
    sm: 'w-12 h-8',
    md: 'w-16 h-10',
    lg: 'w-24 h-14',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center rounded-xl bg-[#0a0e17] p-1 shadow-md border border-white/10 shrink-0 ${dims} ${className}`}>
      <svg viewBox="0 0 500 320" className="w-full h-full" fill="none">
        <defs>
          <clipPath id="mc-web-clip">
            <circle cx="190" cy="130" r="95" />
          </clipPath>
        </defs>
        <circle cx="190" cy="130" r="95" fill="#EB001B" />
        <circle cx="310" cy="130" r="95" fill="#F79E1B" />
        <circle cx="310" cy="130" r="95" clipPath="url(#mc-web-clip)" fill="#FF5F00" />
        <text x="250" y="278" fontWeight="600" fontSize="46" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
          mastercard
        </text>
      </svg>
    </div>
  );
};
