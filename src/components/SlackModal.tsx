import React, { useState } from 'react';
import { X, MessageSquare, CheckCircle2, AlertCircle, ExternalLink, Unlink, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface SlackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SlackModal: React.FC<SlackModalProps> = ({ isOpen, onClose }) => {
  const { slack, oauthConfigured, refreshUser } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      await api.post('/api/slack/disconnect');
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect Slack');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/slack/connect';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4A154B]/10 flex items-center justify-center text-[#4A154B]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Slack Integration</h2>
              <p className="text-xs text-slate-500">Real-time rate limit notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {slack.connected ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-950">Workspace Connected</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Workspace: <span className="font-semibold">{slack.teamName || 'Active Workspace'}</span>
                  </p>
                  {slack.channelName && (
                    <p className="text-xs text-emerald-800">
                      Channel: <span className="font-semibold">#{slack.channelName}</span>
                    </p>
                  )}
                  {slack.lastNotifiedAt && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                      Last Alert Dispatched: {new Date(slack.lastNotifiedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <p className="font-semibold text-slate-900 mb-1">Automated Rate Limit Monitoring:</p>
                When any of your sender addresses reaches its hourly capacity (e.g. 100 emails/hr), an instant notification is sent to your Slack workspace and remaining emails are automatically deferred to the next hourly window without job loss.
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="inline-flex items-center text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
                >
                  <Unlink className="w-3.5 h-3.5 mr-1.5" />
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect Slack'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Connecting Slack enables automatic alerts when an email sender hits its configured hourly sending limits.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg flex items-start space-x-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>
                    No emails are ever dropped or failed when a limit is exceeded; jobs are automatically delayed to the next permitted hour window.
                  </span>
                </div>
              </div>

              {!oauthConfigured.slack && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <p className="font-semibold mb-1 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Slack OAuth Configuration Notice
                  </p>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    To connect a live workspace, add <code className="bg-amber-100 px-1 py-0.5 rounded">SLACK_CLIENT_ID</code> and <code className="bg-amber-100 px-1 py-0.5 rounded">SLACK_CLIENT_SECRET</code> to your <code className="font-mono">.env</code> file with redirect URL:
                    <br />
                    <span className="font-mono text-[10px] break-all block mt-1 text-amber-950">
                      http://localhost:3000/api/slack/callback
                    </span>
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={!oauthConfigured.slack}
                  className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-[#4A154B] rounded-lg hover:bg-[#3f1040] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Connect Slack Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
