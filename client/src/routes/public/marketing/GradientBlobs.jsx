// Purely decorative floating gradient-mesh background used across the
// marketing pages' dark sections. Pointer-events disabled so it never
// intercepts clicks; absolutely positioned within whatever relatively-
// positioned section renders it.
export default function GradientBlobs({ className = '' }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="animate-blob absolute -top-40 -left-32 w-[560px] h-[560px] rounded-full bg-violet/40 blur-[110px]" />
      <div className="animate-blob-slow absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-cyan/25 blur-[110px]" />
      <div className="animate-blob absolute -bottom-40 left-1/4 w-[480px] h-[480px] rounded-full bg-violet-deep/30 blur-[110px]" style={{ animationDelay: '4s' }} />
    </div>
  );
}
