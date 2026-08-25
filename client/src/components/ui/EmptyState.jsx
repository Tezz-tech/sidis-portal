export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="mb-4 w-11 h-11 rounded-card border border-rule flex items-center justify-center text-graphite">
          <Icon size={20} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-card-title text-ink mb-1">{title}</h3>
      {description && <p className="text-body text-graphite max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
