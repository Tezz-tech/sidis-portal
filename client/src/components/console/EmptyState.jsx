export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="mb-4 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
