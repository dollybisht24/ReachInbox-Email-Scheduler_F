import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Paperclip,
  Clock,
  Calendar,
  ChevronDown,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  MoveVertical,
  ListOrdered,
  List,
  Indent,
  Outdent,
  Quote,
  Code2,
  Strikethrough,
  AlertCircle,
  Upload,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SchedulePayload } from '../types';

interface ComposeViewProps {
  onBack: () => void;
  onSuccess: () => void;
  initialRecipients?: string[];
  onOpenSmtpModal?: () => void;
}

export const ComposeView: React.FC<ComposeViewProps> = ({
  onBack,
  onSuccess,
  initialRecipients = [],
  onOpenSmtpModal,
}) => {
  const { user, senders } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const [fromEmail, setFromEmail] = useState(
    senders[0]?.email || user?.email || 'oliver.brown@domain.io'
  );
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState(false);

  const currentSender = senders.find(
    (s) => s.email.toLowerCase() === fromEmail.toLowerCase()
  );
  const hasRealSmtp = Boolean(currentSender?.smtpPass || currentSender?.smtpUser);

  // Recipients
  const [recipients, setRecipients] = useState<string[]>(() => {
    if (initialRecipients.length > 0) return initialRecipients;
    if (typeof window !== 'undefined' && window.location.search.includes('chips=1')) {
      return [
        'tame@jmail.com',
        'lame@jmail.com',
        'dame@jmail.com',
        'game@jmail.com',
        'name@jmail.com',
        'fame@jmail.com',
        'same@jmail.com',
      ];
    }
    return [];
  });
  const [rawToInput, setRawToInput] = useState('');
  const [isExpandedRecipientsOpen, setIsExpandedRecipientsOpen] = useState(false);

  const [subject, setSubject] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<string>('00');
  const [hourlyLimit, setHourlyLimit] = useState<string>('00');
  const [body, setBody] = useState('');

  // Send Later Popover State
  const [isSendLaterOpen, setIsSendLaterOpen] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preload Figma Demo List (Page 2 state: tame, lame, dame + 4 more)
  const handleLoadDemoList = () => {
    setRecipients([
      'tame@jmail.com',
      'lame@jmail.com',
      'dame@jmail.com',
      'game@jmail.com',
      'name@jmail.com',
      'fame@jmail.com',
      'same@jmail.com',
    ]);
    setRawToInput('');
  };

  const handleClearRecipients = () => {
    setRecipients([]);
    setRawToInput('');
    setIsExpandedRecipientsOpen(false);
  };

  // File Upload (CSV/TXT) for recipient parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/emails/parse-recipients', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.recipients && res.data.recipients.length > 0) {
        setRecipients(res.data.recipients);
        setRawToInput('');
      }
    } catch (err: any) {
      setErrorMessage('Failed to parse recipients file');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle typing recipients directly (Enter, comma, space)
  const handleToKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      const trimmed = rawToInput.trim().replace(/,$/, '');
      if (trimmed && trimmed.includes('@')) {
        if (!recipients.includes(trimmed)) {
          setRecipients([...recipients, trimmed]);
        }
        setRawToInput('');
      }
    } else if (e.key === 'Backspace' && rawToInput === '' && recipients.length > 0) {
      setRecipients(recipients.slice(0, recipients.length - 1));
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    setRecipients(recipients.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (preset.includes('10:00 AM')) {
      tomorrow.setHours(10, 0, 0, 0);
    } else if (preset.includes('11:00 AM')) {
      tomorrow.setHours(11, 0, 0, 0);
    } else if (preset.includes('3:00 PM')) {
      tomorrow.setHours(15, 0, 0, 0);
    } else {
      tomorrow.setHours(9, 0, 0, 0);
    }

    setScheduledDateTime(tomorrow.toISOString().slice(0, 16));
  };

  const handleSendOrSchedule = async () => {
    setErrorMessage(null);

    let allRecipients = [...recipients];
    if (rawToInput.trim()) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = rawToInput.match(emailRegex) || [];
      matches.forEach((email) => {
        const clean = email.toLowerCase().trim();
        if (!allRecipients.includes(clean)) allRecipients.push(clean);
      });
    }

    if (allRecipients.length === 0) {
      setErrorMessage('Please specify at least one recipient email address.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('Please enter an email subject.');
      return;
    }

    if (!body.trim()) {
      setErrorMessage('Please write your email message.');
      return;
    }

    setIsSubmitting(true);

    const delaySec = parseInt(delayBetweenEmails, 10);
    const hourlyLim = parseInt(hourlyLimit, 10);

    const payload: SchedulePayload = {
      subject: subject.trim(),
      body: body.trim(),
      recipients: allRecipients,
      senderEmail: fromEmail,
      startTime: scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null,
      delaySeconds: isNaN(delaySec) ? 0 : delaySec,
      maxPerHour: isNaN(hourlyLim) || hourlyLim < 1 ? 50 : hourlyLim,
    };

    try {
      await api.post('/api/emails/schedule', payload);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.response?.data?.error || 'Failed to schedule email'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // First 3 recipients for chips, plus count of remaining
  const visibleChips = recipients.slice(0, 3);
  const remainingCount = Math.max(0, recipients.length - 3);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col relative select-none">
      {/* Hidden File Input for CSV/TXT */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.txt"
        className="hidden"
      />

      {/* Top Header - Exact Figma Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-transparent">
        {/* Left: Arrow + Compose New Email */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onBack}>
          <button
            type="button"
            className="p-1 rounded-full text-slate-800 hover:text-black hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
          <h1 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] tracking-tight">
            Compose New Email
          </h1>
        </div>

        {/* Right Header Actions: [Paperclip 1] [Clock] [Send Later pill button] */}
        <div className="flex items-center space-x-4">
          {/* Paperclip Icon with badge 1 (Exact Figma Image 1 & 2) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach CSV / File"
            className="flex items-center text-[#00A651] hover:opacity-80 transition-opacity relative"
          >
            <Paperclip className="w-5 h-5" />
            <span className="text-[10px] font-semibold text-slate-600 leading-none -ml-0.5 mt-2">
              1
            </span>
          </button>

          {/* Clock Icon (Green circle clock) */}
          <button
            type="button"
            onClick={() => setIsSendLaterOpen(!isSendLaterOpen)}
            title="Schedule (Send Later)"
            className={`p-1 rounded-full transition-colors ${
              scheduledDateTime || isSendLaterOpen
                ? 'text-[#00A651] bg-[#E6F4EA]'
                : 'text-[#00A651] hover:bg-[#00A651]/10'
            }`}
          >
            <Clock className="w-5 h-5" />
          </button>

          {/* Send Later Pill Button (Exact Figma Green Outline Pill) */}
          <button
            type="button"
            onClick={handleSendOrSchedule}
            disabled={isSubmitting}
            className="border border-[#00A651] text-[#00A651] rounded-full px-5 py-1.5 text-sm font-medium hover:bg-[#00A651]/5 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? 'Scheduling...' : 'Send Later'}
          </button>
        </div>
      </header>

      {/* Main Content Area - Form centered with exact width & alignment */}
      <main className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 pt-4 pb-12 overflow-y-auto">
        <div className="w-full max-w-[760px] space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Delivery Mode Banner */}
          {!hasRealSmtp && (
            <div className="bg-amber-50/90 border border-amber-200/90 text-amber-900 rounded-xl p-3 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Safe Test Sandbox Mode (Ethereal):</strong> Emails are currently captured in test sandbox. To deliver directly to <strong>real Gmail inboxes</strong>, connect your Google App Password.
                </span>
              </div>
              {onOpenSmtpModal && (
                <button
                  type="button"
                  onClick={onOpenSmtpModal}
                  className="ml-3 shrink-0 px-3 py-1 bg-[#00A651] hover:bg-[#009245] text-white font-medium rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Enable Real Gmail
                </button>
              )}
            </div>
          )}

          {/* From Row */}
          <div className="flex items-center text-sm py-1">
            <span className="w-16 text-slate-800 font-medium">From</span>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsFromDropdownOpen(!isFromDropdownOpen)}
                className="bg-[#F3F4F6] hover:bg-slate-200/80 text-slate-800 text-sm font-medium px-3.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <span>{fromEmail}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Sender selection dropdown */}
              {isFromDropdownOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                  {senders.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setFromEmail(s.email);
                        setIsFromDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
                    >
                      {s.email}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFromEmail('oliver.brown@domain.io');
                      setIsFromDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors text-slate-800 font-medium"
                  >
                    oliver.brown@domain.io
                  </button>
                </div>
              )}
            </div>

            {/* Live Delivery indicator badge */}
            {hasRealSmtp ? (
              <span className="ml-3 inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live Gmail Active
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenSmtpModal}
                className="ml-3 inline-flex items-center text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                <span>Test Mode &bull; Click to Enable Real Gmail</span>
              </button>
            )}
          </div>

          {/* To Row (Exact Figma Image 1 & Image 2) */}
          <div className="flex items-center text-sm border-b border-[#F0F2F5] pb-2 relative">
            <span className="w-16 text-slate-800 font-medium shrink-0">To</span>

            <div className="flex-1 flex items-center space-x-2 min-h-[32px] overflow-hidden">
              {/* If recipients exist, render green outline chips (Image 2) */}
              {visibleChips.map((chip, index) => (
                <span
                  key={chip + index}
                  className="border border-[#00A651] bg-[#E8F5E9]/50 text-slate-800 px-3.5 py-0.5 rounded-full text-xs font-normal flex items-center space-x-1 shrink-0 group cursor-pointer"
                >
                  <span>{chip}</span>
                  <button
                    type="button"
                    onClick={() => removeRecipient(index)}
                    className="hidden group-hover:inline-flex text-slate-400 hover:text-rose-600 ml-1"
                    title="Remove recipient"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Overflow Pill: +N (Image 2: [ +4 ]) */}
              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExpandedRecipientsOpen(!isExpandedRecipientsOpen)}
                  className="border border-[#00A651] bg-[#E8F5E9]/50 text-slate-800 px-3 py-0.5 rounded-full text-xs font-normal hover:bg-[#E8F5E9] transition-colors shrink-0"
                  title="View all recipients"
                >
                  +{remainingCount}
                </button>
              )}

              {/* Text Input for entering emails */}
              <input
                ref={toInputRef}
                type="text"
                value={rawToInput}
                onChange={(e) => setRawToInput(e.target.value)}
                onKeyDown={handleToKeyDown}
                placeholder={recipients.length === 0 ? 'recipient@example.com' : ''}
                className={`text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm bg-transparent py-0.5 ${
                  recipients.length === 0 ? 'w-full' : 'w-24 shrink-0'
                }`}
              />
            </div>

            {/* Right side: [↑ Upload List] (Exact Figma button with options dropdown) */}
            <div className="relative shrink-0 ml-3">
              <button
                type="button"
                onClick={() => {
                  if (recipients.length === 0) {
                    fileInputRef.current?.click();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (recipients.length === 0) handleLoadDemoList();
                  else handleClearRecipients();
                }}
                className="flex items-center space-x-1.5 text-[#00A651] text-xs font-medium hover:opacity-80 transition-opacity"
                title="Click to Upload CSV / Right-click to toggle Figma Demo List"
              >
                <Upload className="w-3.5 h-3.5 stroke-[2]" />
                <span>Upload List</span>
              </button>
            </div>

            {/* Expanded recipients modal / dropdown when clicking +4 */}
            {isExpandedRecipientsOpen && remainingCount > 0 && (
              <div className="absolute left-16 top-10 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">
                    All Recipients ({recipients.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsExpandedRecipientsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs text-slate-700">
                  {recipients.map((email, idx) => (
                    <div
                      key={email + idx}
                      className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg hover:bg-slate-100"
                    >
                      <span className="truncate pr-2">{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Subject Row */}
          <div className="flex items-center text-sm border-b border-[#F0F2F5] pb-2">
            <span className="w-16 text-slate-800 font-medium shrink-0">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full text-slate-800 placeholder:text-slate-400 focus:outline-none text-sm bg-transparent"
            />
          </div>

          {/* Delay & Hourly Limit Row (Exact Figma Image 1 & 2) */}
          <div className="flex items-center text-sm text-slate-800 py-1">
            <div className="flex items-center space-x-2">
              <span className="font-normal text-slate-700 text-xs sm:text-sm">
                Delay between 2 emails
              </span>
              <input
                type="text"
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(e.target.value)}
                placeholder="00"
                className="w-14 py-1 text-center font-mono text-sm text-slate-700 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#00A651]"
              />
            </div>

            <div className="flex items-center space-x-2 ml-8">
              <span className="font-normal text-slate-700 text-xs sm:text-sm">
                Hourly Limit
              </span>
              <input
                type="text"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                placeholder="00"
                className="w-14 py-1 text-center font-mono text-sm text-slate-700 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#00A651]"
              />
            </div>
          </div>

          {/* Editor Area with Floating Pill Toolbar (Exact Figma Image 1 & 2) */}
          <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-slate-100 min-h-[420px] flex flex-col">
            {/* Header prompt inside editor */}
            <div className="text-slate-400 text-sm font-normal mb-2 select-none">
              Type Your Reply...
            </div>

            {/* Floating White Pill Toolbar (Exact Figma) */}
            <div className="bg-white rounded-full border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-1.5 flex items-center space-x-3 w-fit mb-3 select-none flex-wrap">
              {/* Undo / Redo */}
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Text Size TT */}
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded flex items-center space-x-0.5 transition-colors"
                title="Text Size"
              >
                <span className="font-semibold text-xs leading-none">T<sub className="font-semibold">T</sub></span>
                <ChevronsUpDown className="w-3 h-3 text-slate-400" />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Bold / Italic / Underline */}
              <button
                type="button"
                onClick={() => setBody((prev) => prev + ' **bold** ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setBody((prev) => prev + ' *italic* ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Underline"
              >
                <Underline className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Align Left */}
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Align"
              >
                <AlignLeft className="w-4 h-4" />
              </button>

              {/* Line Height / Spacing */}
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Line Height"
              >
                <MoveVertical className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Ordered & Bullet Lists */}
              <button
                type="button"
                onClick={() => setBody((prev) => prev + '\n1. ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Ordered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setBody((prev) => prev + '\n- ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>

              {/* Indent / Outdent */}
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Outdent"
              >
                <Outdent className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Indent"
              >
                <Indent className="w-4 h-4" />
              </button>

              {/* Quote */}
              <button
                type="button"
                onClick={() => setBody((prev) => prev + '\n> ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </button>

              {/* Code */}
              <button
                type="button"
                onClick={() => setBody((prev) => prev + ' `code` ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Code"
              >
                <Code2 className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200" />

              {/* Strikethrough */}
              <button
                type="button"
                onClick={() => setBody((prev) => prev + ' ~~strikethrough~~ ')}
                className="p-1 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="Strikethrough"
              >
                <Strikethrough className="w-4 h-4" />
              </button>
            </div>

            {/* Email Body Textarea */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none min-h-[280px]"
            />
          </div>
        </div>
      </main>

      {/* Send Later Popover Modal (Figma Exact Image 5) */}
      {isSendLaterOpen && (
        <div className="absolute right-6 top-16 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Send Later</h3>

          {/* Pick Date & Time Input */}
          <div className="relative mb-3">
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Choice Presets */}
          <div className="space-y-1 text-xs text-slate-600 mb-4">
            {[
              'Tomorrow',
              'Tomorrow, 10:00 AM',
              'Tomorrow, 11:00 AM',
              'Tomorrow, 3:00 PM',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  selectedPreset === preset
                    ? 'bg-[#E6F4EA] text-[#00A651] font-semibold'
                    : 'hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Popover Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setScheduledDateTime('');
                setSelectedPreset(null);
                setIsSendLaterOpen(false);
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setIsSendLaterOpen(false)}
              className="px-4 py-1 text-xs font-semibold text-[#00A651] border border-[#00A651] rounded-full hover:bg-[#E6F4EA] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
