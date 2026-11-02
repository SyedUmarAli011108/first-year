import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, AtSign, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LogoMark } from './Logo';

export function AuthScreen() {
  const {
    authView,
    setAuthView,
    signupSuccessMessage,
    setSignupSuccessMessage,
    prefillUserId,
    login,
    signup,
  } = useAuth();

  // Login form state
  const [loginUserId, setLoginUserId] = useState(prefillUserId || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync prefill if provided
  React.useEffect(() => {
    if (prefillUserId) {
      setLoginUserId(prefillUserId);
    }
  }, [prefillUserId]);

  // Sign up form state
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpUserId, setSignUpUserId] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // Inline errors for sign up
  const [errors, setErrors] = useState<{
    fullName?: string;
    userId?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Login submit handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setSignupSuccessMessage(null);

    if (!loginUserId.trim()) {
      setLoginError('Please enter your User ID.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(loginUserId, loginPassword);
      if (!result.success) {
        setLoginError(result.error || 'Invalid User ID or password.');
      }
    } catch {
      setLoginError('An unexpected error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign up submit handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupSuccessMessage(null);

    const nextErrors: typeof errors = {};

    const cleanName = signUpFullName.trim();
    if (!cleanName) {
      nextErrors.fullName = 'Full Name is required.';
    } else if (cleanName.length < 2) {
      nextErrors.fullName = 'Full Name must be at least 2 characters.';
    }

    const cleanId = signUpUserId.trim();
    if (!cleanId) {
      nextErrors.userId = 'User ID is required.';
    } else if (cleanId.length < 4 || cleanId.length > 20) {
      nextErrors.userId = 'User ID must be 4 to 20 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanId)) {
      nextErrors.userId = 'Only letters, numbers, and underscores allowed.';
    }

    if (!signUpPassword) {
      nextErrors.password = 'Password is required.';
    } else if (signUpPassword.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    if (!signUpConfirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (signUpPassword !== signUpConfirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSigningUp(true);

    try {
      const result = await signup({
        fullName: cleanName,
        userId: cleanId,
        password: signUpPassword,
        confirmPassword: signUpConfirmPassword,
      });

      if (!result.success) {
        if (result.error?.includes('already taken')) {
          setErrors({ userId: 'This User ID is already taken.' });
        } else {
          setErrors({ general: result.error || 'Sign up failed. Please check inputs.' });
        }
      } else {
        // Clear sign up form
        setSignUpFullName('');
        setSignUpUserId('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
      }
    } catch {
      setErrors({ general: 'An error occurred during account creation.' });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 sm:my-10 px-4">
      {/* Brand Card Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-3 border border-blue-100">
          <LogoMark className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome to StudyBuddy
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xs mx-auto">
          Your personal engineering study planner, note-based quiz generator, and AI doubt tutor.
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        {/* Toggle Mode Header */}
        <div className="grid grid-cols-2 border-b border-slate-200/90 bg-slate-50/60 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setAuthView('login');
              setLoginError(null);
            }}
            className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              authView === 'login'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthView('signup');
              setErrors({});
            }}
            className={`min-h-[42px] py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              authView === 'signup'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          {/* Success banner after signup */}
          {signupSuccessMessage && authView === 'login' && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-900 text-xs sm:text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{signupSuccessMessage}</p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Enter your password below to access your personal dashboard.
                </p>
              </div>
            </div>
          )}

          {/* ================= LOGIN FORM ================= */}
          {authView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* User ID Field */}
              <div>
                <label
                  htmlFor="login-userid"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  User ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <AtSign className="w-4 h-4" />
                  </span>
                  <input
                    id="login-userid"
                    type="text"
                    autoComplete="username"
                    value={loginUserId}
                    onChange={(e) => {
                      setLoginUserId(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="e.g. arjun_sharma"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (loginError) setLoginError(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full min-h-[46px] mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {isLoggingIn ? (
                  <span>Verifying credentials...</span>
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* New here? Sign up link */}
              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('signup');
                      setSignupSuccessMessage(null);
                      setErrors({});
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer ml-1 inline-flex items-center gap-1"
                  >
                    <span>Sign up</span>
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ================= SIGN UP FORM ================= */}
          {authView === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4" noValidate>
              {errors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Full Name Field */}
              <div>
                <label
                  htmlFor="signup-fullname"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-fullname"
                    type="text"
                    autoComplete="name"
                    value={signUpFullName}
                    onChange={(e) => {
                      setSignUpFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="e.g. Arjun Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${
                      errors.fullName
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* User ID Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signup-userid"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    User ID
                  </label>
                  <span className="text-[11px] text-slate-500">4-20 chars, letters/numbers/_</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <AtSign className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-userid"
                    type="text"
                    autoComplete="username"
                    value={signUpUserId}
                    onChange={(e) => {
                      setSignUpUserId(e.target.value);
                      if (errors.userId) setErrors((prev) => ({ ...prev, userId: undefined }));
                    }}
                    placeholder="e.g. arjun_engg"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${
                      errors.userId
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                </div>
                {errors.userId && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.userId}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signUpPassword}
                    onChange={(e) => {
                      setSignUpPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Create a strong password"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${
                      errors.password
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="signup-confirmpassword"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="signup-confirmpassword"
                    type={showSignUpConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={signUpConfirmPassword}
                    onChange={(e) => {
                      setSignUpConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Repeat password"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors ${
                      errors.confirmPassword
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-slate-300 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showSignUpConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignUpConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full min-h-[46px] mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {isSigningUp ? (
                  <span>Creating your account...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Already have an account link */}
              <div className="pt-3 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView('login');
                      setErrors({});
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer ml-1"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Security Assurance Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Web Crypto PBKDF2 salted hash · Isolated user storage</span>
        </div>
      </div>
    </div>
  );
}
