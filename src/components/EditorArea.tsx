import type { CSSProperties } from 'react';
import type { ReactNode } from 'react';
import { Suspense, lazy, useEffect, useRef, type RefObject } from 'react';
import type { DisplayConfig } from '../lib/config';
import type {
  GridInteractionMode,
  GridStackItem,
} from '@firstform/campus-hub-engine';
import { CustomSelect } from './CustomSelect';

type GridStackWrapperRef = { getItems: () => GridStackItem[] };

const GridStackWrapper = lazy(() => import('@firstform/campus-hub-engine').then(m => ({ default: m.GridStackWrapper })));

const COL_OPTIONS = [
  { label: 'Coarse', value: 8 },
  { label: 'Standard', value: 12 },
  { label: 'Fine', value: 16 },
  { label: 'Ultra', value: 24 },
];

const ROW_OPTIONS = [
  { label: 'Coarse', value: 8 },
  { label: 'Medium', value: 12 },
  { label: 'Fine', value: 16 },
];

const MOBILE_ZOOM_MIN = 1;
const MOBILE_ZOOM_MAX = 3;
const MOBILE_ZOOM_STEP = 0.25;

export interface EditorAreaProps {
  config: DisplayConfig;
  setConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;
  isMobile: boolean;
  gridCols: number;
  gridRows: number;
  setGridCols: (cols: number) => void;
  setGridRows: (rows: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  gridRef: RefObject<GridStackWrapperRef | null>;
  gridItems: GridStackItem[];
  effectivePreviewWidth: number;
  effectivePreviewHeight: number;
  cellHeight: number;
  gridMargin: number;
  contentScale: number;
  interactionMode?: GridInteractionMode;
  selectedItemId?: string | null;
  onItemSelect?: (id: string) => void;
  clampedMobileZoom: number;
  mobileZoom: number;
  setMobileZoom: React.Dispatch<React.SetStateAction<number>>;
  handleLayoutChange: (items: GridStackItem[]) => void;
  renderGridItem: (item: GridStackItem) => React.ReactNode;
  remapLayout: (
    layout: import('../lib/config').WidgetConfig[],
    axis: 'x' | 'y',
    prevSize: number,
    nextSize: number,
  ) => import('../lib/config').WidgetConfig[];
  offGridCount: number;
  className?: string;
  style?: CSSProperties;
  renderEmptyState?: () => ReactNode;
  renderEditorHeader?: (props: { isMobile: boolean; gridCols: number; gridRows: number }) => ReactNode;
  /**
   * Canvas behavior when isMobile:
   * - 'preview': non-interactive preview (default, legacy behavior)
   * - 'select': tap widgets to select them; drag/resize stays disabled
   * - 'arrange': gridstack touch drag/resize enabled; canvas pan gestures
   *   are locked so dragging never fights scrolling
   */
  mobileMode?: 'preview' | 'select' | 'arrange';
}

export default function EditorArea({
  config,
  setConfig,
  isMobile,
  gridCols,
  gridRows,
  setGridCols,
  setGridRows,
  containerRef,
  gridRef,
  gridItems,
  effectivePreviewWidth,
  effectivePreviewHeight,
  cellHeight,
  gridMargin,
  contentScale,
  interactionMode = 'gridder',
  selectedItemId,
  onItemSelect,
  clampedMobileZoom,
  setMobileZoom,
  handleLayoutChange,
  renderGridItem,
  remapLayout,
  offGridCount,
  className,
  style,
  renderEmptyState,
  renderEditorHeader,
  mobileMode = 'preview',
}: EditorAreaProps) {
  // Pinch-to-zoom on the mobile canvas (preview/select modes; in arrange mode
  // one finger is already committed to gridstack drag). Native listeners with
  // passive:false — React's synthetic touch handlers can't preventDefault.
  const zoomRef = useRef(clampedMobileZoom);
  zoomRef.current = clampedMobileZoom;
  const pinchEnabled = isMobile && mobileMode !== 'arrange';
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pinchEnabled) return;

    let pinch: { dist: number; zoom: number } | null = null;
    const distance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinch = { dist: distance(e.touches), zoom: zoomRef.current };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const scale = distance(e.touches) / pinch.dist;
      const next = Math.round(pinch.zoom * scale * 100) / 100;
      setMobileZoom(Math.min(MOBILE_ZOOM_MAX, Math.max(MOBILE_ZOOM_MIN, next)));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, pinchEnabled, setMobileZoom]);

  return (
    <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${className ?? ''}`} style={style}>
      {/* Editor Header */}
      {renderEditorHeader ? renderEditorHeader({ isMobile, gridCols, gridRows }) : (
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 gap-4 border-b border-[color:var(--ui-panel-border)]">
          <h2 className="font-display font-bold text-sm" style={{ color: config.theme.accent }}>
            {isMobile ? 'Preview' : 'Layout Editor'}
          </h2>
          {!isMobile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="text-white/40">Grid</span>
                <CustomSelect
                  id="grid-cols"
                  value={String(gridCols)}
                  onChange={(value) => {
                    const nextCols = Number(value);
                    const prevCols = gridCols;
                    setGridCols(nextCols);
                    setConfig((prev) => ({
                      ...prev,
                      gridCols: nextCols,
                      layout: remapLayout(prev.layout, 'x', prevCols, nextCols),
                    }));
                  }}
                  options={COL_OPTIONS.map((option) => ({ value: String(option.value), label: `${option.value}c` }))}
                  className="px-2 py-1 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] text-white/80 text-xs outline-none focus:border-[var(--ui-item-border-hover)]"
                  title="Columns"
                />
                <span className="text-white/30">x</span>
                <CustomSelect
                  id="grid-rows"
                  value={String(gridRows)}
                  onChange={(value) => {
                    const nextRows = Number(value);
                    const prevRows = gridRows;
                    setGridRows(nextRows);
                    setConfig((prev) => ({
                      ...prev,
                      gridRows: nextRows,
                      layout: remapLayout(prev.layout, 'y', prevRows, nextRows),
                    }));
                  }}
                  options={ROW_OPTIONS.map((option) => ({ value: String(option.value), label: `${option.value}r` }))}
                  className="px-2 py-1 rounded-lg bg-[var(--ui-item-bg)] border border-[color:var(--ui-item-border)] text-white/80 text-xs outline-none focus:border-[var(--ui-item-border-hover)]"
                  title="Rows"
                />
              </div>
              <span className="text-xs text-white/40">
                Drag to reposition. Handles to resize.
              </span>
            </div>
          )}
          {isMobile && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wide text-white/40">
                Zoom
              </span>
              <button
                type="button"
                onClick={() => setMobileZoom((prev) => Math.max(MOBILE_ZOOM_MIN, prev - MOBILE_ZOOM_STEP))}
                disabled={clampedMobileZoom <= MOBILE_ZOOM_MIN}
                className={`w-7 h-7 rounded-md border border-[color:var(--ui-panel-border)] text-sm transition-colors ${
                  clampedMobileZoom <= MOBILE_ZOOM_MIN
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--ui-item-hover)]'
                }`}
                aria-label="Zoom out preview"
                title="Zoom out"
              >
                -
              </button>
              <span className="text-xs text-white/60 tabular-nums min-w-[42px] text-center">
                {Math.round(clampedMobileZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setMobileZoom((prev) => Math.min(MOBILE_ZOOM_MAX, prev + MOBILE_ZOOM_STEP))}
                disabled={clampedMobileZoom >= MOBILE_ZOOM_MAX}
                className={`w-7 h-7 rounded-md border border-[color:var(--ui-panel-border)] text-sm transition-colors ${
                  clampedMobileZoom >= MOBILE_ZOOM_MAX
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-[var(--ui-item-hover)]'
                }`}
                aria-label="Zoom in preview"
                title="Zoom in"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full-bleed Grid Area */}
      <div
        ref={containerRef}
        className={`flex-1 min-h-0 relative scrollbar-hide ${
          isMobile
            ? `overflow-auto${mobileMode === 'arrange' ? ' mobile-arrange' : ' mobile-preview'}`
            : 'overflow-x-hidden overflow-y-auto'
        }`}
        style={{
          backgroundColor: config.theme.background,
          touchAction: isMobile ? (mobileMode === 'arrange' ? 'none' : 'pan-x pan-y') : 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* GridStack container — centered horizontally, top-aligned */}
        <div
          className="mx-auto relative"
          data-template-preview-capture="true"
          style={{
            width: effectivePreviewWidth || '100%',
            minHeight: effectivePreviewHeight || undefined,
          }}
        >
          {/* Export boundary indicator */}
          {effectivePreviewWidth > 0 && effectivePreviewHeight > 0 && (
            <div
              className="preview-boundary-indicator absolute inset-x-0 top-0 border-2 border-dashed pointer-events-none z-10 rounded-sm"
              style={{
                height: effectivePreviewHeight,
                borderColor: offGridCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              {offGridCount > 0 && (
                <span className="absolute right-1.5 bottom-1.5 text-[10px] text-amber-400/70 whitespace-nowrap bg-black/30 px-1.5 py-0.5 rounded">
                  display boundary
                </span>
              )}
            </div>
          )}

          {effectivePreviewWidth > 0 && effectivePreviewHeight > 0 && (
            <div className={isMobile && mobileMode === 'preview' ? 'pointer-events-none' : ''}>
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/30">Loading editor...</div>}>
              <GridStackWrapper
                ref={gridRef}
                items={gridItems}
                columns={gridCols}
                rows={gridRows}
                cellHeight={cellHeight}
                margin={gridMargin}
                contentScale={contentScale}
                interactionMode={interactionMode}
                selectedItemId={selectedItemId}
                onItemSelect={onItemSelect}
                onLayoutChange={handleLayoutChange}
                renderItem={renderGridItem}
              />
              </Suspense>
            </div>
          )}

          {config.layout.length === 0 && effectivePreviewHeight > 0 && (
            renderEmptyState ? renderEmptyState() : (
              <div
                className="absolute inset-x-0 top-0 flex items-center justify-center text-white/30 pointer-events-none"
                style={{ height: effectivePreviewHeight }}
              >
                <div className="text-center">
                  <p className={`mb-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>No widgets added</p>
                  <p className="text-xs md:text-sm">{isMobile ? 'Open the sidebar to add widgets' : 'Click widgets in the sidebar to add them'}</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
