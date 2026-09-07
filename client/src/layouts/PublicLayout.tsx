import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { prewarmServer } from '@/services/api';

/**
 * PublicLayout wraps unauthenticated pages (landing, login, register).
 * Provides a minimal, clean layout without sidebar/navbar.
 */
export function PublicLayout() {
  useEffect(() => {
    prewarmServer();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}
