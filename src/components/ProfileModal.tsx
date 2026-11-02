import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Flame,
  CheckSquare,
  FileText,
  Award,
  Edit2,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function ProfileModal() {
  const {
    currentUser,
    isProfileOpen,
    setIsProfileOpen,
    setIsLogoutConfirmOpen,
    updateFullName,
    changePassword,
    stats,
    refreshStats,
  } = useAuth();

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.fullName || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditedName(currentUser.fullName);
      refreshStats();
    }
  }, [currentUser, isProfileOpen, refreshStats]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isProfileOpen) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen, setIsProfileOpen]);

  if (!isProfileOpen || !currentUser) return null;

  const initials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SB';

  const joinedFormatted = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    if (editedName.trim().length < 2) {
      setNameError('Full name must be at least 2 characters.');
      return;
    }

    setIsSavingName(true);
    try {
      const res = await updateFullName(editedName.trim());
      if (res.success) {
        setNameSuccess('Name updated successfully!');
        setIsEditingName(false);
        setTimeout(() => setNameSuccess(null), 3000);
      } else {
        setNameError(res.error || 'Failed to update name.');
      }
    } finally {
      setIsSavingName(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(oldPassword, newPassword, confirmNewPassword);
      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setPasswordSuccess(null);
          setShowPasswordSection(false);
        }, 2000);
      } else {
        setPasswordError(res.error || 'Failed to change password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 id="profile-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
              My Profile
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            aria-label="Close profile"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Identity Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            {/* Avatar Circle with initials */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm shrink-0 ${
                currentUser.avatarBg || 'bg-blue-600'
              }`}
            >
              {initials}
            </div>

            <div className="flex-1 text-center sm:text-left">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="px-2.5 py-1.5 text-sm bg-white border border-blue-500 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      placeholder="Enter full name"
                    />
                    <button
                      type="submit"
                      disabled={isSavingName}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditedName(currentUser.fullName);
                        setIsEditingName(false);
                        setNameError(null);
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {nameError && <p className="text-xs text-rose-600">{nameError}</p>}
                </form>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Edit name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {nameSuccess && (
                <p className="text-xs text-emerald-600 mt-1 font-medium">{nameSuccess}</p>
              )}

              <p className="text-xs font-mono text-slate-500 mt-0.5">
                User ID: <span className="font-semibold text-slate-700">@{currentUser.userId}</span>
              </p>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 mt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {joinedFormatted}</span>
              </div>
            </div>
          </div>

          {/* Study Stats Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Study Statistics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-center">
                <CheckSquare className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                <span className="block text-lg font-bold text-slate-900 font-mono">
                  {stats.tasksCompleted}
                  {stats.totalTasks > 0 && (
                    <span className="text-xs font-normal text-slate-500">/{stats.totalTasks}</span>
                  )}
                </span>
                <span className="text-[11px] font-medium text-slate-600">Tasks Done</span>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-center">
                <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="block text-lg font-bold text-slate-900 font-mono">
                  {stats.studyStreakDays}d
                </span>
                <span className="text-[11px] font-medium text-slate-600">Study Streak</span>
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-center">
                <FileText className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="block text-lg font-bold text-slate-900 font-mono">
                  {stats.notesCount}
                </span>
                <span className="text-[11px] font-medium text-slate-600">Notes Added</span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-center">
                <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                <span className="block text-lg font-bold text-slate-900 font-mono">
                  {stats.quizzesTaken}
                </span>
                <span className="text-[11px] font-medium text-slate-600">Quizzes Taken</span>
              </div>
            </div>
          </div>

          {/* Change Password Collapsible Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPasswordSection((prev) => !prev)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Security: Change Password</span>
              </div>
              <span className="text-xs text-blue-600">
                {showPasswordSection ? 'Hide' : 'Update'}
              </span>
            </button>

            {showPasswordSection && (
              <form onSubmit={handleChangePasswordSubmit} className="p-4 space-y-3.5 bg-white border-t border-slate-200">
                {passwordError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Old Password */}
                <div>
                  <label
                    htmlFor="old-pwd"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="old-pwd"
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-pwd"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      id="new-pwd"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label
                    htmlFor="confirm-new-pwd"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-new-pwd"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((p) => !p)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full min-h-[38px] py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isChangingPassword ? 'Verifying & Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer with Logout Button */}
        <div className="px-6 py-3.5 border-t border-slate-200/90 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              setIsLogoutConfirmOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
