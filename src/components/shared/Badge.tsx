export default function Badge({
  color = 'bg-white/10 text-txt-secondary',
  children,
}: {
  color?: string;
  children: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border border-white/[0.04] ${color}`}
    >
      {children}
    </span>
  );
}
