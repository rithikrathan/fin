export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-5 opacity-30">{icon}</span>
      <h3 className="text-2xl font-semibold text-txt-primary mb-3">{title}</h3>
      <p className="text-lg text-txt-secondary max-w-md mb-8">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 rounded-xl bg-brand text-white text-base font-semibold shadow-glow hover:bg-brand/90 transition-all cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
