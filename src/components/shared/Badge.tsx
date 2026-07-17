export default function Badge({
  color = 'bg-white/10 text-txt-secondary',
  children,
}: {
  color?: string;
  children: string;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}`}
    >
      {children}
    </span>
  );
}
