import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

/**
 * Authentic MTN MoMo Logo Component
 * Based on the official Ghana MTN Mobile Money identity
 */
export const MtnMomoLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  if (size === 'icon') {
    return (
      <div className={`w-8 h-8 rounded-xl bg-[#FFCC00] overflow-hidden flex items-center justify-center p-0.5 shadow-sm border border-yellow-400/40 shrink-0 ${className}`}>
        <img
          src="/logos/mtn-momo.svg"
          alt="MTN MoMo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback inline SVG if needed
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const dimensions = {
    sm: 'h-6 w-auto max-w-[80px]',
    md: 'h-9 w-auto max-w-[110px]',
    lg: 'h-12 w-auto max-w-[140px]',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-[#FFCC00] p-1.5 shadow-sm border border-yellow-400/50 shrink-0 ${className}`}>
      <img
        src="/logos/mtn-momo.svg"
        alt="MTN MoMo"
        className={`${dimensions} object-contain`}
      />
    </div>
  );
};

/**
 * Authentic Telecel Ghana Logo Component
 * Matches the official Telecel Red Badge with white circular 't' glyph and 'telecel' wordmark
 */
export const TelecelLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  if (size === 'icon') {
    return (
      <div className={`w-8 h-8 rounded-xl bg-[#E2001A] overflow-hidden flex items-center justify-center p-1 shadow-sm border border-red-500/40 shrink-0 ${className}`}>
        <img
          src="/logos/telecel.svg"
          alt="Telecel Cash"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const dimensions = {
    sm: 'h-6 w-auto max-w-[80px]',
    md: 'h-9 w-auto max-w-[110px]',
    lg: 'h-12 w-auto max-w-[140px]',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-[#E2001A] p-1.5 shadow-sm border border-red-600/40 shrink-0 ${className}`}>
      <img
        src="/logos/telecel.svg"
        alt="Telecel Cash"
        className={`${dimensions} object-contain`}
      />
    </div>
  );
};

/**
 * Authentic Mastercard Logo Component
 * Intersecting Red & Yellow/Amber circles with lowercase 'mastercard' typography
 */
export const MastercardLogo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  if (size === 'icon') {
    return (
      <div className={`w-8 h-8 rounded-xl bg-[#141820] overflow-hidden flex items-center justify-center p-1 border border-white/10 shrink-0 ${className}`}>
        <img
          src="/logos/mastercard.svg"
          alt="Mastercard"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const dimensions = {
    sm: 'h-6 w-auto max-w-[70px]',
    md: 'h-9 w-auto max-w-[95px]',
    lg: 'h-12 w-auto max-w-[120px]',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center rounded-lg bg-[#141820] px-2 py-1 shadow-sm border border-white/10 shrink-0 ${className}`}>
      <img
        src="/logos/mastercard.svg"
        alt="Mastercard"
        className={`${dimensions} object-contain`}
      />
    </div>
  );
};
