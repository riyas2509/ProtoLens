import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-sm font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-neutral-800',
    secondary: 'bg-neutral-100 text-black hover:bg-neutral-200',
    outline: 'border border-neutral-200 bg-transparent hover:bg-neutral-50 text-black',
    ghost: 'bg-transparent hover:bg-neutral-100 text-black',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    icon: 'p-2',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
