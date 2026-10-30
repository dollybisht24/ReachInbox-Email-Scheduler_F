import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { EmailRecord } from '../types';
import { Sidebar } from '../components/Sidebar';
import { TopSearchBar } from '../components/TopSearchBar';
import { EmailRowList } from '../components/EmailRowList';
import { EmailDetailView } from '../components/EmailDetailView';
import { ComposeView } from '../components/ComposeView';
import { SlackModal } from '../components/SlackModal';
import { SmtpModal } from '../components/SmtpModal';

interface DashboardPageProps {
  initialView?: 'list' | 'detail' | 'compose';
}

const DEFAULT_SCHEDULED: EmailRecord[] = [
  {
    id: 'sch_1',
    userId: 'usr_default',
    senderEmail: 'oliver.brown@domain.io',
    recipient: 'jessica.clark@domain.io',
    subject: 'Partnership Opportunity with ReachInbox',
    body: 'Hi Jessica,\n\nI came across your profile and was impressed by your work at domain.io. I wanted to reach out and explore potential collaboration opportunities between our teams.\n\nLooking forward to hearing from you,\nOliver',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    delaySeconds: 1,
    maxPerHour: 50,
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sch_2',
    userId: 'usr_default',
    senderEmail: 'oliver.brown@domain.io',
    recipient: 'alex.rivera@techcorp.com',
    subject: 'Quick question regarding AI SDR workflows',
    body: 'Hey Alex,\n\nAre you available for a 10-minute chat this Thursday to discuss outbound email infrastructure?\n\nBest,\nOliver',
    status: 'SCHEDULED',
    scheduledAt: new Date(Date.now() + 7200000).toISOString(),
    delaySeconds: 2,
    maxPerHour: 50,
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_SENT: EmailRecord[] = [
  {
    id: 'sent_1',
    userId: 'usr_default',
    senderEmail: 'oliver.brown@domain.io',
    recipient: 'michael.scott@dundermifflin.com',
    subject: 'Follow up: ReachInbox Email Automation',
    body: 'Hi Michael,\n\nFollowing up on our scheduled demo earlier today. Here are the notes from our discussion.\n\nCheers,\nOliver',
    status: 'SENT',
    scheduledAt: new Date(Date.now() - 7200000).toISOString(),
    sentAt: new Date(Date.now() - 3600000).toISOString(),
    delaySeconds: 1,
    maxPerHour: 50,
    attempts: 1,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ initialView = 'list' }) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailRecord[]>(DEFAULT_SCHEDULED);
  const [sentEmails, setSentEmails] = useState<EmailRecord[]>(DEFAULT_SENT);
  const [filteredEmails, setFilteredEmails] = useState<EmailRecord[]>([]);

  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Navigation States
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'compose'>(initialView);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await api.get('/api/emails/scheduled');
      if (res.data?.emails && res.data.emails.length > 0) {
        setScheduledEmails(res.data.emails);
        return;
      }
    } catch (err) {
      // Offline fallback
    } finally {
      setIsLoadingScheduled(false);
    }

    try {
      const localSaved = localStorage.getItem('reachinbox_scheduled_emails');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setScheduledEmails([...parsed, ...DEFAULT_SCHEDULED]);
          return;
        }
      }
    } catch {}

    setScheduledEmails(DEFAULT_SCHEDULED);
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const res = await api.get('/api/emails/sent');
      if (res.data?.emails && res.data.emails.length > 0) {
        setSentEmails(res.data.emails);
        return;
      }
    } catch (err) {
      // Offline fallback
    } finally {
      setIsLoadingSent(false);
    }

    try {
      const localSaved = localStorage.getItem('reachinbox_sent_emails');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSentEmails([...parsed, ...DEFAULT_SENT]);
          return;
        }
      }
    } catch {}

    setSentEmails(DEFAULT_SENT);
  }, []);

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchScheduled(), fetchSent()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchScheduled();
    fetchSent();

    const interval = setInterval(() => {
      fetchScheduled();
      fetchSent();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchScheduled, fetchSent]);

  // Handle Search Query (Elasticsearch with fallback)
  const handleSearch = async (query: string) => {
    if (!query) {
      setFilteredEmails([]);
      return;
    }

    try {
      const res = await api.get(`/api/emails/search?q=${encodeURIComponent(query)}`);
      setFilteredEmails(res.data.results || []);
    } catch (err) {
      console.error('Search error', err);
      setFilteredEmails([]);
    }
  };

  const handleSelectEmail = (email: EmailRecord) => {
    setSelectedEmail(email);
    setCurrentView('detail');
  };

  const currentList =
    filteredEmails.length > 0
      ? filteredEmails
      : activeTab === 'scheduled'
      ? scheduledEmails
      : sentEmails;

  // If Compose View is active, render full-screen without sidebar (Exact Figma Images 1 & 2)
  if (currentView === 'compose') {
    return (
      <>
        <ComposeView
          onBack={() => setCurrentView('list')}
          onSuccess={() => {
            fetchScheduled();
            setActiveTab('scheduled');
            setCurrentView('list');
          }}
          onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
        />
        <SmtpModal
          isOpen={isSmtpModalOpen}
          onClose={() => setIsSmtpModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Exact Figma Sidebar (Images 2 & 3) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setFilteredEmails([]);
          setCurrentView('list');
        }}
        onOpenCompose={() => setCurrentView('compose')}
        onOpenSlackModal={() => setIsSlackModalOpen(true)}
        onOpenSmtpModal={() => setIsSmtpModalOpen(true)}
        scheduledCount={scheduledEmails.length}
        sentCount={sentEmails.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {currentView === 'detail' && selectedEmail ? (
          /* Exact Figma Email Detail View (Image 4) */
          <EmailDetailView
            email={selectedEmail}
            onBack={() => setCurrentView('list')}
          />
        ) : (
          /* Exact Figma Email Row List (Images 2 & 3) */
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            {/* Top Search Bar */}
            <TopSearchBar
              onSearch={handleSearch}
              onRefresh={refreshAll}
              isRefreshing={isRefreshing}
            />

            {/* Email Rows List */}
            <div className="flex-1 overflow-y-auto">
              <EmailRowList
                emails={currentList}
                type={activeTab}
                onSelectEmail={handleSelectEmail}
                isLoading={activeTab === 'scheduled' ? isLoadingScheduled : isLoadingSent}
              />
            </div>
          </div>
        )}
      </div>

      {/* Slack Integration Modal */}
      <SlackModal
        isOpen={isSlackModalOpen}
        onClose={() => setIsSlackModalOpen(false)}
      />

      {/* Real Email / Gmail SMTP Configuration Modal */}
      <SmtpModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
      />
    </div>
  );
};
