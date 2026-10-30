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

  const logout = async () => {
    try {
      localStorage.removeItem('reachinbox_token');
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
