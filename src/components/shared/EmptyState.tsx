export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center relative my-4">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

      {/* Glowing Neon Icon Badge */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/40 flex items-center justify-center text-3xl text-brand shadow-[0_0_25px_rgba(255,42,42,0.35),inset_0_0_12px_rgba(255,42,42,0.2)] animate-pulse">
          {typeof icon === 'string' ? <span>{icon}</span> : icon}
        </div>
      </div>

      <h3 className="text-lg sm:text-xl font-extrabold text-txt-primary tracking-tight mb-1.5 relative z-10">{title}</h3>
      <p className="text-xs sm:text-sm text-txt-secondary max-w-sm leading-relaxed mb-6 relative z-10">{description}</p>

      {action && (
        <button
          onClick={action.onClick}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-brand text-white text-xs font-extrabold shadow-[0_0_20px_rgba(255,42,42,0.4)] hover:shadow-[0_0_30px_rgba(255,42,42,0.6)] hover:bg-brand/90 active:scale-95 transition-all cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
