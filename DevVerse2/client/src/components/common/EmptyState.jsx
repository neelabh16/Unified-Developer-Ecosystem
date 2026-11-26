export default function EmptyState({
  icon = null,
  title,
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`glass flex flex-col items-center justify-center px-6 py-14 text-center ${className}`.trim()}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
