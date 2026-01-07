import React from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, style, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#9ca3af' }}>
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full h-10 px-3 py-2 pr-10 text-sm',
              'rounded-lg appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-colors',
              className
            )}
            style={{
              backgroundColor: 'rgba(20, 20, 35, 0.8)',
              border: '1px solid rgba(60, 60, 80, 0.5)',
              color: '#e5e7eb',
              ...style
            }}
            {...props}
          >
            {children}
          </select>
          <ChevronDown 
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" 
            size={16}
            style={{ color: '#6b7280' }}
          />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
