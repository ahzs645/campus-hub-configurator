export { default as ConfigurePage } from './components/ConfigurePage';
export type { ConfigurePageProps } from './components/ConfigurePage';
export { default as EditableWidget } from './components/EditableWidget';

export {
  DEFAULT_CONFIG,
  normalizeConfig,
  encodeConfig,
  decodeConfig,
  generateShareUrl,
  generateSharePath,
  filterInBoundsLayout,
  isWidgetInBounds,
  type DisplayConfig,
  type WidgetConfig,
  type LogoConfig,
  type ShareUrlMode,
} from './lib/config';

export {
  listDashboardHistory,
  saveDashboardHistory,
  clearDashboardHistory,
  serializeDisplayConfig,
  DASHBOARD_HISTORY_LIMIT,
  type DashboardHistoryEntry,
} from './lib/dashboard-history';

export {
  DEMO_PRESETS,
  getPreset,
  type Preset,
} from './lib/presets';
