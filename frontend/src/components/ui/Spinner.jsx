import { LoaderCircle } from 'lucide-react';

export function Spinner({ size = 24, className = 'text-slate-400' }) {
  return <LoaderCircle size={size} className={`animate-spin ${className}`} aria-label="Loading" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={36} />
    </div>
  );
}
