import React from 'react';
import { CalendarCheck2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { AppTab } from '../types/study';
import { LogoMark } from './Logo';
import { ThreeDotMenu } from './ThreeDotMenu';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: AppTab.Planner, label: 'Planner', icon: CalendarCheck2 },
  { id: AppTab.DoubtSolver, label: 'Doubt Solver', icon: HelpCircle },
  { id: AppTab.Quiz, label: 'Quiz', icon: CheckCircle2 },
];

export function Navbar({ activeTab, onSelectTab }: NavbarProps) {
  const { isAuthenticated } = useAuth();
  const ctaTarget = activeTab === AppTab.Quiz ? AppTab.Planner : AppTab.Quiz;
  const ctaLabel = activeTab === AppTab.Quiz ? 'Build Study Plan' : 'Take Practice Quiz';

  return (
    <>
      {/* Desktop / Laptop Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                onSelectTab(AppTab.Planner);
              }
            }}
            className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogoMark className="w-8 h-8 shrink-0" />
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              StudyBuddy
            </span>
          </button>

          {/* Zone 2: Navigation Tabs (Shown when logged in on md+ screens) */}
          {isAuthenticated && (
            <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-7 h-full">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative h-full inline-flex items-center text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-600 ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-t-full"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Top-Right Corner with Action + Three-Dot Menu */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated && (
              <div className="hidden sm:block">
                <button
                  type="button"
                  onClick={() => onSelectTab(ctaTarget)}
                  className="px-3.5 py-2 min-h-[38px] text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {ctaLabel}
                </button>
              </div>
            )}

            {/* Three-Dot Menu (Always visible in top-right corner) */}
            <ThreeDotMenu />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar (Only when logged in) */}
      {isAuthenticated && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
