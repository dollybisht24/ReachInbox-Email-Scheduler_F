import React from 'react';
import { Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { EmailRecord } from '../types';

interface StatsCardsProps {
  scheduledEmails: EmailRecord[];
  sentEmails: EmailRecord[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ scheduledEmails, sentEmails }) => {
  const scheduledCount = scheduledEmails.filter((e) => e.status === 'SCHEDULED').length;
  const rescheduledCount = scheduledEmails.filter(
    (e) => e.status === 'RATE_LIMITED_RESCHEDULED'
  ).length;
  const sentCount = sentEmails.filter((e) => e.status === 'SENT').length;
  const failedCount = sentEmails.filter((e) => e.status === 'FAILED').length;

  const stats = [
    {
      name: 'Scheduled Emails',
      value: scheduledCount,
      desc: 'Waiting in BullMQ queue',
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Sent Successfully',
      value: sentCount,
      desc: 'Delivered via Ethereal SMTP',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      name: 'Rate-Limit Rescheduled',
      value: rescheduledCount,
      desc: 'Deferred to next hour window',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      name: 'Failed Deliveries',
      value: failedCount,
      desc: 'Permanent SMTP failures',
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.name}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.desc}</p>
          </div>
          <div className={`w-11 h-11 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
            <stat.icon className="w-5 h-5" />
          </div>
        </div>
      ))}
    </div>
  );
};
