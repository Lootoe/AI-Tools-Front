import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', style, ...props }, ref) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'default':
          return {
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
          };
        case 'destructive':
          return {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
          };
        case 'outline':
          return {
            background: 'transparent',
            color: '#9ca3af',
            border: '1px solid rgba(60, 60, 80, 0.5)',
            boxShadow: 'none',
          };
        case 'ghost':
          return {
            background: 'transparent',
            color: '#9ca3af',
            border: 'none',
            boxShadow: 'none',
          };
        case 'secondary':
          return {
            background: 'rgba(60, 60, 80, 0.3)',
            color: '#d1d5db',
            border: '1px solid rgba(60, 60, 80, 0.5)',
            boxShadow: 'none',
          };
        default:
          return {};
      }
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.98]',
          'hover:brightness-110',
          {
            'h-11 px-5 py-2.5 text-sm': size === 'default',
            'h-9 px-3 text-sm': size === 'sm',
            'h-12 px-8 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        style={{ ...getVariantStyles(), ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
