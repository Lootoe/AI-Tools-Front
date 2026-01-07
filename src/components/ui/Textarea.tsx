import React from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-lg px-4 py-3',
          'text-sm',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          'scrollbar-thin',
          className
        )}
        style={{
          backgroundColor: 'rgba(20, 20, 35, 0.8)',
          border: '1px solid rgba(60, 60, 80, 0.5)',
          color: '#e5e7eb',
          ...style
        }}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
