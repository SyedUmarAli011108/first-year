import React, { useEffect } from 'react';
import { LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LogoutConfirmModal() {
  const { isLogoutConfirmOpen, setIsLogoutConfirmOpen, logout } = useAuth();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isLogoutConfirmOpen) {
        setIsLogoutConfirmOpen(false);
      }
    }
    if (isLogoutConfirmOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLogoutConfirmOpen, setIsLogoutConfirmOpen]);

  if (!isLogoutConfirmOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <LogOut className="w-6 h-6" />
        </div>

        <h3 id="logout-title" className="text-lg font-bold text-slate-900">
          Are you sure you want to logout?
        </h3>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          Your study plan, progress, and uploaded notes are safely saved to your User ID and will be restored next time you log in.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsLogoutConfirmOpen(false)}
            className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="min-h-[42px] px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
