import React from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg px-4 py-2',
          'text-sm file:border-0 file:bg-transparent',
          'file:text-sm file:font-medium',
          'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className
        )}
        style={{
          backgroundColor: 'rgba(20, 20, 35, 0.8)',
          border: '1px solid rgba(60, 60, 80, 0.5)',
          color: '#e5e7eb',
          outline: 'none',
          ...style
        }}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
