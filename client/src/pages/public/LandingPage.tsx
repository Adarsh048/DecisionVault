import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/constants';
import { Logo } from '@/components/ui/Logo';
import { ArrowRight, Shield, Layers, RefreshCw } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] dark:bg-[#111216] text-[#1C1C1A] dark:text-[#E8EAEF]">
      {/* Nav */}
      <header className="flex h-16 items-center justify-between border-b border-[#E8E8E3] dark:border-[#2B2E36] px-6 lg:px-12 bg-[#FFFFFF] dark:bg-[#16181D]">
        <Logo size="md" href="/" />
        <nav className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] hover:text-[#1C1C1A] dark:hover:text-[#E8EAEF] transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-3.5 text-xs font-semibold text-white shadow-subtle transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-3 py-1 text-xs font-medium text-[#6B6B66] dark:text-[#9E9EA8] shadow-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-[#365B4B]" />
            <span>Local-First · Real-Time Consensus · Architecture Governance</span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-[#1C1C1A] dark:text-[#E8EAEF] sm:text-5xl lg:text-6xl leading-[1.15]">
            Never lose the reason behind{' '}
            <span className="text-[#365B4B] dark:text-[#78C295]">an important decision.</span>
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#6B6B66] dark:text-[#9E9EA8] md:text-base">
            {APP_NAME} helps engineering and product teams capture, evaluate, and preserve the critical decisions, trade-offs, and consensus that shape their systems.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center pt-2">
            <Link
              to="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#365B4B] hover:bg-[#29483A] px-6 text-xs font-semibold text-white shadow-subtle transition-colors"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] px-6 text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF] hover:bg-[#F5F5F2] transition-colors"
            >
              Sign in to Account
            </Link>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
            <div className="p-4 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle">
              <Shield className="h-4 w-4 text-[#365B4B] mb-2" />
              <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Access Governance
              </h3>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-1">
                Owner role assignment and granular privilege control for engineers and stakeholders.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle">
              <RefreshCw className="h-4 w-4 text-[#365B4B] mb-2" />
              <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Offline-First Sync
              </h3>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-1">
                Author and review ADRs during transit. Instant local response with CRDT sync.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E8E8E3] dark:border-[#2B2E36] bg-[#FFFFFF] dark:bg-[#16181D] shadow-subtle">
              <Layers className="h-4 w-4 text-[#365B4B] mb-2" />
              <h3 className="text-xs font-semibold text-[#1C1C1A] dark:text-[#E8EAEF]">
                Knowledge Database
              </h3>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#9E9EA8] mt-1">
                Semantic search across historical rationales, evaluated options, and trade-offs.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E3] dark:border-[#2B2E36] py-6 text-center text-xs text-[#969690] bg-[#FFFFFF] dark:bg-[#16181D]">
        © {new Date().getFullYear()} {APP_NAME} · Enterprise Architecture Decision Management
      </footer>
    </div>
  );
}
