import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Calendar, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SchedulePayload } from '../types';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { senders, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderEmail, setSenderEmail] = useState(senders[0]?.email || user?.email || '');
  const [senderId, setSenderId] = useState(senders[0]?.id || '');

  const [recipientsInput, setRecipientsInput] = useState('');
  const [parsedRecipients, setParsedRecipients] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [scheduleType, setScheduleType] = useState<'immediate' | 'future'>('immediate');
  const [startDateTime, setStartDateTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [maxPerHour, setMaxPerHour] = useState<number>(50);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default sender if senders loaded
  React.useEffect(() => {
    if (senders.length > 0 && !senderEmail) {
      setSenderEmail(senders[0].email);
      setSenderId(senders[0].id);
      setMaxPerHour(senders[0].hourlyLimit || 50);
    }
  }, [senders, senderEmail]);

  if (!isOpen) return null;

  // Handle file upload and parse emails
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/emails/parse-recipients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.recipients) {
        setParsedRecipients(res.data.recipients);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to parse recipients file');
    }
  };

  // Parse manual recipient text (comma, newline, or space separated)
  const handleManualRecipientsChange = (text: string) => {
    setRecipientsInput(text);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    const unique = Array.from(new Set(matches.map((e) => e.toLowerCase().trim())));
    setParsedRecipients(unique);
  };

  const handleSenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = senders.find((s) => s.id === e.target.value);
    if (selected) {
      setSenderId(selected.id);
      setSenderEmail(selected.email);
      if (selected.hourlyLimit) {
        setMaxPerHour(selected.hourlyLimit);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (parsedRecipients.length === 0) {
      setErrorMessage('Please provide at least one recipient email address or upload a CSV file.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }

    if (!body.trim()) {
      setErrorMessage('Please write the email body.');
      return;
    }

    setIsSubmitting(true);

    const payload: SchedulePayload = {
      subject: subject.trim(),
      body: body.trim(),
      recipients: parsedRecipients,
      senderEmail: senderEmail || user?.email || 'default@reachinbox.test',
      senderId: senderId || undefined,
      startTime: scheduleType === 'future' && startDateTime ? new Date(startDateTime).toISOString() : null,
      delaySeconds: Number(delaySeconds) || 0,
      maxPerHour: Number(maxPerHour) || 50,
    };

    try {
      await api.post('/api/emails/schedule', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to schedule emails'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Compose New Email Campaign</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              BullMQ Scheduler
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sender Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sender Account
              </label>
              <select
                value={senderId}
                onChange={handleSenderChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-slate-900"
              >
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
                {!senders.length && (
                  <option value="">{user?.email || 'Default Sender'}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Hourly Limit (Per Sender)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={maxPerHour}
                onChange={(e) => setMaxPerHour(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">Atomic Redis rate-limiting enforcement</p>
            </div>
          </div>

          {/* Recipients Section */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Recipients (CSV or Manual Text)
              </label>
              <span className="text-xs font-semibold text-slate-900">
                {parsedRecipients.length} valid recipient{parsedRecipients.length === 1 ? '' : 's'} detected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              {/* File Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-black/50 hover:bg-slate-50/50 transition-colors flex flex-col items-center justify-center min-h-[90px]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-700">
                  {uploadedFileName ? uploadedFileName : 'Upload CSV / TXT file'}
                </span>
                <span className="text-[10px] text-slate-400">Comma, space, or newline separated</span>
              </div>

              {/* Manual Input Area */}
              <div>
                <textarea
                  value={recipientsInput}
                  onChange={(e) => handleManualRecipientsChange(e.target.value)}
                  placeholder="Paste emails directly: user1@domain.com, user2@domain.com..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none placeholder:text-slate-400 text-slate-900"
                />
              </div>
            </div>

            {/* Recipients Preview Chips */}
            {parsedRecipients.length > 0 && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 max-h-24 overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {parsedRecipients.slice(0, 15).map((email, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    >
                      {email}
                    </span>
                  ))}
                  {parsedRecipients.length > 15 && (
                    <span className="text-[11px] text-slate-500 self-center font-medium">
                      +{parsedRecipients.length - 15} more...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Follow-up: Q4 Strategy Discussion"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Body (Plain Text or HTML)
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi there, hope you're having a productive week..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Timing & Delay Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dispatch Schedule
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setScheduleType('immediate')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    scheduleType === 'immediate'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Send Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('future')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    scheduleType === 'future'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Schedule Later
                </button>
              </div>
            </div>

            {scheduleType === 'future' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required={scheduleType === 'future'}
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Delay Between Sends
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-slate-900 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  seconds
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedRecipients.length === 0}
              className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling via BullMQ...
                </>
              ) : (
                `Schedule ${parsedRecipients.length} Email${parsedRecipients.length === 1 ? '' : 's'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
