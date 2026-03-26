import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import type { DisplayConfig } from '../lib/config';

const COLOR_PRESETS = [
  { name: 'Campus Classic', primary: '#035642', accent: '#B79527', background: '#022b21' },
  { name: 'SparkLab', primary: '#122738', accent: '#f85c14', background: '#0a1620' },
  { name: 'Crimson', primary: '#1a1a2e', accent: '#e94560', background: '#16213e' },
  { name: 'Emerald', primary: '#2d3436', accent: '#00b894', background: '#1e272e' },
  { name: 'Ocean', primary: '#2c3e50', accent: '#3498db', background: '#1a252f' },
  { name: 'Minimal', primary: '#0f0f0f', accent: '#ffffff', background: '#000000' },
  { name: 'Sandstone', primary: '#1b4332', accent: '#d4a373', background: '#081c15' },
  { name: 'Royal', primary: '#1a1040', accent: '#9b59b6', background: '#0d0a20' },
];

export interface SettingsTabProps {
  config: DisplayConfig;
  setConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;
  className?: string;
  style?: CSSProperties;
  renderColorPresetButton?: (props: { preset: { name: string; primary: string; accent: string; background: string }; isActive: boolean; onClick: () => void }) => ReactNode;
  renderInput?: (props: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) => ReactNode;
  renderSwitch?: (props: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) => ReactNode;
}

export default function SettingsTab({ config, setConfig, className, style, renderColorPresetButton, renderInput, renderSwitch }: SettingsTabProps) {
  return (
    <div className={`space-y-4 ${className ?? ''}`} style={style}>
      <div>
        <label className="block text-sm text-white/60 mb-1">School Name</label>
        {renderInput ? renderInput({ label: 'School Name', value: config.schoolName, onChange: (v) => setConfig((prev) => ({ ...prev, schoolName: v })), type: 'text' }) : (
          <input
            type="text"
            value={config.schoolName}
            onChange={(e) => setConfig((prev) => ({ ...prev, schoolName: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] focus:border-[var(--ui-item-border-hover)] outline-none"
          />
        )}
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm text-white/60 mb-1">Logo</label>
        <select
          value={config.logo?.type ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (!val) {
              setConfig((prev) => {
                const { logo: _, ...rest } = prev;
                return rest as DisplayConfig;
              });
            } else {
              setConfig((prev) => ({
                ...prev,
                logo: { type: val as 'svg' | 'url', value: prev.logo?.value ?? '' },
              }));
            }
          }}
          className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] focus:border-[var(--ui-item-border-hover)] outline-none text-sm mb-2"
        >
          <option value="">None</option>
          <option value="url">Image URL</option>
          <option value="svg">Raw SVG</option>
        </select>
        {config.logo?.type === 'url' && (
          renderInput ? renderInput({ label: 'Logo URL', value: config.logo.value, onChange: (v) => setConfig((prev) => ({ ...prev, logo: { type: 'url', value: v } })), type: 'text', placeholder: 'https://example.com/logo.svg' }) : (
            <input
              type="text"
              placeholder="https://example.com/logo.svg"
              value={config.logo.value}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  logo: { type: 'url', value: e.target.value },
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] focus:border-[var(--ui-item-border-hover)] outline-none text-sm"
            />
          )
        )}
        {config.logo?.type === 'svg' && (
          <textarea
            placeholder="<svg>...</svg>"
            value={config.logo.value}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                logo: { type: 'svg', value: e.target.value },
              }))
            }
            rows={4}
            className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] focus:border-[var(--ui-item-border-hover)] outline-none text-sm font-mono resize-y"
          />
        )}
        {config.logo?.value && (
          <div className="mt-2 p-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] flex items-center justify-center">
            {config.logo.type === 'url' ? (
              <img src={config.logo.value} alt="Logo preview" className="max-h-12 max-w-full object-contain" />
            ) : (
              <div className="max-h-12 [&>svg]:max-h-12 [&>svg]:w-auto" dangerouslySetInnerHTML={{ __html: config.logo.value }} />
            )}
          </div>
        )}
      </div>

      {/* Coming Soon Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-white/80">Coming Soon</label>
          <p className="text-xs text-white/40">Blur entire display with a &quot;Coming Soon&quot; overlay</p>
        </div>
        {renderSwitch ? renderSwitch({ label: 'Coming Soon', description: 'Blur entire display with a "Coming Soon" overlay', checked: !!config.comingSoon, onChange: (checked) => setConfig((prev) => ({ ...prev, comingSoon: checked || undefined })) }) : (
          <button
            type="button"
            role="switch"
            aria-checked={!!config.comingSoon}
            onClick={() => setConfig((prev) => ({ ...prev, comingSoon: !prev.comingSoon || undefined }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
              config.comingSoon ? 'bg-[var(--ui-switch-on)]' : 'bg-[var(--ui-switch-off)]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.comingSoon ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )}
      </div>

      {/* CORS Proxy */}
      <div>
        <label className="block text-sm text-white/60 mb-1">CORS Proxy</label>
        <p className="text-xs text-white/40 mb-1">Base URL for proxying cross-origin widget requests</p>
        {renderInput ? renderInput({ label: 'CORS Proxy', value: config.corsProxy ?? '', onChange: (v) => setConfig((prev) => ({ ...prev, corsProxy: v || undefined })), type: 'text', placeholder: 'https://cors.example.workers.dev/' }) : (
          <input
            type="text"
            placeholder="https://cors.example.workers.dev/"
            value={config.corsProxy ?? ''}
            onChange={(e) => setConfig((prev) => ({ ...prev, corsProxy: e.target.value || undefined }))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] focus:border-[var(--ui-item-border-hover)] outline-none text-sm"
          />
        )}
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-2">Color Presets</label>
        <div className="grid grid-cols-4 gap-1.5">
          {COLOR_PRESETS.map((preset) => {
            const isActive =
              config.theme.primary === preset.primary &&
              config.theme.accent === preset.accent &&
              config.theme.background === preset.background;
            const handleClick = () =>
              setConfig((prev) => ({
                ...prev,
                theme: {
                  primary: preset.primary,
                  accent: preset.accent,
                  background: preset.background,
                },
              }));

            if (renderColorPresetButton) {
              return <div key={preset.name}>{renderColorPresetButton({ preset, isActive, onClick: handleClick })}</div>;
            }

            return (
              <button
                key={preset.name}
                title={preset.name}
                onClick={handleClick}
                className={`group relative h-8 rounded-lg overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent scale-105'
                    : 'hover:scale-105'
                }`}
              >
                <div className="absolute inset-0 flex">
                  <div className="w-1/2" style={{ backgroundColor: preset.primary }} />
                  <div className="w-1/2" style={{ backgroundColor: preset.accent }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <span className="text-[9px] font-medium text-white truncate px-1">{preset.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-1">Primary</label>
          <input
            type="color"
            value={config.theme.primary}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                theme: { ...prev.theme, primary: e.target.value },
              }))
            }
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">Accent</label>
          <input
            type="color"
            value={config.theme.accent}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                theme: { ...prev.theme, accent: e.target.value },
              }))
            }
            className="w-full h-10 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
}
