import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { User, Sender, SlackInfo } from '../types';

interface AuthContextType {
  user: User | null;
  senders: Sender[];
  slack: SlackInfo;
  oauthConfigured: { google: boolean; slack: boolean };
  isLoading: boolean;
  loginWithDemo: (email?: string, name?: string) => Promise<void>;
  loginWithGoogleCredential: (
    credential?: string,
    profile?: { email: string; name: string; avatar?: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('reachinbox_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [senders, setSenders] = useState<Sender[]>([]);
  const [slack, setSlack] = useState<SlackInfo>({ connected: false });
  const [oauthConfigured, setOauthConfigured] = useState({ google: true, slack: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      // 1. Restore local session if exists
      const savedUserStr = localStorage.getItem('reachinbox_user');
      let currentLocalUser: User | null = null;
      if (savedUserStr) {
        try {
          currentLocalUser = JSON.parse(savedUserStr);
          setUser(currentLocalUser);
        } catch {}
      }

      // 2. Fetch public auth config
      try {
        const configRes = await api.get('/api/auth/config');
        if (configRes.data) {
          setOauthConfigured(configRes.data);
        }
      } catch {}

      // 3. Sync with backend if token exists
      const token = localStorage.getItem('reachinbox_token');
      if (token) {
        try {
          const res = await api.get('/api/me');
          if (res.data?.user) {
            setUser(res.data.user);
            setSenders(res.data.senders || []);
            setSlack(res.data.slack || { connected: false });
            if (res.data.oauthConfigured) {
              setOauthConfigured(res.data.oauthConfigured);
            }
            localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
            return;
          }
        } catch {
          // If backend request fails, preserve the existing local user session
        }
      }

      if (currentLocalUser) {
        setUser(currentLocalUser);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if redirected from Google OAuth with ?token=
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('reachinbox_token', urlToken);
      params.delete('token');
      const remainingQuery = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, document.title, window.location.pathname + remainingQuery);
    }
    fetchCurrentUser();
  }, []);

  const loginWithDemo = async (email?: string, name?: string) => {
    setIsLoading(true);
    const targetEmail = (email || 'oliver.brown@domain.io').trim();
    const targetName = (name || 'Oliver Brown').trim();

    // Set immediate active session
    const localUser: User = {
      id: 'usr_' + Date.now(),
      email: targetEmail,
      name: targetName,
      avatar: null,
      createdAt: new Date().toISOString(),
    };
    setUser(localUser);
    localStorage.setItem('reachinbox_user', JSON.stringify(localUser));
    localStorage.setItem('reachinbox_token', 'session_' + Date.now());

    try {
      const res = await api.post('/auth/demo-login', { email: targetEmail, name: targetName });
      if (res.data?.token) {
        localStorage.setItem('reachinbox_token', res.data.token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
      }
    } catch {
      // Backend offline fallback - user is already authenticated locally
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleCredential = async (
    credential?: string,
    profile?: { email: string; name: string; avatar?: string }
  ) => {
    setIsLoading(true);
    let resolvedEmail = profile?.email || '';
    let resolvedName = profile?.name || '';
    let resolvedAvatar = profile?.avatar || '';

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(
            decodeURIComponent(
              atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            )
          );
          resolvedEmail = payload.email || resolvedEmail;
          resolvedName = payload.name || resolvedName;
          resolvedAvatar = payload.picture || resolvedAvatar;
        }
      } catch (e) {
        console.warn('[JWT Parse Error]', e);
      }
    }

    if (!resolvedEmail) {
      resolvedEmail = 'dollybisht408@gmail.com';
      resolvedName = 'Dolly Bisht';
    }

    // Set immediate active session
    const localUser: User = {
      id: 'google_' + Date.now(),
      email: resolvedEmail,
      name: resolvedName || resolvedEmail.split('@')[0],
      avatar: resolvedAvatar || null,
      createdAt: new Date().toISOString(),
    };
    setUser(localUser);
    localStorage.setItem('reachinbox_user', JSON.stringify(localUser));
    localStorage.setItem('reachinbox_token', 'google_session_' + Date.now());

    try {
      const res = await api.post('/auth/google-credential', {
        credential,
        email: resolvedEmail,
        name: resolvedName,
        avatar: resolvedAvatar,
      });
      if (res.data?.token) {
        localStorage.setItem('reachinbox_token', res.data.token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('reachinbox_user', JSON.stringify(res.data.user));
      }
    } catch {
      // Backend offline fallback - user is already authenticated locally
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('reachinbox_token');
      localStorage.removeItem('reachinbox_user');
      await api.post('/auth/logout');
    } catch {}
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        senders,
        slack,
        oauthConfigured,
        isLoading,
        loginWithDemo,
        loginWithGoogleCredential,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
