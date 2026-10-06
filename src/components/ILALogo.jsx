import React from 'react';

/**
 * ILALogo — Premium resolution-independent vector branding component
 * Modes: 'header' (with typography), 'icon' (emblem only), 'badge' (compact badge)
 */
export default function ILALogo({ mode = 'header', size = 'medium', className = '' }) {
  if (mode === 'icon') {
    return (
      <svg
        className={`ila-logo-svg ${className}`}
        width="36"
        height="36"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="16" fill="#0D0D0D" />
        {/* Dynamic Chevron Emblem */}
        <path d="M22 25 L46 50 L22 75" stroke="#FF2E00" strokeWidth="14" strokeLinecap="square" strokeLinejoin="miter" />
        <path d="M46 25 L70 50 L46 75" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="square" strokeLinejoin="miter" />
        <circle cx="76" cy="50" r="7" fill="#FF2E00" />
      </svg>
    );
  }

  if (mode === 'badge') {
    return (
      <div className={`ila-logo-badge ${className}`}>
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
          <rect width="100" height="100" rx="14" fill="#FF2E00" />
          <path d="M25 28 L50 50 L25 72" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="square" />
          <path d="M50 28 L75 50 L50 72" stroke="#0D0D0D" strokeWidth="14" strokeLinecap="square" />
        </svg>
        <span className="ila-badge-text">ILA</span>
      </div>
    );
  }

  // Header / Full mode (default)
  return (
    <div className={`ila-logo-group ${className}`}>
      <svg
        width="38"
        height="38"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="100" height="100" rx="16" fill="#0D0D0D" />
        {/* Dual power chevrons */}
        <path d="M22 25 L46 50 L22 75" stroke="#FF2E00" strokeWidth="14" strokeLinecap="square" />
        <path d="M46 25 L70 50 L46 75" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="square" />
        <circle cx="76" cy="50" r="7" fill="#FF2E00" />
      </svg>
      <div className="ila-logo-titles">
        <div className="ila-brand-name">
          ILA<span className="ila-brand-dot">.</span>
        </div>
        <div className="ila-brand-tagline">INTELLIGENT ATHLETICS</div>
      </div>
    </div>
  );
}
