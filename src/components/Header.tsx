import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Activity, MessageSquare, CheckCircle2, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCompose, onOpenSlackModal }) => {
  const { user, slack, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tighter">
              OL
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-900 tracking-tight text-base">Outbox Labs</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  ReachInbox
                </span>
              </div>
              <p className="text-xs text-slate-500">Full-Stack Email Scheduler</p>
            </div>
          </div>

          {/* Center / Action Links */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Bull Board link */}
            <a
              href="/admin/queues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              title="Open BullMQ Queue Monitoring Dashboard"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Bull Board Queue
            </a>

            {/* Slack Connection Button/Indicator */}
            <button
              onClick={onOpenSlackModal}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                slack.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-[#E01E5A]" />
              {slack.connected ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600 inline" />
                  Slack Connected
                </>
              ) : (
                'Connect Slack'
              )}
            </button>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenCompose}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              + Compose New Email
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-3">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-slate-900 leading-tight">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate max-w-[150px]">{user?.email}</div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
