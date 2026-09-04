import type { DecisionStatus } from '@/lib/constants';
import { STATUS_CONFIG } from '@/lib/constants';

interface StatusBadgeProps {
  status: DecisionStatus;
  size?: 'sm' | 'md';
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  size = 'md',
  className = '',
  showDot = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const dotSizes = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${config.bgClass} ${config.color} ${config.borderClass} ${sizeStyles[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`shrink-0 rounded-full ${config.dotClass} ${dotSizes[size]}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
