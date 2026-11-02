import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { UserProfile, UserStudyStats } from '../types/auth';
import { generateRandomSalt, hashPasswordWithSalt, verifyPassword } from '../services/authCrypto';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authView: 'login' | 'signup';
  setAuthView: (view: 'login' | 'signup') => void;
  signupSuccessMessage: string | null;
  setSignupSuccessMessage: (msg: string | null) => void;
  prefillUserId: string;
  setPrefillUserId: (id: string) => void;
  login: (userIdInput: string, passwordInput: string) => Promise<{ success: boolean; error?: string }>;
  signup: (payload: {
    fullName: string;
    userId: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateFullName: (newName: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  stats: UserStudyStats;
  refreshStats: () => void;
  recordQuizCompleted: () => void;
  recordTasksCompletedCount: (completed: number, total: number) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isLogoutConfirmOpen: boolean;
  setIsLogoutConfirmOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_STORAGE_KEY = 'study_buddy_users_v2';
const ACTIVE_USER_KEY = 'study_buddy_active_session_v2';
const STATS_KEY_PREFIX = 'study_buddy_stats_';

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse users from localStorage:', e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const currentUserRef = useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);
  const [prefillUserId, setPrefillUserId] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);

  const [stats, setStats] = useState<UserStudyStats>({
    tasksCompleted: 0,
    totalTasks: 0,
    studyStreakDays: 1,
    notesCount: 0,
    quizzesTaken: 0,
  });

  // Save users list whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage:', e);
    }
  }, [users]);

  // Load active session on initial mount
  useEffect(() => {
    try {
      const activeUserId = localStorage.getItem(ACTIVE_USER_KEY);
      if (activeUserId && users.length > 0) {
        const found = users.find(
          (u) => u.userId.toLowerCase() === activeUserId.toLowerCase()
        );
        if (found) {
          setCurrentUser(found);
        } else {
          localStorage.removeItem(ACTIVE_USER_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore active session:', e);
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  // Load and refresh stats for current user without triggering redundant renders
  const refreshStats = useCallback(() => {
    const user = currentUserRef.current;
    if (!user) return;
    try {
      const raw = localStorage.getItem(`${STATS_KEY_PREFIX}${user.userId}`);
      let userStats: UserStudyStats = {
        tasksCompleted: 0,
        totalTasks: 0,
        studyStreakDays: 1,
        notesCount: 0,
        quizzesTaken: 0,
      };

      if (raw) {
        userStats = { ...userStats, ...JSON.parse(raw) };
      }

      // Check current notes count for this user
      const userNotesRaw = localStorage.getItem(`studybuddy_notes_${user.userId}`);
      if (userNotesRaw) {
        try {
          const notesArr = JSON.parse(userNotesRaw);
          if (Array.isArray(notesArr)) {
            userStats.notesCount = notesArr.length;
          }
        } catch {}
      }

      // Check current tasks count for this user
      const userPlanRaw = localStorage.getItem(`studybuddy_plan_${user.userId}`);
      if (userPlanRaw) {
        try {
          const planData = JSON.parse(userPlanRaw);
          if (Array.isArray(planData.tasks)) {
            userStats.totalTasks = planData.tasks.length;
            userStats.tasksCompleted = planData.tasks.filter((t: any) => t.completed).length;
          }
        } catch {}
      }

      setStats((prev) => {
        if (
          prev.tasksCompleted === userStats.tasksCompleted &&
          prev.totalTasks === userStats.totalTasks &&
          prev.studyStreakDays === userStats.studyStreakDays &&
          prev.notesCount === userStats.notesCount &&
          prev.quizzesTaken === userStats.quizzesTaken
        ) {
          return prev;
        }
        return userStats;
      });
    } catch (e) {
      console.warn('Failed to load user stats:', e);
    }
  }, []);

  // Update stats only when user changes
  useEffect(() => {
    if (currentUser?.userId) {
      refreshStats();
    }
  }, [currentUser?.userId, refreshStats]);

  const recordQuizCompleted = useCallback(() => {
    const user = currentUserRef.current;
    if (!user) return;
    setStats((prev) => {
      const next = { ...prev, quizzesTaken: prev.quizzesTaken + 1 };
      try {
        localStorage.setItem(
          `${STATS_KEY_PREFIX}${user.userId}`,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  }, []);

  const recordTasksCompletedCount = useCallback((completed: number, total: number) => {
    const user = currentUserRef.current;
    if (!user) return;
    setStats((prev) => {
      if (prev.tasksCompleted === completed && prev.totalTasks === total) {
        return prev;
      }
      const next = {
        ...prev,
        tasksCompleted: completed,
        totalTasks: total,
        studyStreakDays: Math.max(1, prev.studyStreakDays),
      };
      try {
        localStorage.setItem(
          `${STATS_KEY_PREFIX}${user.userId}`,
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  }, []);

  // Sign Up Flow
  const signup = useCallback(async ({
    fullName,
    userId,
    password,
    confirmPassword,
  }: {
    fullName: string;
    userId: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanName = fullName.trim();
    const cleanUserId = userId.trim();

    if (!cleanName) {
      return { success: false, error: 'Please enter your full name.' };
    }

    if (cleanUserId.length < 4 || cleanUserId.length > 20) {
      return { success: false, error: 'User ID must be between 4 and 20 characters.' };
    }

    const userIdRegex = /^[a-zA-Z0-9_]+$/;
    if (!userIdRegex.test(cleanUserId)) {
      return {
        success: false,
        error: 'User ID can only contain letters, numbers, and underscores.',
      };
    }

    // Check unique User ID (case insensitive)
    const exists = users.some(
      (u) => u.userId.toLowerCase() === cleanUserId.toLowerCase()
    );
    if (exists) {
      return { success: false, error: 'This User ID is already taken.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    // Hash password with cryptographically secure salt using Web Crypto API
    const salt = generateRandomSalt(16);
    const passwordHash = await hashPasswordWithSalt(password, salt);

    const randomColor =
      AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: cleanUserId,
      fullName: cleanName,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
      avatarBg: randomColor,
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
    } catch {}

    // Initialize user initial stats
    const initialStats: UserStudyStats = {
      tasksCompleted: 0,
      totalTasks: 0,
      studyStreakDays: 1,
      notesCount: 0,
      quizzesTaken: 0,
    };
    try {
      localStorage.setItem(
        `${STATS_KEY_PREFIX}${cleanUserId}`,
        JSON.stringify(initialStats)
      );
    } catch {}

    // Prepare success state and redirect to Login screen
    setSignupSuccessMessage(
      'Account created successfully! Please log in with your credentials.'
    );
    setPrefillUserId(cleanUserId);
    setAuthView('login');

    return { success: true };
  }, [users]);

  // Login Flow
  const login = useCallback(async (
    userIdInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = userIdInput.trim();
    if (!cleanId || !passwordInput) {
      return { success: false, error: 'Invalid User ID or password.' };
    }

    const matchedUser = users.find(
      (u) => u.userId.toLowerCase() === cleanId.toLowerCase()
    );
    if (!matchedUser) {
      return { success: false, error: 'Invalid User ID or password.' };
    }

    const isValid = await verifyPassword(
      passwordInput,
      matchedUser.salt,
      matchedUser.passwordHash
    );

    if (!isValid) {
      return { success: false, error: 'Invalid User ID or password.' };
    }

    setCurrentUser(matchedUser);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, matchedUser.userId);
    } catch {}

    setSignupSuccessMessage(null);
    return { success: true };
  }, [users]);

  // Logout Flow
  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch {}
    setIsProfileOpen(false);
    setIsLogoutConfirmOpen(false);
    setAuthView('login');
  }, []);

  // Edit Full Name
  const updateFullName = useCallback(async (
    newName: string
  ): Promise<{ success: boolean; error?: string }> => {
    const user = currentUserRef.current;
    if (!user) return { success: false, error: 'Not logged in.' };
    const clean = newName.trim();
    if (clean.length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters.' };
    }

    const updatedUser: UserProfile = { ...user, fullName: clean };
    setUsers((prev) =>
      prev.map((u) => (u.userId.toLowerCase() === user.userId.toLowerCase() ? updatedUser : u))
    );
    setCurrentUser(updatedUser);
    return { success: true };
  }, []);

  // Change Password
  const changePassword = useCallback(async (
    oldPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const user = currentUserRef.current;
    if (!user) return { success: false, error: 'Not logged in.' };

    if (!oldPassword) {
      return { success: false, error: 'Please enter your current password.' };
    }

    const isOldValid = await verifyPassword(
      oldPassword,
      user.salt,
      user.passwordHash
    );
    if (!isOldValid) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    if (newPassword !== confirmNewPassword) {
      return { success: false, error: 'New passwords do not match.' };
    }

    const newSalt = generateRandomSalt(16);
    const newHash = await hashPasswordWithSalt(newPassword, newSalt);

    const updatedUser: UserProfile = {
      ...user,
      salt: newSalt,
      passwordHash: newHash,
    };

    setUsers((prev) =>
      prev.map((u) => (u.userId.toLowerCase() === user.userId.toLowerCase() ? updatedUser : u))
    );
    setCurrentUser(updatedUser);
    return { success: true };
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      authView,
      setAuthView,
      signupSuccessMessage,
      setSignupSuccessMessage,
      prefillUserId,
      setPrefillUserId,
      login,
      signup,
      logout,
      updateFullName,
      changePassword,
      stats,
      refreshStats,
      recordQuizCompleted,
      recordTasksCompletedCount,
      isProfileOpen,
      setIsProfileOpen,
      isLogoutConfirmOpen,
      setIsLogoutConfirmOpen,
    }),
    [
      currentUser,
      isLoading,
      authView,
      signupSuccessMessage,
      prefillUserId,
      login,
      signup,
      logout,
      updateFullName,
      changePassword,
      stats,
      refreshStats,
      recordQuizCompleted,
      recordTasksCompletedCount,
      isProfileOpen,
      isLogoutConfirmOpen,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
