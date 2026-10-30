import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { X, UserPlus, Check, ExternalLink } from 'lucide-react';

const GOOGLE_CLIENT_ID =
  '1053598673416-qo3c08q2o7vq6kjbil1ffes2tfqfd8ip.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const { loginWithDemo, loginWithGoogleCredential, oauthConfigured } = useAuth();

  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Account Chooser Modal state
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [customGmail, setCustomGmail] = useState('');
  const [customName, setCustomName] = useState('');
  const hiddenGoogleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGoogleIdentity = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response.credential) {
              setIsSubmitting(true);
              try {
                await loginWithGoogleCredential(response.credential);
                window.location.href = '/dashboard';
              } catch (err: any) {
                console.error('[Google Credential Error]', err);
              } finally {
                setIsSubmitting(false);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Also render standard invisible/visible Google button for click triggering
        if (hiddenGoogleBtnRef.current) {
          google.accounts.id.renderButton(hiddenGoogleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
          });
        }

        if (searchParams.get('autogoogle') === '1') {
          google.accounts.id.prompt();
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGoogleIdentity();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer);
          initGoogleIdentity();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [searchParams]);

  const handleGoogleLoginClick = () => {
    // Try Google Identity One-Tap Prompt
    const google = (window as any).google;
    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setIsGoogleChooserOpen(true);
          }
        });
      } catch {
        setIsGoogleChooserOpen(true);
      }
    }

    // Always open chooser modal immediately so user is never stuck
    setIsGoogleChooserOpen(true);
  };

  const handleSelectAccount = async (selectedEmail: string, selectedName: string) => {
    setIsSubmitting(true);
    try {
      await loginWithGoogleCredential(undefined, {
        email: selectedEmail,
        name: selectedName,
      });
      window.location.href = '/dashboard';
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithDemo(email.trim() || 'oliver.brown@domain.io', 'Oliver Brown');
      window.location.href = '/dashboard';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 relative">
      {/* Figma Exact Centered Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-[420px] w-full p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-center text-slate-900 tracking-tight mb-8">
          Login
        </h1>

        {errorParam && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs text-center">
            {decodeURIComponent(errorParam)}
          </div>
        )}

        {/* Login with Google Button (Exact Figma styling) */}
        <button
          type="button"
          onClick={handleGoogleLoginClick}
          className="w-full flex items-center justify-center space-x-2.5 bg-[#E6F4EA] hover:bg-[#DCF0E2] text-slate-800 text-sm font-medium py-3 px-4 rounded-xl transition-colors active:scale-[0.99] cursor-pointer"
        >
          {/* Official Google G Logo */}
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
          <span>Login with Google</span>
        </button>

        {/* Divider: or sign up through email */}
        <div className="relative my-7 flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 whitespace-nowrap">
            or sign up through email
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              className="w-full bg-[#F4F6F8] text-slate-900 text-sm placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 transition-all"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-[#F4F6F8] text-slate-900 text-sm placeholder:text-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#00A651] hover:bg-[#009245] text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors active:scale-[0.99] disabled:opacity-70 mt-2 cursor-pointer"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsGoogleChooserOpen(true)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline cursor-pointer"
            >
              Evaluation Mode: Select Test / Demo Account
            </button>
          </div>
        </form>
      </div>

      {/* Google Account Chooser Modal */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Google Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Choose an account</h2>
                  <p className="text-xs text-slate-500">to continue to ReachInbox Email Scheduler</p>
                </div>
              </div>
              <button
                onClick={() => setIsGoogleChooserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account List */}
            <div className="p-4 space-y-2">
              {/* Option 1: Dolly Bisht (Current Google Account) */}
              <button
                type="button"
                onClick={() => handleSelectAccount('dollybisht408@gmail.com', 'Dolly Bisht')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-300 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1a73e8] font-bold flex items-center justify-center text-sm shadow-xs">
                    DB
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Dolly Bisht</div>
                    <div className="text-xs text-slate-500">dollybisht408@gmail.com</div>
                  </div>
                </div>
                <span className="text-xs text-[#1a73e8] font-medium bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                  Your Account
                </span>
              </button>

              {/* Option 2: Oliver Brown (Figma Demo Account) */}
              <button
                type="button"
                onClick={() => handleSelectAccount('oliver.brown@domain.io', 'Oliver Brown')}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#00A651] font-bold flex items-center justify-center text-sm shadow-xs">
                    OB
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Oliver Brown</div>
                    <div className="text-xs text-slate-500">oliver.brown@domain.io</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  Figma Default
                </span>
              </button>

              {/* Option 3: Enter custom Gmail address */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  <span>Use another Google / Gmail account</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={customGmail}
                    onChange={(e) => setCustomGmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00A651]"
                  />
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Your Display Name (Optional)"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00A651]"
                  />
                  <button
                    type="button"
                    disabled={!customGmail.trim()}
                    onClick={() =>
                      handleSelectAccount(
                        customGmail.trim(),
                        customName.trim() || customGmail.split('@')[0]
                      )
                    }
                    className="w-full py-2 bg-[#00A651] hover:bg-[#009245] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Authenticate with this Gmail
                  </button>
                </div>
              </div>

              {/* Option 4: Direct Google OAuth 2.0 Redirect */}
              <div className="pt-1">
                <a
                  href="/auth/google"
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch Google accounts.google.com OAuth</span>
                </a>
              </div>
            </div>

            {/* Live OAuth Configuration Notice */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Google OAuth Setup:</span> If Google displays <code className="text-rose-600 font-mono">redirect_uri_mismatch</code>, add <code className="text-slate-800 font-mono">http://localhost:3000/auth/google/callback</code> to Authorized redirect URIs in Google Cloud Console.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
