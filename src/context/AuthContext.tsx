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
  const [user, setUser] = useState<User | null>(null);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [slack, setSlack] = useState<SlackInfo>({ connected: false });
  const [oauthConfigured, setOauthConfigured] = useState({ google: false, slack: false });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      // First fetch public auth config so login knows if Google/Slack are configured
      try {
        const configRes = await api.get('/api/auth/config');
        setOauthConfigured(configRes.data || { google: false, slack: false });
      } catch {
        // Fallback silently if config endpoint fails
      }

      const res = await api.get('/api/me');
      setUser(res.data.user);
      setSenders(res.data.senders || []);
      setSlack(res.data.slack || { connected: false });
      if (res.data.oauthConfigured) {
        setOauthConfigured(res.data.oauthConfigured);
      }
    } catch (err) {
      if (window.location.search.includes('demo=1')) {
        try {
          await api.post('/auth/demo-login', {
            email: 'oliver.brown@domain.io',
            name: 'Oliver Brown',
          });
          const retryRes = await api.get('/api/me');
          setUser(retryRes.data.user);
          setSenders(retryRes.data.senders || []);
          setSlack(retryRes.data.slack || { connected: false });
          if (retryRes.data.oauthConfigured) {
            setOauthConfigured(retryRes.data.oauthConfigured);
          }
        } catch {
          setUser(null);
        }
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
    try {
      const res = await api.post('/auth/demo-login', { email, name });
      if (res.data?.token) {
        localStorage.setItem('reachinbox_token', res.data.token);
      }
      await fetchCurrentUser();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleCredential = async (
    credential?: string,
    profile?: { email: string; name: string; avatar?: string }
  ) => {
    setIsLoading(true);
    try {
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
        throw new Error('Google account did not provide an email address');
      }

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
          await fetchCurrentUser();
          return;
        }
      } catch (err) {
        console.warn('[Backend Auth Failed, Using Local Session]', err);
      }

      // Standalone session fallback
      const localUser: User = {
        id: 'google_' + Date.now(),
        email: resolvedEmail,
        name: resolvedName || resolvedEmail.split('@')[0],
        avatar: resolvedAvatar || null,
        createdAt: new Date().toISOString(),
      };
      setUser(localUser);
      localStorage.setItem('reachinbox_user', JSON.stringify(localUser));
      setSenders([
        {
          id: 'sender_' + Date.now(),
          userId: localUser.id,
          email: localUser.email,
          name: localUser.name,
          hourlyLimit: 100,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('reachinbox_token');
      localStorage.removeItem('reachinbox_user');
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
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
