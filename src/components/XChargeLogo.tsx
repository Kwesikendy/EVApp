import React from 'react';

interface XChargeLogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * ChargeLink GH official brand logo — web version.
 *
 * Uses the actual client JPEG (`/chargelink-logo.jpeg`) as the single source of truth.
 *   - variant="full"  → shows the full logo (glyph + wordmark + tagline)
 *   - variant="mark"  → shows only the circular glyph crop
 *
 * Component name `XChargeLogo` intentionally preserved to avoid a cascade of
 * import-path refactoring across the codebase.
 */
export const XChargeLogo: React.FC<XChargeLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  const fullSizeMap = {
    sm: { height: '28px', maxWidth: '120px' },
    md: { height: '40px', maxWidth: '160px' },
    lg: { height: '56px', maxWidth: '220px' },
    xl: { height: '72px', maxWidth: '280px' },
  };

  const markSizeMap = {
    sm: '28px',
    md: '40px',
    lg: '56px',
    xl: '72px',
  };

  if (variant === 'mark') {
    // Square crop of the logo glyph section
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: markSizeMap[size], height: markSizeMap[size] }}
      >
        <img
          src="/chargelink-logo.jpeg"
          alt="ChargeLink GH"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 25%',
            borderRadius: '8px',
          }}
          draggable={false}
        />
      </div>
    );
  }

  // variant === 'full' — full logo with natural proportions
  return (
    <div
      className={`inline-flex items-center shrink-0 select-none ${className}`}
      style={{ height: fullSizeMap[size].height, maxWidth: fullSizeMap[size].maxWidth }}
    >
      <img
        src="/chargelink-logo.jpeg"
        alt="ChargeLink GH — Powering a Cleaner Tomorrow"
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
        }}
        draggable={false}
      />
    </div>
  );
};
