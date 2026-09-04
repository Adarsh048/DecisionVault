import { Outlet } from 'react-router-dom';

/**
 * PublicLayout wraps unauthenticated pages (landing, login, register).
 * Provides a minimal, clean layout without sidebar/navbar.
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
