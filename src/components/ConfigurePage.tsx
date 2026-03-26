import { useState, useCallback, useRef, useEffect, type ChangeEvent } from 'react';
import {
  DEFAULT_CONFIG,
  normalizeConfig,
  decodeConfig,
  generateShareUrl,
  filterInBoundsLayout,
  isWidgetInBounds,
  type DisplayConfig,
  type ShareUrlMode,
  type WidgetConfig,
} from '../lib/config';
import {
  listDashboardHistory,
  saveDashboardHistory,
  serializeDisplayConfig,
  type DashboardHistoryEntry,
} from '../lib/dashboard-history';
import {
  getAllWidgets,
  getWidget,
} from '@firstform/campus-hub-engine';
import { WidgetEditDialog, EngineThemeProvider } from '@firstform/campus-hub-engine';
import type { GridStackItem } from '@firstform/campus-hub-engine';
import EditableWidget from './EditableWidget';
import ConfigureHeader from './ConfigureHeader';
import ConfigureSidebar from './ConfigureSidebar';
import EditorArea from './EditorArea';
import WidgetLibraryModal from './WidgetLibraryModal';
import ShareUrlModal from './ShareUrlModal';

type GridStackWrapperRef = { getItems: () => GridStackItem[] };

const DEFAULT_GRID_COLS = 12;
const DEFAULT_GRID_ROWS = 8;

const CONFIG_STORAGE_KEY = 'campus-hub:config';

type GridPlacement = { x: number; y: number; w: number; h: number };
type JsonTransferMessage = { tone: 'success' | 'error'; text: string };

const EXPORT_FILE_PREFIX = 'campus-hub-config';
const EXPORT_SCHEMA_VERSION = 1;
const MOBILE_ZOOM_MIN = 1;
const MOBILE_ZOOM_MAX = 3;
const MOBILE_ZOOM_STEP = 0.25;
const copyText = async (value: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to legacy copy path when clipboard API is blocked.
    }
  }

  if (typeof document === 'undefined') return false;

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';
  document.body.append(textArea);
  textArea.focus();
  textArea.select();
  const didCopy = document.execCommand('copy');
  textArea.remove();
  return didCopy;
};

const getConfigFromImport = (raw: unknown): Partial<DisplayConfig> => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid JSON payload');
  }

  if ('config' in raw && raw.config && typeof raw.config === 'object') {
    return raw.config as Partial<DisplayConfig>;
  }

  return raw as Partial<DisplayConfig>;
};

/** Remap widget positions proportionally when grid dimensions change.
 *  Uses ceil for sizes (never shrink) and floor for positions (don't overflow). */
const remapLayout = (
  layout: WidgetConfig[],
  axis: 'x' | 'y',
  prevSize: number,
  nextSize: number,
): WidgetConfig[] => {
  const ratio = nextSize / prevSize;
  const posKey = axis;                        // 'x' or 'y'
  const sizeKey = axis === 'x' ? 'w' : 'h';  // 'w' or 'h'
  const minKey = axis === 'x' ? 'minW' : 'minH';

  return layout.map((widget) => {
    const newSize = Math.max(
      getWidget(widget.type)?.[minKey] ?? 1,
      Math.ceil(widget[sizeKey] * ratio),
    );
    const clampedSize = Math.min(newSize, nextSize);
    const newPos = Math.floor(widget[posKey] * ratio);
    const clampedPos = Math.max(0, Math.min(newPos, nextSize - clampedSize));
    return { ...widget, [posKey]: clampedPos, [sizeKey]: clampedSize };
  });
};

const findPlacement = (
  layout: WidgetConfig[],
  columns: number,
  rows: number,
  desiredW: number,
  desiredH: number,
  minW: number,
  minH: number
): GridPlacement | null => {
  const grid: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => false)
  );

  layout.forEach((widget) => {
    for (let dy = 0; dy < widget.h; dy += 1) {
      for (let dx = 0; dx < widget.w; dx += 1) {
        const y = widget.y + dy;
        const x = widget.x + dx;
        if (y >= 0 && y < rows && x >= 0 && x < columns) {
          grid[y][x] = true;
        }
      }
    }
  });

  const canFit = (x: number, y: number, w: number, h: number) => {
    if (x + w > columns || y + h > rows) return false;
    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) {
        if (grid[y + dy][x + dx]) return false;
      }
    }
    return true;
  };

  for (let h = desiredH; h >= minH; h -= 1) {
    for (let w = desiredW; w >= minW; w -= 1) {
      for (let y = 0; y <= rows - h; y += 1) {
        for (let x = 0; x <= columns - w; x += 1) {
          if (canFit(x, y, w, h)) return { x, y, w, h };
        }
      }
    }
  }

  return null;
};

export interface ConfigurePageProps {
  /** Initial config to load into the editor */
  initialConfig?: DisplayConfig;
  /** Called whenever the config changes */
  onChange?: (config: DisplayConfig) => void;
  /** Render custom actions in the header (e.g. a Save button) */
  headerActions?: (config: DisplayConfig) => React.ReactNode;
  /** Whether to load/save from URL params and localStorage (default: true) */
  enableBrowserPersistence?: boolean;
}

export default function ConfigurePage({
  initialConfig,
  onChange,
  headerActions,
  enableBrowserPersistence = true,
}: ConfigurePageProps = {}) {
  const [config, setConfigRaw] = useState<DisplayConfig>(initialConfig ?? DEFAULT_CONFIG);

  const setConfig: typeof setConfigRaw = useCallback((updater) => {
    setConfigRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
  }, []);
  const [hasLoadedInitialConfig, setHasLoadedInitialConfig] = useState(false);
  const [recentDashboards, setRecentDashboards] = useState<DashboardHistoryEntry[]>([]);
  const [historyState, setHistoryState] = useState<'loading' | 'ready'>('loading');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [fullscreenPreviewUrl, setFullscreenPreviewUrl] = useState<string>('');
  const [shareUrlMode, setShareUrlMode] = useState<ShareUrlMode>('fullscreen');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonTransferMessage, setJsonTransferMessage] = useState<JsonTransferMessage | null>(null);
  const [aspectRatio, setAspectRatioRaw] = useState(config.aspectRatio ?? 16 / 9);
  const setAspectRatio = useCallback((ratio: number) => {
    setAspectRatioRaw(ratio);
    setConfig((prev) => ({ ...prev, aspectRatio: ratio }));
  }, []);
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [placementError, setPlacementError] = useState<string | null>(null);
  const [gridRows, setGridRows] = useState(DEFAULT_CONFIG.gridRows ?? DEFAULT_GRID_ROWS);
  const [gridCols, setGridCols] = useState(DEFAULT_CONFIG.gridCols ?? DEFAULT_GRID_COLS);
  const [sidebarTab, setSidebarTab] = useState<'widgets' | 'settings' | 'presets'>('widgets');
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [libTag, setLibTag] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileZoom, setMobileZoom] = useState(MOBILE_ZOOM_MIN);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridStackWrapperRef>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const currentConfigSignature = serializeDisplayConfig(config);

  const hydrateEditorState = useCallback((nextConfig: DisplayConfig) => {
    setConfig(nextConfig);
    setEditingWidget(null);
    setPlacementError(null);
    setShowShareModal(false);
    setShareUrl('');
    setCopied(false);
  }, []);

  const refreshDashboardHistory = useCallback(async () => {
    try {
      const entries = await listDashboardHistory();
      setRecentDashboards(entries);
    } finally {
      setHistoryState('ready');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const availableWidgets = getAllWidgets();
  const hasTicker = config.layout.some((widget) => widget.type === 'news-ticker');

  // Notify parent of config changes
  useEffect(() => {
    onChange?.(config);
  }, [config, onChange]);

  useEffect(() => {
    if (!enableBrowserPersistence) {
      setHasLoadedInitialConfig(true);
      void refreshDashboardHistory();
      return;
    }
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const loadInitialConfig = async () => {
      try {
        const configParam = new URLSearchParams(window.location.search).get('config');
        if (configParam) {
          const decoded = await decodeConfig(configParam);
          if (decoded && !cancelled) {
            setConfig(decoded);
            if (decoded.aspectRatio) setAspectRatioRaw(decoded.aspectRatio);
            return;
          }
        }
        const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (saved && !cancelled) {
          const parsed = JSON.parse(saved) as DisplayConfig;
          const normalized = normalizeConfig(parsed);
          setConfig(normalized);
          if (normalized.aspectRatio) setAspectRatioRaw(normalized.aspectRatio);
        }
      } catch {
        // Ignore corrupted cache
      } finally {
        if (!cancelled) {
          setHasLoadedInitialConfig(true);
        }
      }
    };

    void loadInitialConfig();
    void refreshDashboardHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshDashboardHistory, enableBrowserPersistence]);

  useEffect(() => {
    if (!enableBrowserPersistence || !hasLoadedInitialConfig || typeof window === 'undefined') return;
    const timeout = setTimeout(() => {
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
      } catch {
        // Ignore storage failures (quota, private mode)
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [config, hasLoadedInitialConfig, enableBrowserPersistence]);

  useEffect(() => {
    if (!hasLoadedInitialConfig) return;
    const timeout = setTimeout(() => {
      void saveDashboardHistory(config)
        .then((entries) => {
          setRecentDashboards(entries);
          setHistoryState('ready');
        })
        .catch(() => {
          setHistoryState('ready');
        });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [config, hasLoadedInitialConfig]);

  useEffect(() => {
    if (!config.gridRows) return;
    if (config.gridRows !== gridRows) {
      setGridRows(config.gridRows);
    }
  }, [config.gridRows, gridRows]);

  useEffect(() => {
    if (!config.gridCols) return;
    if (config.gridCols !== gridCols) {
      setGridCols(config.gridCols);
    }
  }, [config.gridCols, gridCols]);

  useEffect(() => {
    if (config.aspectRatio && config.aspectRatio !== aspectRatio) {
      setAspectRatioRaw(config.aspectRatio);
    }
  }, [config.aspectRatio]);

  useEffect(() => {
    if (!jsonTransferMessage) return;
    const timeout = setTimeout(() => setJsonTransferMessage(null), 3500);
    return () => clearTimeout(timeout);
  }, [jsonTransferMessage]);

  // Calculate preview size to fit container while maintaining aspect ratio
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const updateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      if (containerWidth <= 0 || containerHeight <= 0) return;

      let width, height;
      if (containerWidth / containerHeight > aspectRatio) {
        height = containerHeight;
        width = height * aspectRatio;
      } else {
        width = containerWidth;
        height = width / aspectRatio;
      }

      setPreviewSize((prev) => {
        const nextWidth = Math.round(width * 100) / 100;
        const nextHeight = Math.round(height * 100) / 100;
        if (
          Math.abs(prev.width - nextWidth) < 0.5 &&
          Math.abs(prev.height - nextHeight) < 0.5
        ) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const queueUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateSize();
      });
    };

    queueUpdate();
    window.addEventListener('resize', queueUpdate);

    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => queueUpdate());
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', queueUpdate);
      resizeObserver?.disconnect();
    };
  }, [aspectRatio]);

  // Convert config.layout to GridStack items
  const gridItems: GridStackItem[] = config.layout.map((widget) => {
    const widgetDef = getWidget(widget.type);
    return {
      id: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: widgetDef?.minW,
      minH: widgetDef?.minH,
      maxW: widgetDef?.maxW,
      maxH: widgetDef?.maxH,
    };
  });
  const offGridIds = new Set(
    config.layout
      .filter((w) => !isWidgetInBounds(w, gridCols, gridRows))
      .map((w) => w.id),
  );
  const offGridCount = offGridIds.size;

  const addWidget = useCallback((type: string) => {
    const widgetDef = availableWidgets.find((w) => w.type === type);
    if (!widgetDef) return;

    setConfig((prev) => {
      const minW = widgetDef.minW ?? 1;
      const minH = widgetDef.minH ?? 1;
      const maxW = widgetDef.maxW ?? gridCols;
      const maxH = widgetDef.maxH ?? gridRows;
      const desiredW = Math.min(widgetDef.defaultW, maxW, gridCols);
      const desiredH = Math.min(widgetDef.defaultH, maxH, gridRows);

      const placement = findPlacement(
        prev.layout,
        gridCols,
        gridRows,
        desiredW,
        desiredH,
        minW,
        minH
      );

      if (!placement) {
        setPlacementError('No space available. Move or resize a widget to make room.');
        return prev;
      }

      setPlacementError(null);

      const newWidget: WidgetConfig = {
        id: `${type}-${Date.now()}`,
        type: type as WidgetConfig['type'],
        x: placement.x,
        y: placement.y,
        w: placement.w,
        h: placement.h,
        props: widgetDef.defaultProps || {},
      };

      return {
        ...prev,
        tickerEnabled: type === 'news-ticker' ? true : prev.tickerEnabled,
        layout: [...prev.layout, newWidget],
      };
    });
  }, [availableWidgets, gridRows]);

  const removeWidget = useCallback((id: string) => {
    setPlacementError(null);
    setConfig((prev) => {
      const nextLayout = prev.layout.filter((w) => w.id !== id);
      return {
        ...prev,
        tickerEnabled: nextLayout.some((widget) => widget.type === 'news-ticker'),
        layout: nextLayout,
      };
    });
  }, [placementError]);

  const handleLayoutChange = useCallback((items: GridStackItem[]) => {
    if (placementError) setPlacementError(null);
    setConfig((prev) => ({
      ...prev,
      layout: prev.layout.map((widget) => {
        const item = items.find((i) => i.id === widget.id);
        if (item) {
          return {
            ...widget,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          };
        }
        return widget;
      }),
    }));
  }, []);

  const handleEditWidget = useCallback((widgetId: string) => {
    const widget = config.layout.find((w) => w.id === widgetId);
    if (widget) {
      setEditingWidget(widget);
    }
  }, [config.layout]);

  const handleSaveWidgetOptions = useCallback((widgetId: string, data: Record<string, unknown>, comingSoon: boolean) => {
    setConfig((prev) => ({
      ...prev,
      layout: prev.layout.map((widget) =>
        widget.id === widgetId ? { ...widget, props: data, comingSoon: comingSoon || undefined } : widget
      ),
    }));
    setEditingWidget(null);
  }, []);

  const buildShareUrl = useCallback(async (mode: ShareUrlMode) => {
    return generateShareUrl(config, window.location.origin, mode);
  }, [config]);

  const generateUrl = useCallback(async () => {
    const url = await buildShareUrl(shareUrlMode);
    setShareUrl(url);
    setShowShareModal(true);
    setCopied(false);
  }, [buildShareUrl, shareUrlMode]);

  const handleShareUrlModeChange = useCallback(async (mode: ShareUrlMode) => {
    setShareUrlMode(mode);
    const url = await buildShareUrl(mode);
    setShareUrl(url);
    setCopied(false);
  }, [buildShareUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const updateFullscreenPreview = async () => {
      const url = await buildShareUrl('fullscreen');
      if (!cancelled) {
        setFullscreenPreviewUrl(url);
      }
    };

    void updateFullscreenPreview();

    return () => {
      cancelled = true;
    };
  }, [buildShareUrl]);

  // === postMessage bridge for iframe embedding ===
  // Allows parent frames (e.g., campus-hub-cloud) to send/receive configs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Receive config from parent
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'campus-hub-load-config' && event.data?.config) {
        const loaded = normalizeConfig(event.data.config);
        if (loaded) setConfig(loaded);
      }
    };
    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, []);

  // Notify parent when config changes (debounced)
  useEffect(() => {
    if (typeof window === 'undefined' || window.parent === window) return;

    const timeout = setTimeout(() => {
      window.parent.postMessage({ type: 'config-save', config }, '*');
    }, 500);

    return () => clearTimeout(timeout);
  }, [config]);

  useEffect(() => {
    if (!showShareModal || typeof window === 'undefined') return;
    let cancelled = false;

    const updateVisibleShareUrl = async () => {
      const url = await buildShareUrl(shareUrlMode);
      if (!cancelled) {
        setShareUrl(url);
      }
    };

    void updateVisibleShareUrl();

    return () => {
      cancelled = true;
    };
  }, [buildShareUrl, shareUrlMode, showShareModal]);

  const copyUrl = useCallback(async () => {
    if (!shareUrl) return;
    try {
      const didCopy = await copyText(shareUrl);
      if (!didCopy) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  const exportJson = useCallback(() => {
    try {
      const exported = filterInBoundsLayout(config);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const payload = JSON.stringify(
        {
          version: EXPORT_SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          config: exported,
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${EXPORT_FILE_PREFIX}-${timestamp}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setJsonTransferMessage({ tone: 'success', text: 'JSON exported.' });
    } catch {
      setJsonTransferMessage({ tone: 'error', text: 'Export failed. Try again.' });
    }
  }, [config]);

  const openImportDialog = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const importJson = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const importedConfig = getConfigFromImport(parsed);
      const normalized = normalizeConfig(importedConfig);
      hydrateEditorState(normalized);
      setJsonTransferMessage({ tone: 'success', text: `Imported ${file.name}.` });
    } catch {
      setJsonTransferMessage({
        tone: 'error',
        text: 'Import failed. Upload a valid Campus Hub config JSON.',
      });
    }
  }, [hydrateEditorState]);

  const renderGridItem = useCallback(
    (item: GridStackItem) => {
      const widget = config.layout.find((w) => w.id === item.id);
      if (!widget) return null;

      return (
        <EditableWidget
          widget={widget}
          theme={config.theme}
          onEdit={handleEditWidget}
          onDelete={removeWidget}
        />
      );
    },
    [config.layout, config.theme, handleEditWidget, removeWidget]
  );

  const clampedMobileZoom = Math.min(
    MOBILE_ZOOM_MAX,
    Math.max(MOBILE_ZOOM_MIN, Math.round(mobileZoom * 100) / 100),
  );
  const effectivePreviewWidth = isMobile ? previewSize.width * clampedMobileZoom : previewSize.width;
  const effectivePreviewHeight = isMobile ? previewSize.height * clampedMobileZoom : previewSize.height;

  // Calculate proportional margin so preview spacing matches the display at any size
  // At 1080p reference: margin=8px → 16px inter-widget gap, 8px edge spacing
  const gridMargin = effectivePreviewHeight > 0
    ? Math.max(2, Math.round(effectivePreviewHeight * 0.0075))
    : 8;

  // Calculate cell height based on preview dimensions
  const cellHeight = effectivePreviewHeight > 0 ? effectivePreviewHeight / gridRows : 80;

  // Scale widget content so it looks the same as the 1080p display reference
  const REF_HEIGHT = 1080;
  const contentScale = effectivePreviewHeight > 0 ? effectivePreviewHeight / REF_HEIGHT : 1;

  return (
    <EngineThemeProvider theme={config.theme}>
    <div
      className="h-screen flex flex-col text-white overflow-hidden"
      style={{
        backgroundColor: config.theme.background,
        '--background': config.theme.background,
        '--color-primary': config.theme.primary,
        '--color-accent': config.theme.accent,
        '--foreground': '#ffffff',
        '--ui-panel-bg': `${config.theme.primary}26`,
        '--ui-panel-solid': `${config.theme.primary}`,
        '--ui-panel-soft': `${config.theme.primary}14`,
        '--ui-panel-hover': `${config.theme.primary}33`,
        '--ui-panel-border': `${config.theme.accent}55`,
        '--ui-item-bg': `${config.theme.primary}1a`,
        '--ui-item-hover': `${config.theme.primary}26`,
        '--ui-item-border': 'rgba(255, 255, 255, 0.15)',
        '--ui-item-border-hover': `${config.theme.accent}66`,
        '--ui-accent-soft': `${config.theme.accent}33`,
        '--ui-accent-strong': `${config.theme.accent}66`,
        '--ui-text': '#ffffff',
        '--ui-text-muted': 'rgba(255, 255, 255, 0.6)',
        '--ui-input-bg': `${config.theme.primary}1a`,
        '--ui-input-border': 'rgba(255, 255, 255, 0.18)',
        '--ui-input-focus': `${config.theme.accent}`,
        '--ui-switch-off': 'rgba(255, 255, 255, 0.2)',
        '--ui-switch-on': `${config.theme.accent}`,
        '--ui-overlay': `${config.theme.background}cc`,
      } as React.CSSProperties}
    >
      {/* Header */}
      <ConfigureHeader
        config={config}
        isMobile={isMobile}
        importInputRef={importInputRef}
        importJson={importJson}
        openImportDialog={openImportDialog}
        exportJson={exportJson}
        generateUrl={generateUrl}
        fullscreenPreviewUrl={fullscreenPreviewUrl}
        jsonTransferMessage={jsonTransferMessage}
        headerActions={headerActions}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isMobile && mobileSidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
        {/* Sidebar */}
        <ConfigureSidebar
          config={config}
          setConfig={setConfig}
          isMobile={isMobile}
          mobileSidebarOpen={mobileSidebarOpen}
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          setShowWidgetLibrary={setShowWidgetLibrary}
          setEditingWidget={setEditingWidget}
          removeWidget={removeWidget}
          placementError={placementError}
          offGridIds={offGridIds}
          offGridCount={offGridCount}
          recentDashboards={recentDashboards}
          historyState={historyState}
          setHistoryState={setHistoryState}
          refreshDashboardHistory={refreshDashboardHistory}
          hydrateEditorState={hydrateEditorState}
          currentConfigSignature={currentConfigSignature}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
        />

        {/* Editor Area */}
        <EditorArea
          config={config}
          setConfig={setConfig}
          isMobile={isMobile}
          gridCols={gridCols}
          gridRows={gridRows}
          setGridCols={setGridCols}
          setGridRows={setGridRows}
          containerRef={containerRef}
          gridRef={gridRef}
          gridItems={gridItems}
          effectivePreviewWidth={effectivePreviewWidth}
          effectivePreviewHeight={effectivePreviewHeight}
          cellHeight={cellHeight}
          gridMargin={gridMargin}
          contentScale={contentScale}
          clampedMobileZoom={clampedMobileZoom}
          mobileZoom={mobileZoom}
          setMobileZoom={setMobileZoom}
          handleLayoutChange={handleLayoutChange}
          renderGridItem={renderGridItem}
          remapLayout={remapLayout}
          offGridCount={offGridCount}
        />
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibraryModal
          config={config}
          setConfig={setConfig}
          libSearch={libSearch}
          setLibSearch={setLibSearch}
          libTag={libTag}
          setLibTag={setLibTag}
          setShowWidgetLibrary={setShowWidgetLibrary}
          addWidget={addWidget}
          placementError={placementError}
          setPlacementError={setPlacementError}
          hasTicker={hasTicker}
        />
      )}

      {/* Share URL Modal */}
      {showShareModal && (
        <ShareUrlModal
          config={config}
          shareUrl={shareUrl}
          shareUrlMode={shareUrlMode}
          copied={copied}
          setShowShareModal={setShowShareModal}
          handleShareUrlModeChange={handleShareUrlModeChange}
          copyUrl={copyUrl}
        />
      )}

      {/* Widget Edit Dialog */}
      {editingWidget && (
        <WidgetEditDialog
          isOpen={!!editingWidget}
          widgetId={editingWidget.id}
          widgetType={editingWidget.type}
          initialData={editingWidget.props || {}}
          comingSoon={editingWidget.comingSoon}
          onSave={handleSaveWidgetOptions}
          onClose={() => setEditingWidget(null)}
          accentColor={config.theme.accent}
        />
      )}
    </div>
    </EngineThemeProvider>
  );
}
