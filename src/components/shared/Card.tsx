import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;
  return (
    <div
      onClick={onClick}
      className={`bg-surface backdrop-blur-md border border-border-subtle rounded-2xl transition-all duration-200 ${
        isClickable
          ? 'cursor-pointer hover:bg-white/[0.06] hover:border-white/15 hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
