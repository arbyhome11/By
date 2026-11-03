import React, { useState } from 'react';
import { Mail, Lock, User, Heart, AlertCircle, ArrowRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { signIn, signUp, signInWithGoogle } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please provide your name.');
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, displayName);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-3xl bg-[#FAF7F2] dark:bg-[#1E1B18] p-6 shadow-2xl border border-[#E8DFD5] dark:border-[#38312B] relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-2 text-[#9C8F85] hover:text-[#2D2825] dark:hover:text-white rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#C85A32] to-[#FB7185] flex items-center justify-center text-white shadow-md mb-3">
            <Heart size={24} fill="white" />
          </div>
          <h2 className="text-lg font-bold text-[#2D2825] dark:text-[#F3EFEA]">
            {mode === 'signin' ? 'Welcome Back to Me & You' : 'Start Your Private Couple Space'}
          </h2>
          <p className="text-xs text-[#7A6F66] dark:text-[#A89F95] mt-1">
            {mode === 'signin'
              ? 'Sign in to sync your reunion countdown and shared memories'
              : 'Sign up to create or join your shared distance journal'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#28231F] hover:bg-gray-50 dark:hover:bg-[#322C28] text-[#332D28] dark:text-[#F3EFEA] border border-[#D9D0C5] dark:border-[#403833] py-2.5 px-4 rounded-2xl text-xs font-semibold shadow-xs transition-all min-h-[44px] cursor-pointer mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8DFD5] dark:border-[#38312B]" />
          </div>
          <span className="relative bg-[#FAF7F2] dark:bg-[#1E1B18] px-2 text-[11px] text-[#9C8F85]">
            or with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
                Your Display Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8F85]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 pl-10 pr-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8F85]" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 pl-10 pr-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#6B6159] dark:text-[#A89F95] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9C8F85]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-[#28231F] border border-[#D9D0C5] dark:border-[#403833] rounded-2xl py-2.5 pl-10 pr-3 text-xs text-[#2D2825] dark:text-[#F3EFEA] focus:outline-none focus:border-[#C85A32] min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C85A32] hover:bg-[#B34E29] text-white py-3 rounded-2xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In</span>
                <ArrowRight size={14} />
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="text-xs text-[#C85A32] hover:underline font-medium min-h-[44px] flex items-center justify-center mx-auto cursor-pointer"
          >
            {mode === 'signin'
              ? "Don't have a space yet? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
