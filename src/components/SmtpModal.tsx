import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, ExternalLink, KeyRound, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

interface SmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmtpModal: React.FC<SmtpModalProps> = ({ isOpen, onClose }) => {
  const { user, senders, refreshUser } = useAuth();

  const [senderEmail, setSenderEmail] = useState(
    senders[0]?.email || user?.email || ''
  );
  const [appPassword, setAppPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim()) {
      setError('Sender email is required');
      return;
    }
    if (!appPassword.trim()) {
      setError('Google App Password is required to send real emails');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/api/sender/smtp', {
        senderEmail: senderEmail.trim(),
        smtpUser: senderEmail.trim(),
        smtpPass: appPassword.replace(/\s+/g, ''), // remove spaces from 16-char code
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpSecure: true,
        name: user?.name || senderEmail.split('@')[0],
      });

      if (res.data.success) {
        setSuccessMessage(
          `Real email sending enabled for ${senderEmail}! Emails you send will now land in real recipients' inboxes.`
        );
        await refreshUser();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save SMTP configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00A651] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Real Email Dispatch (Gmail SMTP)</h2>
              <p className="text-xs text-slate-500">Send emails in real life directly to real inboxes</p>
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
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium">{successMessage}</div>
            </div>
          )}

          {/* Quick Explanation */}
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#00A651]" />
              <span>How to get your Google App Password (in 30 seconds):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>Make sure 2-Step Verification is turned ON for your Google Account.</li>
              <li>
                Open{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00A651] underline font-medium inline-flex items-center"
                >
                  myaccount.google.com/apppasswords
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </li>
              <li>Name the app <code className="bg-slate-200 px-1 py-0.5 rounded">ReachInbox</code> and click <strong>Create</strong>.</li>
              <li>Copy the 16-character code and paste it below.</li>
            </ol>
          </div>

          <form onSubmit={handleSaveSmtp} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Your Personal Gmail Address
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                16-Character Google App Password
              </label>
              <input
                type="password"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                required
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:bg-white font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Your password is kept securely in your local PostgreSQL database and used only by Nodemailer to dispatch your real emails.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#00A651] hover:bg-[#009245] rounded-xl transition-all shadow-sm flex items-center space-x-1.5 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save & Enable Real Sending'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
