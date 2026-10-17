import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  History,
  BarChart3,
  HeartHandshake,
  ChevronRight,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'new-incident' | 'case-history' | 'evaluation';

interface NavSection {
  header: string;
  items: Array<{
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }>;
}

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navSections: NavSection[] = [
    {
      header: 'QUICK ACTIONS',
      items: [
        {
          id: 'new-incident',
          label: 'New Incident',
          icon: <ShieldAlert className="w-4 h-4" />,
          badge: 'Live',
        },
      ],
    },
    {
      header: 'MONITOR',
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'case-history',
          label: 'Case History',
          icon: <History className="w-4 h-4" />,
          badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
        },
      ],
    },
    {
      header: 'QUALITY',
      items: [
        {
          id: 'evaluation',
          label: 'Evaluation',
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer (Fixed slide-over on mobile, static on desktop) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 h-screen max-h-screen overflow-y-auto border-r border-slate-800 transition-transform duration-300 ease-out shadow-2xl md:shadow-none selection:bg-teal-500/30 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-teal-950/40">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 leading-none">
                eSahaay
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-none">
                Intelligent Helpline Triage
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.header} className="mb-2">
              <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase px-3 pt-3 pb-1">
                {section.header}
              </div>
              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group active:scale-98 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/50'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={
                          isActive
                            ? 'text-white shrink-0'
                            : 'text-slate-400 group-hover:text-teal-400 transition-colors shrink-0'
                        }
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold leading-none ${
                            isActive
                              ? 'bg-teal-700 text-teal-100'
                              : 'bg-slate-800 text-teal-400 border border-teal-500/20'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-teal-200" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
