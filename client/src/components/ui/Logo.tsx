import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  href?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = '',
  href,
}: LogoProps) {
  const sizeMap = {
    sm: { box: 'h-7 w-7', text: 'text-sm' },
    md: { box: 'h-8 w-8', text: 'text-[15px]' },
    lg: { box: 'h-10 w-10', text: 'text-lg' },
    xl: { box: 'h-12 w-12', text: 'text-xl' },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ─── Architectural Vault Emblem ──────────────────────────────────── */}
      <div
        className={`flex items-center justify-center shrink-0 ${currentSize.box} rounded-lg bg-[#365B4B] text-white shadow-subtle`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4/5 w-4/5"
        >
          {/* Outer clean architectural hexagon/vault */}
          <path d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z" strokeWidth="1.75" />
          {/* Converging decision paths meeting at vault nexus */}
          <path d="M12 7V17" strokeWidth="1.75" />
          <path d="M12 12L17 9" strokeWidth="1.75" />
          <path d="M12 12L7 9" strokeWidth="1.75" />
        </svg>
      </div>

      {/* ─── Product Typography ─────────────────────────────────────────── */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold tracking-tight text-foreground ${currentSize.text}`}>
              DecisionVault
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[11px] font-normal text-muted-foreground tracking-normal">
              Architecture & Governance
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
