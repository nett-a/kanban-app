import { Link } from 'react-router';

export default function NotFoundPage({ message = 'Page not found' }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-bold text-slate-300">404</p>
      <h1 className="text-xl font-semibold text-slate-700">{message}</h1>
      <p className="max-w-sm text-sm text-slate-500">It may have been deleted, or you might not have access to it.</p>
      <Link to="/" className="btn-primary">
        Back to boards
      </Link>
    </div>
  );
}
