import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import type { DisplayConfig, WidgetConfig } from '../lib/config';
import type { DashboardHistoryEntry } from '../lib/dashboard-history';
import WidgetsTab from './WidgetsTab';
import SettingsTab from './SettingsTab';
import PresetsTab from './PresetsTab';

export interface ConfigureSidebarProps {
  config: DisplayConfig;
  setConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;
  isMobile: boolean;
  mobileSidebarOpen: boolean;
  sidebarTab: 'widgets' | 'settings' | 'presets';
  setSidebarTab: (tab: 'widgets' | 'settings' | 'presets') => void;
  setShowWidgetLibrary: (show: boolean) => void;
  setEditingWidget: (widget: WidgetConfig | null) => void;
  removeWidget: (id: string) => void;
  placementError: string | null;
  offGridIds: Set<string>;
  offGridCount: number;
  layoutIssueIds: Set<string>;
  layoutIssueCount: number;
  recentDashboards: DashboardHistoryEntry[];
  historyState: 'loading' | 'ready';
  setHistoryState: (state: 'loading' | 'ready') => void;
  refreshDashboardHistory: () => Promise<void>;
  hydrateEditorState: (config: DisplayConfig) => void;
  currentConfigSignature: string;
  aspectRatio: number;
  setAspectRatio: (ratio: number) => void;
  className?: string;
  style?: CSSProperties;
  renderTab?: (props: { key: string; label: string; isActive: boolean; onClick: () => void }) => ReactNode;
}

export default function ConfigureSidebar({
  config,
  setConfig,
  isMobile,
  mobileSidebarOpen,
  sidebarTab,
  setSidebarTab,
  setShowWidgetLibrary,
  setEditingWidget,
  removeWidget,
  placementError,
  offGridIds,
  offGridCount,
  layoutIssueIds,
  layoutIssueCount,
  recentDashboards,
  historyState,
  setHistoryState,
  refreshDashboardHistory,
  hydrateEditorState,
  currentConfigSignature,
  aspectRatio,
  setAspectRatio,
  className,
  style,
  renderTab,
}: ConfigureSidebarProps) {
  return (
    <aside className={`${
      isMobile
        ? `absolute top-0 left-0 bottom-0 z-40 w-72 transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        : 'w-80'
    } flex-shrink-0 border-r border-[color:var(--ui-panel-border)] bg-[var(--ui-panel-soft)] flex flex-col overflow-hidden ${className ?? ''}`}
    style={{ ...(isMobile ? { backgroundColor: config.theme.background } : undefined), ...style }}>
      {/* Tab Bar */}
      <div className="flex-shrink-0 p-3 pb-0">
        <div className="flex gap-1 bg-[var(--ui-panel-bg)] rounded-lg p-1 border border-[color:var(--ui-panel-border)]">
          {([
            { key: 'widgets' as const, label: 'Widgets' },
            { key: 'settings' as const, label: 'Settings' },
            { key: 'presets' as const, label: 'Presets' },
          ]).map((tab) => {
            const isActive = sidebarTab === tab.key;
            const handleClick = () => setSidebarTab(tab.key);

            if (renderTab) {
              return <div key={tab.key}>{renderTab({ key: tab.key, label: tab.label, isActive, onClick: handleClick })}</div>;
            }

            return (
              <button
                key={tab.key}
                onClick={handleClick}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--ui-item-hover)] text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* === Widgets Tab === */}
        {sidebarTab === 'widgets' && (
          <WidgetsTab
            config={config}
            setConfig={setConfig}
            setShowWidgetLibrary={setShowWidgetLibrary}
            setEditingWidget={setEditingWidget}
            removeWidget={removeWidget}
            placementError={placementError}
            offGridIds={offGridIds}
            offGridCount={offGridCount}
            layoutIssueIds={layoutIssueIds}
            layoutIssueCount={layoutIssueCount}
          />
        )}

        {/* === Settings Tab === */}
        {sidebarTab === 'settings' && (
          <SettingsTab config={config} setConfig={setConfig} />
        )}

        {/* === Presets Tab === */}
        {sidebarTab === 'presets' && (
          <PresetsTab
            config={config}
            recentDashboards={recentDashboards}
            historyState={historyState}
            setHistoryState={setHistoryState}
            refreshDashboardHistory={refreshDashboardHistory}
            hydrateEditorState={hydrateEditorState}
            currentConfigSignature={currentConfigSignature}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
          />
        )}

      </div>
    </aside>
  );
}
