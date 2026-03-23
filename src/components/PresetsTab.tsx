import { normalizeConfig, type DisplayConfig } from '../lib/config';
import {
  clearDashboardHistory,
  type DashboardHistoryEntry,
} from '../lib/dashboard-history';
import { DEMO_PRESETS } from '../lib/presets';
import { AppIcon } from '@firstform/campus-hub-engine';

const DEFAULT_GRID_COLS = 12;
const DEFAULT_GRID_ROWS = 8;

const ASPECT_RATIOS = [
  { label: '16:9', value: 16 / 9, desc: 'Standard HD' },
  { label: '4:3', value: 4 / 3, desc: 'Traditional' },
  { label: '21:9', value: 21 / 9, desc: 'Ultrawide' },
  { label: '9:16', value: 9 / 16, desc: 'Portrait' },
];

export interface PresetsTabProps {
  config: DisplayConfig;
  recentDashboards: DashboardHistoryEntry[];
  historyState: 'loading' | 'ready';
  setHistoryState: (state: 'loading' | 'ready') => void;
  refreshDashboardHistory: () => Promise<void>;
  hydrateEditorState: (config: DisplayConfig) => void;
  currentConfigSignature: string;
  aspectRatio: number;
  setAspectRatio: (ratio: number) => void;
}

export default function PresetsTab({
  recentDashboards,
  historyState,
  setHistoryState,
  refreshDashboardHistory,
  hydrateEditorState,
  currentConfigSignature,
  aspectRatio,
  setAspectRatio,
}: PresetsTabProps) {
  return (
    <>
      <div className="bg-[var(--ui-panel-bg)] rounded-xl p-4 space-y-3 border border-[color:var(--ui-panel-border)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="text-[var(--color-accent)]">Recent Drafts</span>
            </h2>
            <p className="text-xs text-white/50">Stored in your browser local DB. Keep up to 5 previous dashboard versions.</p>
          </div>
          {recentDashboards.length > 0 && (
            <button
              onClick={() => {
                setHistoryState('loading');
                void clearDashboardHistory()
                  .then(() => refreshDashboardHistory())
                  .catch(() => setHistoryState('ready'));
              }}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Clear cache
            </button>
          )}
        </div>

        {historyState === 'loading' ? (
          <div className="text-xs text-white/40 rounded-lg border border-[color:var(--ui-item-border)] bg-[var(--ui-item-bg)] px-3 py-2">
            Loading local dashboard history...
          </div>
        ) : recentDashboards.length === 0 ? (
          <div className="text-xs text-white/40 rounded-lg border border-[color:var(--ui-item-border)] bg-[var(--ui-item-bg)] px-3 py-3">
            No cached drafts yet. Your last 5 dashboard states will appear here as you edit.
          </div>
        ) : (
          <div className="space-y-2">
            {recentDashboards.map((entry, index) => {
              const snapshot = entry.config;
              const isCurrent = entry.signature === currentConfigSignature;
              const widgetCount = snapshot.layout.length;
              const timestamp = new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(entry.savedAt);

              return (
                <button
                  key={entry.id}
                  onClick={() => hydrateEditorState(snapshot)}
                  className="w-full p-3 rounded-lg bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)] border border-[color:var(--ui-item-border)] hover:border-[var(--ui-item-border-hover)] transition-all text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {snapshot.schoolName || `Dashboard ${index + 1}`}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--ui-accent-soft)] text-[var(--color-accent)]">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/45 mt-1">{timestamp}</div>
                      <div className="text-xs text-white/55 mt-1">
                        {widgetCount} widget{widgetCount === 1 ? '' : 's'} · {snapshot.gridCols ?? DEFAULT_GRID_COLS}×{snapshot.gridRows ?? DEFAULT_GRID_ROWS} grid
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="w-3 h-3 rounded-full border border-white/15"
                        style={{ backgroundColor: snapshot.theme.primary }}
                        title="Primary color"
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/15"
                        style={{ backgroundColor: snapshot.theme.accent }}
                        title="Accent color"
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/15"
                        style={{ backgroundColor: snapshot.theme.background }}
                        title="Background color"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-[var(--ui-panel-bg)] rounded-xl p-4 space-y-3 border border-[color:var(--ui-panel-border)]">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span className="text-[var(--color-accent)]">Demo Presets</span>
        </h2>
        <p className="text-xs text-white/50">Load a pre-built layout to get started quickly</p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => hydrateEditorState(normalizeConfig(preset.config))}
              className="p-2 rounded-lg bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)] border border-[color:var(--ui-item-border)] hover:border-[var(--ui-item-border-hover)] transition-all text-left group"
            >
              <div className="mb-1">
                <AppIcon name={preset.icon} className="w-5 h-5 text-white/80" />
              </div>
              <div className="text-xs font-medium group-hover:text-[var(--color-accent)] transition-colors">{preset.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[var(--ui-panel-bg)] border border-[color:var(--ui-panel-border)] rounded-xl p-4 space-y-3">
        <h2 className="font-bold text-lg">Preview Aspect Ratio</h2>
        <div className="grid grid-cols-2 gap-2">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.label}
              onClick={() => setAspectRatio(ar.value)}
              className={`p-2 rounded-lg text-sm transition-all ${
                aspectRatio === ar.value
                  ? 'bg-[var(--ui-item-hover)] border-[var(--ui-item-border-hover)]'
                  : 'bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)] border-[color:var(--ui-item-border)]'
              } border`}
            >
              <div className="font-medium">{ar.label}</div>
              <div className="text-xs text-white/50">{ar.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
