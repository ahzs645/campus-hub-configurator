import type { DisplayConfig, ShareUrlMode } from '../lib/config';

const URL_SHARE_OPTIONS: Array<{ value: ShareUrlMode; label: string; description: string }> = [
  {
    value: 'fullscreen',
    label: 'Fullscreen URL',
    description: 'Opens /display for playback mode.',
  },
  {
    value: 'edit',
    label: 'Edit URL',
    description: 'Opens /configure with this config loaded.',
  },
];

export interface ShareUrlModalProps {
  config: DisplayConfig;
  shareUrl: string;
  shareUrlMode: ShareUrlMode;
  copied: boolean;
  setShowShareModal: (show: boolean) => void;
  handleShareUrlModeChange: (mode: ShareUrlMode) => void;
  copyUrl: () => void;
}

export default function ShareUrlModal({
  config,
  shareUrl,
  shareUrlMode,
  copied,
  setShowShareModal,
  handleShareUrlModeChange,
  copyUrl,
}: ShareUrlModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--ui-overlay)' }}
      onClick={() => setShowShareModal(false)}
    >
      <div
        className="bg-[var(--ui-panel-bg)] border border-[color:var(--ui-panel-border)] rounded-xl p-4 space-y-3 w-full max-w-lg mx-4 backdrop-blur-xl"
        style={{ backgroundColor: config.theme.background }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Share URL</h2>
          <button
            onClick={() => setShowShareModal(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--ui-item-hover)] text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {URL_SHARE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleShareUrlModeChange(option.value)}
                className={`text-left rounded-lg px-3 py-2 border transition-colors ${
                  shareUrlMode === option.value
                    ? 'border-[var(--color-accent)] bg-[var(--ui-item-hover)]'
                    : 'border-[color:var(--ui-item-border)] bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)]'
                }`}
              >
                <p className="text-sm font-semibold">{option.label}</p>
                <p className="text-[11px] text-white/55">{option.description}</p>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] text-xs font-mono"
          />
          <p className="text-xs text-white/40">{shareUrl.length.toLocaleString()} characters</p>
          <button
            onClick={copyUrl}
            className="w-full py-2 rounded-lg bg-[var(--ui-item-bg)] hover:bg-[var(--ui-item-hover)] text-sm font-medium"
          >
            {copied ? 'Copied!' : `Copy ${shareUrlMode === 'edit' ? 'Edit' : 'Fullscreen'} URL`}
          </button>
        </div>
      </div>
    </div>
  );
}
