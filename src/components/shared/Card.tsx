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
  return (
    <div
      onClick={onClick}
      className={`bg-surface backdrop-blur-md border border-border-subtle rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}
