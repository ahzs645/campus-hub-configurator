export { default as ConfigurePage } from './components/ConfigurePage';
export type { ConfigurePageProps } from './components/ConfigurePage';
export { default as EditableWidget } from './components/EditableWidget';
export { default as ConfigureHeader } from './components/ConfigureHeader';
export type { ConfigureHeaderProps } from './components/ConfigureHeader';
export { default as ConfigureSidebar } from './components/ConfigureSidebar';
export type { ConfigureSidebarProps } from './components/ConfigureSidebar';
export { default as WidgetsTab } from './components/WidgetsTab';
export type { WidgetsTabProps } from './components/WidgetsTab';
export { default as SettingsTab } from './components/SettingsTab';
export type { SettingsTabProps } from './components/SettingsTab';
export { default as PresetsTab } from './components/PresetsTab';
export type { PresetsTabProps } from './components/PresetsTab';
export { default as EditorArea } from './components/EditorArea';
export type { EditorAreaProps } from './components/EditorArea';
export { default as WidgetLibraryModal } from './components/WidgetLibraryModal';
export type { WidgetLibraryModalProps } from './components/WidgetLibraryModal';
export { default as ShareUrlModal } from './components/ShareUrlModal';
export type { ShareUrlModalProps } from './components/ShareUrlModal';

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

export {
  detectWidgetLayoutDiagnostics,
  equalWidgetLayoutDiagnostics,
  getOverflowEdges,
  getWidgetLayoutIssueMessage,
  hasOverflowEdges,
  hasWidgetLayoutIssue,
  EMPTY_WIDGET_LAYOUT_DIAGNOSTICS,
  EMPTY_OVERFLOW_EDGES,
  type OverflowEdges,
  type RectLike,
  type WidgetLayoutDiagnostics,
} from './lib/widget-layout-diagnostics';
