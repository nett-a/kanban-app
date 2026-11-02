import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader.jsx';

export function AppLayout() {
  return (
    <div className="flex h-full flex-col">
      <AppHeader />
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
