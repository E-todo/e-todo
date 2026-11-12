export default function GlassSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={`glass-skeleton ${compact ? "is-compact" : ""}`} role="status" aria-label="Chargement en cours">
    <span className="sr-only">Chargement en cours…</span>
    {Array.from({ length: compact ? 3 : 6 }, (_, i) => <div className="skeleton-card" key={i} aria-hidden="true">
      <span className="skeleton-line skeleton-title" /><span className="skeleton-line" /><span className="skeleton-line skeleton-short" />
    </div>)}
  </div>;
}
