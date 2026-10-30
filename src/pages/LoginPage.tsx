import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';

const GOOGLE_CLIENT_ID =
  '1053598673416-qo3c08q2o7vq6kjbil1ffes2tfqfd8ip.apps.googleusercontent.com';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const { loginWithDemo, loginWithGoogleCredential } = useAuth();

  const [email, setEmail] = useState('oliver.brown@domain.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleClient, setGoogleClient] = useState<any>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGoogle = () => {
      const google = (window as any).google;
      if (!google?.accounts) return;

      // 1. Google Identity Services ID Token initialization
      try {
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

        // Render official Google button
        if (googleBtnRef.current) {
          google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320,
          });
        }
      } catch (err) {
        console.warn('[Google ID Init Warning]', err);
      }

      // 2. Google OAuth 2.0 Token Client for direct popup authentication
      try {
        if (google.accounts.oauth2) {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            callback: async (tokenResponse: any) => {
              if (tokenResponse?.access_token) {
                setIsSubmitting(true);
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  const profile = await userInfoRes.json();
                  if (profile?.email) {
                    await loginWithGoogleCredential(undefined, {
                      email: profile.email,
                      name: profile.name || profile.email.split('@')[0],
                      avatar: profile.picture,
                    });
                    window.location.href = '/dashboard';
                  }
                } catch (e) {
                  console.error('[Google UserInfo Fetch Error]', e);
                } finally {
                  setIsSubmitting(false);
                }
              }
            },
          });
          setGoogleClient(client);
        }
      } catch (err) {
        console.warn('[Google OAuth2 Token Client Warning]', err);
      }
    };

    if ((window as any).google?.accounts) {
      initGoogle();
    } else {
      const timer = setInterval(() => {
        if ((window as any).google?.accounts) {
          clearInterval(timer);
          initGoogle();
        }
      }, 150);
      return () => clearInterval(timer);
    }
  }, []);

  const handleGoogleLoginClick = () => {
    // 1. If real Google OAuth2 Token Client popup is available, trigger it
    if (googleClient) {
      googleClient.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    // 2. Or click the official rendered Google button
    const renderedButton = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (renderedButton) {
      renderedButton.click();
      return;
    }

    // 3. Or redirect to backend OAuth endpoint
    const backendTarget = API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');
    if (backendTarget) {
      window.location.href = `${backendTarget}/auth/google`;
    } else {
      // Direct to Google OAuth
      const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = window.location.origin + '/auth/google/callback';
      const options = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        prompt: 'select_account consent',
      });
      window.location.href = `${rootUrl}?${options.toString()}`;
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

        {/* Real Google Authentication Button (Exact Figma style) */}
        <button
          type="button"
          onClick={handleGoogleLoginClick}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center space-x-2.5 bg-[#E6F4EA] hover:bg-[#DCF0E2] text-slate-800 text-sm font-medium py-3 px-4 rounded-xl transition-colors active:scale-[0.99] disabled:opacity-70 cursor-pointer"
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
          <span>{isSubmitting ? 'Authenticating with Google...' : 'Login with Google'}</span>
        </button>

        {/* Hidden / Rendered Official Google Button Container */}
        <div className="w-full flex justify-center mt-3" ref={googleBtnRef} />

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
        </form>
      </div>
    </div>
  );
};
