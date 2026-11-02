import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, User, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ThreeDotMenu() {
  const {
    currentUser,
    isAuthenticated,
    setAuthView,
    setIsProfileOpen,
    setIsLogoutConfirmOpen,
  } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SB';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="flex items-center gap-2">
        {/* User initials badge when logged in */}
        {isAuthenticated && currentUser && (
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-full text-left transition-colors cursor-pointer group"
            title="Open profile"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                currentUser.avatarBg || 'bg-blue-600'
              }`}
            >
              {initials}
            </div>
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 max-w-[120px] truncate">
              {currentUser.fullName}
            </span>
          </button>
        )}

        {/* Three-dot vertical ellipsis icon button */}
        <button
          type="button"
          aria-label="User account and options menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer border ${
            isOpen
              ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
              : 'border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MoreVertical className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {isAuthenticated ? (
            <>
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.fullName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  @{currentUser?.userId}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  setIsProfileOpen(true);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>My Profile</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  setIsLogoutConfirmOpen(true);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  setAuthView('signup');
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-500" />
                <span>Sign Up</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  setAuthView('login');
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>Login</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
