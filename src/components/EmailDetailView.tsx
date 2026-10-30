import React from 'react';
import { ArrowLeft, Star, Trash2, Archive, ExternalLink, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { EmailRecord } from '../types';
import { useAuth } from '../context/AuthContext';

interface EmailDetailViewProps {
  email: EmailRecord;
  onBack: () => void;
  onDelete?: (id: string) => void;
}

export const EmailDetailView: React.FC<EmailDetailViewProps> = ({ email, onBack }) => {
  const { user } = useAuth();
  const createdDate = email.sentAt ? new Date(email.sentAt) : new Date(email.scheduledAt);
  const dateFormatted = format(createdDate, 'MMM d, h:mm a');

  const senderInitial = email.sender?.name?.charAt(0) || email.senderEmail.charAt(0).toUpperCase();

  return (
    <div className="flex-1 bg-white flex flex-col h-screen overflow-y-auto">
      {/* Top Header matching Figma Image 4 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center space-x-4 min-w-0">
          <button
            onClick={onBack}
            className="p-1 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
            {email.subject}
            {email.messageId ? ` | ${email.messageId.slice(0, 15)}...` : ''}
          </h1>
        </div>

        {/* Right Action Icons & Avatar */}
        <div className="flex items-center space-x-3 text-slate-400">
          {email.etherealPreviewUrl && (
            <a
              href={email.etherealPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition-colors"
            >
              <span>View in Ethereal</span>
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </a>
          )}
          <button className="p-1.5 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Star className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Archive className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:text-rose-600 hover:bg-slate-50 rounded-full transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          {user?.avatar && (
            <img
              src={user.avatar}
              alt="User"
              className="w-7 h-7 rounded-full object-cover ml-2"
            />
          )}
        </div>
      </div>

      {/* Email Body Content */}
      <div className="px-8 py-6 max-w-4xl">
        {/* Sender Info Row */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center space-x-3.5">
            {/* Green initial circle avatar */}
            <div className="w-10 h-10 rounded-full bg-[#00A651] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {senderInitial}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">
                  {email.sender?.name || 'ReachInbox Outbox'}
                </span>
                <span className="text-xs text-slate-400">&lt;{email.senderEmail}&gt;</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
                <span>to me</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {dateFormatted}
          </div>
        </div>

        {/* Message Body */}
        <div className="text-slate-800 text-sm leading-relaxed space-y-4 whitespace-pre-line mb-8">
          {email.body}
        </div>

        {/* Highlight Callout Box (Figma Style) */}
        <div className="border-l-4 border-amber-400 bg-[#FEFCE8] p-4 rounded-r-xl space-y-1.5 text-xs text-slate-800 font-medium mb-8">
          <p className="flex items-center text-amber-900 font-bold">
            <span className="mr-1.5">⚡</span> Extremely Exclusive — Only 4 Spots Worldwide Per Year | $25,000 investment <span className="ml-1.5">⚡</span>
          </p>
          <p className="text-slate-700">
            <span className="mr-1.5">⚡</span> To explore securing your private transformation, simply reply right now with <strong className="text-slate-900">"FLY OUT FIX"</strong>.
          </p>
        </div>

        {/* Attachment Cards (Figma Image 4) */}
        <div className="pt-6 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Attachments (2 files)
          </p>
          <div className="flex items-center space-x-4">
            <div className="border border-slate-200 rounded-xl overflow-hidden w-52 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-24 bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                🎾 Tennis_Coach_Profile
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-xs font-semibold text-slate-900 truncate">Tennis_Coach_Profile.png</p>
                <p className="text-[11px] text-slate-400">1.2 MB</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden w-52 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="h-24 bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
                🎾 Tennis_Coach_Profile2
              </div>
              <div className="p-2.5 bg-white">
                <p className="text-xs font-semibold text-slate-900 truncate">Tennis_Coach_Profile2.png</p>
                <p className="text-[11px] text-slate-400">1.2 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
