import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Clock, AlertCircle, MailCheck, Send } from 'lucide-react';
import { EmailRecord, EmailStatus } from '../types';

interface EmailTableProps {
  emails: EmailRecord[];
  type: 'scheduled' | 'sent';
  isLoading: boolean;
  onOpenCompose?: () => void;
}

export const EmailTable: React.FC<EmailTableProps> = ({
  emails,
  type,
  isLoading,
  onOpenCompose,
}) => {
  const getStatusBadge = (status: EmailStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200/60 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-1.5" />
            Sending...
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <MailCheck className="w-3 h-3 mr-1" />
            Delivered
          </span>
        );
      case 'RATE_LIMITED_RESCHEDULED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
            <Clock className="w-3 h-3 mr-1" />
            Rescheduled (Limit Reached)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="divide-y divide-slate-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between animate-pulse">
              <div className="space-y-2 flex-1 max-w-sm">
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-3 bg-slate-50 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-slate-100 rounded-full w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Send className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">
          {type === 'scheduled' ? 'No scheduled emails in queue' : 'No sent email history yet'}
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          {type === 'scheduled'
            ? 'Schedule batch emails with customizable delays, hourly limits, and BullMQ persistence.'
            : 'Sent messages delivered via Ethereal SMTP will appear here with live preview inspection URLs.'}
        </p>
        {onOpenCompose && (
          <button
            onClick={onOpenCompose}
            className="inline-flex items-center px-4 py-2 text-xs font-medium text-white bg-black rounded-lg hover:bg-slate-800 transition-all shadow-xs"
          >
            + Compose Email
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Recipient</th>
              <th className="py-3.5 px-4 sm:px-6">Subject</th>
              <th className="py-3.5 px-4 sm:px-6">Sender</th>
              <th className="py-3.5 px-4 sm:px-6">
                {type === 'scheduled' ? 'Scheduled At' : 'Delivered At'}
              </th>
              <th className="py-3.5 px-4 sm:px-6">Status</th>
              {type === 'sent' && (
                <th className="py-3.5 px-4 sm:px-6 text-right">Ethereal Preview</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {emails.map((email) => {
              const displayDate =
                type === 'scheduled'
                  ? new Date(email.scheduledAt)
                  : email.sentAt
                  ? new Date(email.sentAt)
                  : new Date(email.updatedAt);

              return (
                <tr
                  key={email.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Recipient */}
                  <td className="py-4 px-4 sm:px-6 font-medium text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span className="truncate max-w-[200px]">{email.recipient}</span>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="py-4 px-4 sm:px-6 text-slate-700">
                    <div className="font-normal text-slate-900 truncate max-w-[280px]">
                      {email.subject}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[280px]">
                      {email.body.slice(0, 60)}...
                    </div>
                  </td>

                  {/* Sender */}
                  <td className="py-4 px-4 sm:px-6 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{email.senderEmail}</span>
                    {email.maxPerHour && (
                      <div className="text-[10px] text-slate-400">Limit: {email.maxPerHour}/hr</div>
                    )}
                  </td>

                  {/* Time */}
                  <td className="py-4 px-4 sm:px-6 text-xs text-slate-600 whitespace-nowrap">
                    <div>{format(displayDate, 'MMM d, yyyy')}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {format(displayDate, 'HH:mm:ss')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                    {getStatusBadge(email.status)}
                    {email.errorMessage && (
                      <p className="text-[11px] text-rose-500 mt-0.5 max-w-[180px] truncate" title={email.errorMessage}>
                        {email.errorMessage}
                      </p>
                    )}
                  </td>

                  {/* Ethereal Link (Sent tab) */}
                  {type === 'sent' && (
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      {email.etherealPreviewUrl ? (
                        <a
                          href={email.etherealPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1 rounded-md"
                        >
                          <span>View Preview</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
