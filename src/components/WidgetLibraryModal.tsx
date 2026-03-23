import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import type { DisplayConfig } from '../lib/config';
import {
  getAllWidgets,
  getWidgetTags,
  ALL_TAGS,
  AppIcon,
} from '@firstform/campus-hub-engine';

export interface WidgetLibraryModalProps {
  config: DisplayConfig;
  setConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;
  libSearch: string;
  setLibSearch: (search: string) => void;
  libTag: string | null;
  setLibTag: (tag: string | null) => void;
  setShowWidgetLibrary: (show: boolean) => void;
  addWidget: (type: string) => void;
  placementError: string | null;
  setPlacementError: (error: string | null) => void;
  hasTicker: boolean;
  className?: string;
  style?: CSSProperties;
  renderWidgetItem?: (props: { widget: any; count: number; isTicker: boolean; hasTicker: boolean; onAdd: () => void; onToggleTicker: () => void }) => ReactNode;
  renderSearchInput?: (props: { value: string; onChange: (value: string) => void }) => ReactNode;
}

export default function WidgetLibraryModal({
  config,
  setConfig,
  libSearch,
  setLibSearch,
  libTag,
  setLibTag,
  setShowWidgetLibrary,
  addWidget,
  placementError,
  setPlacementError,
  hasTicker,
  className,
  style,
  renderWidgetItem,
  renderSearchInput,
}: WidgetLibraryModalProps) {
  const availableWidgets = getAllWidgets();

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className ?? ''}`}
      style={{ backgroundColor: 'var(--ui-overlay)', ...style }}
      onClick={() => { setShowWidgetLibrary(false); setLibSearch(''); setLibTag(null); }}
    >
      <div
        className="bg-[var(--ui-panel-bg)] border border-[color:var(--ui-panel-border)] rounded-xl w-full max-w-2xl mx-4 backdrop-blur-xl flex flex-col"
        style={{ backgroundColor: config.theme.background, maxHeight: '55vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[color:var(--ui-panel-border)] flex-shrink-0">
          <h2 className="font-bold text-lg">Widget Library</h2>
          <button
            onClick={() => { setShowWidgetLibrary(false); setLibSearch(''); setLibTag(null); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--ui-item-hover)] text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search & Tag Filters */}
        <div className="px-4 pt-2 pb-2 space-y-1.5 border-b border-[color:var(--ui-panel-border)] flex-shrink-0">
          {renderSearchInput ? renderSearchInput({ value: libSearch, onChange: setLibSearch }) : (
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search widgets..."
                value={libSearch}
                onChange={(e) => setLibSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-[color:var(--ui-item-border)] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-accent)]/50"
              />
            </div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setLibTag(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                !libTag
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              All
            </button>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setLibTag(libTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  libTag === tag
                    ? 'bg-[var(--color-accent)] text-[var(--color-bg)]'
                    : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto space-y-2 min-h-0">
          {placementError && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-2">
              {placementError}
            </div>
          )}
          {availableWidgets.filter((w) => {
            const matchesSearch =
              !libSearch ||
              w.name.toLowerCase().includes(libSearch.toLowerCase()) ||
              w.description.toLowerCase().includes(libSearch.toLowerCase()) ||
              w.type.toLowerCase().includes(libSearch.toLowerCase());
            const matchesTag =
              !libTag || getWidgetTags(w.type).includes(libTag);
            return matchesSearch && matchesTag;
          }).map((widget) => {
            const count = config.layout.filter((w) => w.type === widget.type).length;
            const isTicker = widget.type === 'news-ticker';

            const onToggleTicker = () => {
              if (hasTicker) {
                setPlacementError(null);
                setConfig((prev) => ({
                  ...prev,
                  tickerEnabled: false,
                  layout: prev.layout.filter((w) => w.type !== 'news-ticker'),
                }));
              } else {
                addWidget('news-ticker');
              }
            };

            if (renderWidgetItem) {
              return <div key={widget.type}>{renderWidgetItem({ widget, count, isTicker, hasTicker, onAdd: () => addWidget(widget.type), onToggleTicker })}</div>;
            }

            return (
              <div
                key={widget.type}
                className={`p-3 rounded-lg flex items-center gap-3 border transition-all ${
                  count > 0
                    ? 'bg-[var(--ui-accent-soft)] border-[var(--ui-accent-strong)]'
                    : 'bg-[var(--ui-item-bg)] border-[color:var(--ui-item-border)]'
                }`}
              >
                <AppIcon name={widget.icon} className="w-6 h-6 text-white/90" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{widget.name}</span>
                    <div className="flex gap-1">
                      {getWidgetTags(widget.type).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/[0.06] text-white/35"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-white/50">{widget.description}</div>
                  <div className="text-xs text-white/30 mt-0.5">
                    Min {widget.minW}×{widget.minH} · Default {widget.defaultW}×{widget.defaultH}
                    {count > 0 && <span className="ml-2 text-[var(--color-accent)]">· {count} placed</span>}
                  </div>
                </div>
                {isTicker ? (
                  <button
                    onClick={onToggleTicker}
                    className={`w-10 h-5 rounded-full transition-all flex-shrink-0 ${
                      hasTicker ? 'bg-[var(--color-accent)]' : 'bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        hasTicker ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => addWidget(widget.type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)] border border-[color:var(--ui-item-border)] hover:border-[var(--ui-item-border-hover)] transition-all flex-shrink-0"
                  >
                    + Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
