import React, { useState } from 'react';
import { AppTab } from './types/study';
import { Navbar } from './components/Navbar';
import { PlannerTab } from './components/PlannerTab';
import { DoubtSolverTab } from './components/DoubtSolverTab';
import { QuizTab } from './components/QuizTab';
import { SUBJECT_LIST } from './data/studyData';
import { NotesProvider } from './context/NotesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';

function MainAppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Planner);

  const handleTabChange = (nextTab: AppTab) => {
    setActiveTab(nextTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-600">Loading StudyBuddy...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      <Navbar activeTab={activeTab} onSelectTab={handleTabChange} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-24 md:pb-12">
        {!isAuthenticated ? (
          <AuthScreen />
        ) : (
          <>
            {/* Friendly Smart Education Intro Strip */}
            <div className="mb-6 pb-5 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-blue-700 tracking-tight">
                  First-Year Engineering · Smart Education
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-0.5">
                  Plan. Learn. Test.
                </h1>
              </div>

              {/* Unboxed Clean Subject Metadata */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                {SUBJECT_LIST.map((subject, idx) => (
                  <React.Fragment key={subject.id}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span className="font-medium text-slate-700">{subject.fullLabel}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Active Tab Workspace */}
            {activeTab === AppTab.Planner && <PlannerTab />}
            {activeTab === AppTab.DoubtSolver && <DoubtSolverTab />}
            {activeTab === AppTab.Quiz && (
              <QuizTab onNavigateToPlanner={() => handleTabChange(AppTab.Planner)} />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <ProfileModal />
      <LogoutConfirmModal />

      <footer className="hidden md:block border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
          <span>StudyBuddy · Smart Education Companion for First-Year Engineering</span>
          <span>Plan. Learn. Test.</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotesProvider>
        <MainAppContent />
      </NotesProvider>
    </AuthProvider>
  );
}
