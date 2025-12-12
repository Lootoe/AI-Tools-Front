import React from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3',
          'text-sm ring-offset-background placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-700',
          'focus-visible:outline-none focus-visible:ring-0 focus-visible:border-gray-200 dark:focus-visible:border-gray-700',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
