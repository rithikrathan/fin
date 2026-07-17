import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-brand text-white hover:bg-brand/90 shadow-glow',
  secondary:
    'bg-white/[0.06] text-txt-primary border border-border-subtle hover:bg-white/[0.1]',
  ghost:
    'bg-transparent text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04]',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
