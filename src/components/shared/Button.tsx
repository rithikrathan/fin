import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary:
    'bg-brand text-white border border-brand/20 hover:bg-brand/90 hover:brightness-110 shadow-glow active:scale-[0.97]',
  secondary:
    'bg-white/[0.04] text-txt-primary border border-border-subtle hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.97]',
  ghost:
    'bg-transparent text-txt-secondary hover:text-txt-primary hover:bg-white/[0.04] active:scale-[0.97]',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-[0.97]',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs min-h-[40px] flex items-center justify-center gap-1.5',
  md: 'px-5 py-2.5 text-sm min-h-[44px] flex items-center justify-center gap-2',
  lg: 'px-6 py-3 text-base min-h-[48px] flex items-center justify-center gap-2.5',
};

export default function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transform flex items-center justify-center ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
