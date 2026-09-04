import { createBrowserRouter, Navigate, Link } from 'react-router-dom';

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Guards
import { AuthGuard } from '@/routes/guards/AuthGuard';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage';

// App pages
import { DashboardPage } from '@/pages/app/DashboardPage';
import { DecisionExplorerPage } from '@/pages/app/DecisionExplorerPage';
import { CreateDecisionPage } from '@/pages/app/CreateDecisionPage';
import { DecisionDetailPage } from '@/pages/app/DecisionDetailPage';
import { SearchPage } from '@/pages/app/SearchPage';
import { TeamsPage } from '@/pages/app/TeamsPage';
import { SettingsPage } from '@/pages/app/SettingsPage';
import { ActivityPage } from '@/pages/app/ActivityPage';

/**
 * Application router configuration.
 */
export const router = createBrowserRouter([
  // ─── Public Routes ───────────────────────────────────────────────────────
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },

  // ─── Auth Routes ─────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  // ─── Protected Routes ────────────────────────────────────────────────────
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/app', element: <Navigate to="/app/dashboard" replace /> },
          { path: '/app/dashboard', element: <DashboardPage /> },
          { path: '/app/decisions', element: <DecisionExplorerPage /> },
          { path: '/app/decisions/new', element: <CreateDecisionPage /> },
          { path: '/app/decisions/:id', element: <DecisionDetailPage /> },
          { path: '/app/search', element: <SearchPage /> },
          { path: '/app/teams', element: <TeamsPage /> },
          { path: '/app/settings', element: <SettingsPage /> },
          { path: '/app/settings/profile', element: <SettingsPage /> },
          { path: '/app/activity', element: <ActivityPage /> },
        ],
      },
    ],
  },

  // ─── Catch-all ───────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-black text-primary">
          404
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Page Not Found
        </h1>
        <p className="mt-2 max-w-sm text-xs text-muted-foreground">
          The requested path does not exist in DecisionVault or has been relocated.
        </p>
        <Link
          to="/app/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </div>
    ),
  },
]);
