import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { CaseHistoryPage } from './pages/CaseHistoryPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { api } from './services/api';
import type { StoredCase } from './types';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [operatorId, setOperatorId] = useState('OP-Delhi-104');
  const [activeTab, setActiveTab] = useState<NavTab>('new-incident');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [modeLabel, setModeLabel] = useState<string>('Demo Mode: Deterministic Engine');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('esahaay_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to root document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('esahaay_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('esahaay_theme', 'light');
    }
  }, [isDarkMode]);

  // Cross-page case inspection state
  const [activeCaseForInspection, setActiveCaseForInspection] = useState<StoredCase | null>(null);

  // Check health and overview on startup
  useEffect(() => {
    api.getHealth()
      .then((h) => {
        if (h.has_api_key && h.ai_provider !== 'mock') {
          setModeLabel(`Live AI: ${h.ai_provider.toUpperCase()}`);
          setIsDemoMode(false);
        } else {
          setModeLabel('Demo Mode: Deterministic Engine (No External Key)');
          setIsDemoMode(true);
        }
      })
      .catch(() => {
        setModeLabel('Demo Mode: Deterministic Engine (Offline Fallback)');
        setIsDemoMode(true);
      });

    api.getOverview()
      .then((st) => setPendingCount(st.pending_review))
      .catch(() => {});
  }, [activeTab]);

  const handleSelectCaseFromOverview = (c: StoredCase) => {
    setActiveCaseForInspection(c);
    setActiveTab('new-incident');
  };

  const handleLogin = (id: string) => {
    setOperatorId(id);
    setIsLoggedIn(true);
  };

  // Show login page before anything else
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'new-incident':
        return {
          title: 'Live Helpline Triage & Emergency Console',
          subtitle: 'Real-time call simulation, 22-language translation, situational questions, and 6-service emergency dispatch.',
        };
      case 'overview':
        return {
          title: 'Triage Dashboard',
          subtitle: 'Shift summary, pending reviews, and urgency distribution.',
        };
      case 'case-history':
        return {
          title: 'Case History',
          subtitle: 'Audit log of reviewed helpline cases.',
        };
      case 'evaluation':
        return {
          title: 'Evaluation Dashboard',
          subtitle: 'Accuracy, confusion matrix, and safety evaluation on synthetic edge cases.',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      {/* Persistent Sidebar (Slide-over on mobile, persistent on desktop) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'new-incident') {
            setActiveCaseForInspection(null);
          }
        }}
        pendingReviewCount={pendingCount}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header with Dark Mode Toggle at top right */}
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          modeLabel={modeLabel}
          isDemoMode={isDemoMode}
          operatorId={operatorId}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/60 pb-12 transition-colors duration-200">
          {activeTab === 'new-incident' && (
            <NewIncidentPage
              key={activeCaseForInspection ? activeCaseForInspection.case_id : 'new-form'}
              initialCase={activeCaseForInspection ? activeCaseForInspection.analysis : null}
              initialTranscript={activeCaseForInspection ? activeCaseForInspection.transcript : ''}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewPage
              onNavigateToNew={() => {
                setActiveCaseForInspection(null);
                setActiveTab('new-incident');
              }}
              onSelectCase={handleSelectCaseFromOverview}
            />
          )}

          {activeTab === 'case-history' && (
            <CaseHistoryPage
              onSelectCaseForReanalysis={handleSelectCaseFromOverview}
            />
          )}

          {activeTab === 'evaluation' && <EvaluationPage />}
        </main>
      </div>
    </div>
  );
};

export default App;
