import React, { useState } from 'react';
import { Clock, Send, ChevronDown, Activity, MessageSquare, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: 'scheduled' | 'sent';
  onTabChange: (tab: 'scheduled' | 'sent') => void;
  onOpenCompose: () => void;
  onOpenSlackModal: () => void;
  onOpenSmtpModal?: () => void;
  scheduledCount: number;
  sentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenCompose,
  onOpenSlackModal,
  onOpenSmtpModal,
  scheduledCount,
  sentCount,
}) => {
  const { user, slack, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col h-screen shrink-0 select-none">
      {/* Top Logo: ONB (from Figma reference) */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-black tracking-tighter text-slate-900 font-mono">
            0NB
          </span>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-4 mb-4 relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between p-2.5 bg-[#F9FAFB] hover:bg-slate-100/80 rounded-xl border border-slate-200/70 transition-colors text-left"
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.charAt(0) || 'O'}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.name || 'Oliver Brown'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {user?.email || 'oliver.brown@domain.io'}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-4 right-4 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200/80 py-1.5 z-40 text-xs text-slate-700">
            <a
              href="/admin/queues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3.5 py-2 hover:bg-slate-50 transition-colors"
            >
              <Activity className="w-3.5 h-3.5 mr-2 text-blue-600" />
              <span>Bull Board Queue Monitor</span>
            </a>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenSlackModal();
              }}
              className="w-full flex items-center px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-2 text-[#4A154B]" />
              <span>{slack.connected ? 'Slack: Connected' : 'Connect Slack'}</span>
            </button>
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenSmtpModal?.();
              }}
              className="w-full flex items-center px-3.5 py-2 hover:bg-slate-50 transition-colors text-left"
            >
              <Mail className="w-3.5 h-3.5 mr-2 text-[#00A651]" />
              <span>Real Email (Gmail SMTP)</span>
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={logout}
              className="w-full flex items-center px-3.5 py-2 hover:bg-rose-50 text-rose-600 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Compose Button (Figma Exact Green Pill Outline) */}
      <div className="px-4 mb-6">
        <button
          onClick={onOpenCompose}
          className="w-full py-2.5 px-4 text-sm font-semibold text-[#00A651] border border-[#00A651] rounded-full hover:bg-[#E6F4EA] transition-colors text-center active:scale-[0.99]"
        >
          Compose
        </button>
      </div>

      {/* Navigation section: CORE */}
      <div className="px-4 flex-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          CORE
        </p>
        <nav className="space-y-1">
          {/* Scheduled Nav Item */}
          <button
            onClick={() => onTabChange('scheduled')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-colors ${
              activeTab === 'scheduled'
                ? 'bg-[#E6F4EA] text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Scheduled</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {scheduledCount}
            </span>
          </button>

          {/* Sent Nav Item */}
          <button
            onClick={() => onTabChange('sent')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl transition-colors ${
              activeTab === 'sent'
                ? 'bg-[#E6F4EA] text-slate-900 font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Send className="w-4 h-4 text-slate-500" />
              <span>Sent</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {sentCount}
            </span>
          </button>
        </nav>
      </div>
    </aside>
  );
};
