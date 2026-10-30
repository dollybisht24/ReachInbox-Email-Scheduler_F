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

export const DashboardPage: React.FC<DashboardPageProps> = ({ initialView = 'list' }) => {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailRecord[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailRecord[]>([]);
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
      setScheduledEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch scheduled emails', err);
    } finally {
      setIsLoadingScheduled(false);
    }
  }, []);

  const fetchSent = useCallback(async () => {
    try {
      const res = await api.get('/api/emails/sent');
      setSentEmails(res.data.emails || []);
    } catch (err) {
      console.error('Failed to fetch sent emails', err);
    } finally {
      setIsLoadingSent(false);
    }
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
