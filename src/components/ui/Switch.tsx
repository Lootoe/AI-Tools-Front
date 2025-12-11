import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  className,
  label,
}) => {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
          !disabled && 'hover:opacity-80'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
          )}
        />
      </button>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </label>
  );
};
