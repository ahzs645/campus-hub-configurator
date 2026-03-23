import type { ChangeEvent, RefObject } from 'react';
import type { DisplayConfig } from '../lib/config';

type JsonTransferMessage = { tone: 'success' | 'error'; text: string };

export interface ConfigureHeaderProps {
  config: DisplayConfig;
  isMobile: boolean;
  importInputRef: RefObject<HTMLInputElement | null>;
  importJson: (event: ChangeEvent<HTMLInputElement>) => void;
  openImportDialog: () => void;
  exportJson: () => void;
  generateUrl: () => void;
  fullscreenPreviewUrl: string;
  jsonTransferMessage: JsonTransferMessage | null;
  headerActions?: (config: DisplayConfig) => React.ReactNode;
  setMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ConfigureHeader({
  config,
  isMobile,
  importInputRef,
  importJson,
  openImportDialog,
  exportJson,
  generateUrl,
  fullscreenPreviewUrl,
  jsonTransferMessage,
  headerActions,
  setMobileSidebarOpen,
}: ConfigureHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-[color:var(--ui-panel-border)] px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-[color:var(--ui-panel-border)] hover:bg-[var(--ui-item-hover)] transition-all flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <h1 className={`font-display font-bold flex items-center gap-2 ${isMobile ? 'text-base' : 'text-2xl gap-3'}`}>
            <span
              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.theme.accent }}
            />
            <span className="truncate">{isMobile ? 'Campus Hub' : 'Campus Hub Configurator'}</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={importJson}
              className="hidden"
            />
            <button
              onClick={openImportDialog}
              className={`rounded-lg font-medium border border-[color:var(--ui-panel-border)] hover:bg-[var(--ui-item-hover)] transition-all ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2'}`}
            >
              {isMobile ? 'Import' : 'Import JSON'}
            </button>
            <button
              onClick={exportJson}
              className={`rounded-lg font-medium border border-[color:var(--ui-panel-border)] hover:bg-[var(--ui-item-hover)] transition-all ${isMobile ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2'}`}
            >
              {isMobile ? 'Export' : 'Export JSON'}
            </button>
            {headerActions?.(config)}
            {!isMobile && (
              <>
                <button
                  onClick={generateUrl}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: config.theme.accent, color: config.theme.primary }}
                >
                  Generate URL
                </button>
                <a
                  href={fullscreenPreviewUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    if (!fullscreenPreviewUrl) event.preventDefault();
                  }}
                  className="px-4 py-2 rounded-lg font-medium border border-[color:var(--ui-panel-border)] hover:bg-[var(--ui-item-hover)] transition-all"
                >
                  Open Fullscreen
                </a>
              </>
            )}
          </div>
          {jsonTransferMessage && (
            <p
              className={`text-xs ${
                jsonTransferMessage.tone === 'success' ? 'text-emerald-300' : 'text-red-300'
              }`}
            >
              {jsonTransferMessage.text}
            </p>
          )}
        </div>
      </div>
      {/* Mobile-only secondary actions */}
      {isMobile && (
        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[color:var(--ui-panel-border)]">
          <button
            onClick={generateUrl}
            className="flex-1 px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all"
            style={{ backgroundColor: config.theme.accent, color: config.theme.primary }}
          >
            Generate URL
          </button>
          <a
            href={fullscreenPreviewUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              if (!fullscreenPreviewUrl) event.preventDefault();
            }}
            className="flex-1 px-2.5 py-1.5 rounded-lg font-medium text-xs border border-[color:var(--ui-panel-border)] hover:bg-[var(--ui-item-hover)] transition-all text-center"
          >
            Open Fullscreen
          </a>
        </div>
      )}
    </header>
  );
}
