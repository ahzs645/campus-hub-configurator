import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import type { DisplayConfig, WidgetConfig } from '../lib/config';
import { getWidget, AppIcon } from '@firstform/campus-hub-engine';

export interface WidgetsTabProps {
  config: DisplayConfig;
  setConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;
  setShowWidgetLibrary: (show: boolean) => void;
  setEditingWidget: (widget: WidgetConfig | null) => void;
  removeWidget: (id: string) => void;
  placementError: string | null;
  offGridIds: Set<string>;
  offGridCount: number;
  layoutIssueIds: Set<string>;
  layoutIssueCount: number;
  className?: string;
  style?: CSSProperties;
  renderWidgetItem?: (props: { widget: WidgetConfig; widgetDef: any; isOffGrid: boolean; hasLayoutIssue: boolean; onEdit: () => void; onRemove: () => void }) => ReactNode;
  renderAddButton?: (props: { onClick: () => void; theme: DisplayConfig['theme'] }) => ReactNode;
  renderEmptyState?: () => ReactNode;
}

export default function WidgetsTab({
  config,
  setConfig,
  setShowWidgetLibrary,
  setEditingWidget,
  removeWidget,
  placementError,
  offGridIds,
  offGridCount,
  layoutIssueIds,
  layoutIssueCount,
  className,
  style,
  renderWidgetItem,
  renderAddButton,
  renderEmptyState,
}: WidgetsTabProps) {
  return (
    <div className={className ?? ''} style={style}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">
          Widgets
          {config.layout.length > 0 && (
            <span className="ml-2 text-sm font-normal text-white/40">({config.layout.length})</span>
          )}
        </h2>
        {config.layout.length > 0 && (
          <button
            onClick={() => setConfig((prev) => ({ ...prev, layout: [], tickerEnabled: false }))}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {renderAddButton ? renderAddButton({ onClick: () => setShowWidgetLibrary(true), theme: config.theme }) : (
        <button
          onClick={() => setShowWidgetLibrary(true)}
          className="w-full py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ backgroundColor: config.theme.accent, color: config.theme.background }}
        >
          <span className="text-lg leading-none">+</span>
          Add Widget
        </button>
      )}

      {placementError && (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {placementError}
        </div>
      )}

      {offGridCount > 0 && (
        <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {offGridCount} widget{offGridCount > 1 ? 's' : ''} off grid — will not appear in exports or generated URLs. Scroll the preview to find {offGridCount > 1 ? 'them' : 'it'}.
        </div>
      )}

      {layoutIssueCount > 0 && (
        <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
          {layoutIssueCount} widget{layoutIssueCount > 1 ? 's show' : ' shows'} clipped content at the current preview size.
        </div>
      )}

      {config.layout.length === 0 ? (
        renderEmptyState ? renderEmptyState() : (
          <div className="text-center py-8 text-white/30">
            <div className="text-3xl mb-2">+</div>
            <p className="text-sm">No widgets yet</p>
            <p className="text-xs mt-1">Click &quot;Add Widget&quot; to get started</p>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {config.layout.map((widget) => {
            const widgetDef = getWidget(widget.type);
            if (!widgetDef) return null;
            const isOffGrid = offGridIds.has(widget.id);
            const hasLayoutIssue = layoutIssueIds.has(widget.id);

            if (renderWidgetItem) {
              return <div key={widget.id}>{renderWidgetItem({ widget, widgetDef, isOffGrid, hasLayoutIssue, onEdit: () => setEditingWidget(widget), onRemove: () => removeWidget(widget.id) })}</div>;
            }

            return (
              <div
                key={widget.id}
                className={`rounded-lg p-3 space-y-2 ${
                  isOffGrid
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : hasLayoutIssue
                      ? 'bg-amber-500/10 border border-amber-400/30'
                    : 'bg-[var(--ui-panel-bg)] border border-[color:var(--ui-panel-border)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AppIcon name={widgetDef.icon} className="w-5 h-5 text-white/90" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {widgetDef.name}
                      {isOffGrid && (
                        <span className="text-[10px] font-medium text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                          OFF GRID
                        </span>
                      )}
                      {!isOffGrid && hasLayoutIssue && (
                        <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                          CLIPPED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40">
                      {widget.w}×{widget.h} at ({widget.x}, {widget.y})
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {widgetDef.OptionsComponent && (
                      <button
                        onClick={() => setEditingWidget(widget)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--ui-item-hover)] text-white/50 hover:text-white transition-colors"
                        title="Configure"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                      title="Remove"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
