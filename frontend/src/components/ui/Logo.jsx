export function Logo({ className = '', light = false }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-slate-800'} ${className}`}>
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill={light ? '#ffffff' : '#0c66e4'} />
        <rect x="7" y="7" width="7.5" height="17" rx="2" fill={light ? '#0c66e4' : '#fff'} />
        <rect x="17.5" y="7" width="7.5" height="11" rx="2" fill={light ? '#0c66e4' : '#fff'} />
      </svg>
      FlowBoard
    </span>
  );
}
