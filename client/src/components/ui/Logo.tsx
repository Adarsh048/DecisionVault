import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  iconOnly?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  showSubtitle = false,
  iconOnly = false,
  className = '',
  href = '/',
}: LogoProps) {
  // Dimension configurations
  const config = {
    sm: {
      iconSize: 'h-7 w-7',
      textSize: 'text-[15px]',
      subSize: 'text-[9px]',
      gap: 'gap-2.5',
    },
    md: {
      iconSize: 'h-8 w-8 sm:h-9 sm:w-9',
      textSize: 'text-lg sm:text-xl',
      subSize: 'text-[10px]',
      gap: 'gap-3',
    },
    lg: {
      iconSize: 'h-11 w-11',
      textSize: 'text-2xl',
      subSize: 'text-[11px]',
      gap: 'gap-3.5',
    },
    xl: {
      iconSize: 'h-14 w-14',
      textSize: 'text-3xl',
      subSize: 'text-xs',
      gap: 'gap-4',
    },
  }[size];

  // Modern Isometric Vault Emblem SVG
  const icon = (
    <div className={`relative shrink-0 flex items-center justify-center ${config.iconSize} group`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
      >
        <defs>
          {/* Top illuminated prism plane */}
          <linearGradient id="dv-grad-top" x1="20" y1="3.5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4E876E" />
            <stop offset="100%" stopColor="#365B4B" />
          </linearGradient>

          {/* Left shadow prism plane */}
          <linearGradient id="dv-grad-left" x1="6" y1="12" x2="20" y2="36.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#28483A" />
            <stop offset="100%" stopColor="#183025" />
          </linearGradient>

          {/* Right anchor prism plane */}
          <linearGradient id="dv-grad-right" x1="20" y1="20" x2="34" y2="36.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#223C30" />
            <stop offset="100%" stopColor="#102018" />
          </linearGradient>

          {/* Inner core prism gradients */}
          <linearGradient id="dv-core-top" x1="20" y1="13.5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A8F5CB" />
            <stop offset="100%" stopColor="#67D59A" />
          </linearGradient>
          <linearGradient id="dv-core-left" x1="14.5" y1="17" x2="20" y2="26.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4BB87F" />
            <stop offset="100%" stopColor="#2E8657" />
          </linearGradient>
          <linearGradient id="dv-core-right" x1="20" y1="20" x2="25.5" y2="26.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#369662" />
            <stop offset="100%" stopColor="#1E5C3A" />
          </linearGradient>
        </defs>

        {/* ─── Outer Isometric Hexagon Vault Shell ───────────────────── */}
        {/* Top Plane */}
        <path
          d="M20 3.8 L34 11.9 L20 20 L6 11.9 Z"
          fill="url(#dv-grad-top)"
          stroke="#68BA93"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Left Plane */}
        <path
          d="M6 11.9 L20 20 L20 36.2 L6 28.1 Z"
          fill="url(#dv-grad-left)"
          stroke="#386A51"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* Right Plane */}
        <path
          d="M20 20 L34 11.9 L34 28.1 L20 36.2 Z"
          fill="url(#dv-grad-right)"
          stroke="#2A503D"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />

        {/* ─── Architectural Convergence Grid Lines ────────────────── */}
        <line x1="20" y1="3.8" x2="20" y2="13.5" stroke="#9EF0C2" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        <line x1="6" y1="28.1" x2="14.5" y2="23.2" stroke="#509C76" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        <line x1="34" y1="28.1" x2="25.5" y2="23.2" stroke="#509C76" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

        {/* ─── Inner Protected Vault Core (The Architectural Decision) ─ */}
        <path d="M20 13.5 L25.5 16.7 L20 19.9 L14.5 16.7 Z" fill="url(#dv-core-top)" />
        <path d="M14.5 16.7 L20 19.9 L20 26.3 L14.5 23.1 Z" fill="url(#dv-core-left)" />
        <path d="M20 19.9 L25.5 16.7 L25.5 23.1 L20 26.3 Z" fill="url(#dv-core-right)" />

        {/* Center Consensus Nexus Spark */}
        <circle cx="20" cy="19.9" r="1.6" fill="#FFFFFF" className="animate-pulse" />
      </svg>
    </div>
  );

  if (iconOnly) {
    if (href) {
      return (
        <Link to={href} className={`inline-flex items-center ${className}`} title="DecisionVault">
          {icon}
        </Link>
      );
    }
    return <div className={`inline-flex items-center ${className}`}>{icon}</div>;
  }

  const content = (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      {icon}

      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight">
            <span className={`font-semibold ${config.textSize} text-[#1C1C1A] dark:text-[#F3F4F6]`}>
              Decision
            </span>
            <span className={`font-extrabold ${config.textSize} text-[#365B4B] dark:text-[#78C295] ml-0.5`}>
              Vault
            </span>
          </div>
          {showSubtitle && (
            <span className={`${config.subSize} font-bold tracking-widest uppercase text-[#888880] dark:text-[#9A9CA6] mt-1`}>
              Architecture & Governance
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-block transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
