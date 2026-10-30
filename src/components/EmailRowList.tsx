import React from 'react';
import { format } from 'date-fns';
import { Clock, Star, ExternalLink } from 'lucide-react';
import { EmailRecord } from '../types';

interface EmailRowListProps {
  emails: EmailRecord[];
  type: 'scheduled' | 'sent';
  onSelectEmail: (email: EmailRecord) => void;
  isLoading: boolean;
}

export const EmailRowList: React.FC<EmailRowListProps> = ({
  emails,
  type,
  onSelectEmail,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="divide-y divide-slate-100">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-4 px-6 flex items-center space-x-4 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-28" />
            <div className="h-5 bg-slate-100 rounded-full w-32" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-sm">No {type === 'scheduled' ? 'scheduled' : 'sent'} emails found.</p>
      </div>
    );
  }

  // Format recipient display name: "To: John Smith" or "To: John"
  const getRecipientLabel = (email: string) => {
    const username = email.split('@')[0];
    const formatted = username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return `To: ${formatted}`;
  };

  return (
    <div className="divide-y divide-slate-100/80">
      {emails.map((email) => {
        const scheduledDate = new Date(email.scheduledAt);
        const timeFormatted = format(scheduledDate, 'EEE h:mm:ss a');

        return (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            className="flex items-center py-3.5 px-6 hover:bg-slate-50/80 transition-colors cursor-pointer group text-xs sm:text-sm select-none"
          >
            {/* Recipient Column */}
            <div className="w-36 sm:w-44 shrink-0 font-semibold text-slate-900 truncate">
              {getRecipientLabel(email.recipient)}
            </div>

            {/* Badge Column */}
            <div className="shrink-0 mr-4">
              {type === 'scheduled' ? (
                // Figma exact peach/orange pill: 🕒 Tue 9:15:12 AM
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3C7] text-[#D97706]">
                  <Clock className="w-3.5 h-3.5 mr-1 text-[#D97706]" />
                  <span>{timeFormatted}</span>
                </span>
              ) : (
                // Figma exact gray pill: Sent
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[#4B5563]">
                  {email.status === 'FAILED' ? 'Failed' : 'Sent'}
                </span>
              )}
            </div>

            {/* Subject & Body Snippet Column */}
            <div className="flex-1 truncate mr-4">
              <span className="font-semibold text-slate-900">
                {email.subject}
                {type === 'scheduled' ? ' - Scheduled' : ''}
              </span>
              <span className="text-slate-400 font-normal">
                {' - '}
                {email.body.replace(/\n/g, ' ')}
              </span>
            </div>

            {/* Star Icon (Figma exact right side) */}
            <div className="shrink-0 flex items-center space-x-2 text-slate-300 group-hover:text-slate-400">
              {email.etherealPreviewUrl && (
                <a
                  href={email.etherealPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Open live Ethereal test message preview"
                  className="p-1 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:text-amber-400 transition-colors"
              >
                <Star className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
