import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import type { DisplayConfig, WidgetConfig } from '../lib/config';
import { sortWidgetLayers } from '../lib/layers';
import {
  AppIcon,
  getWidget,
  type WidgetDefinition,
} from '@firstform/campus-hub-engine';
import { GripVertical } from 'lucide-react';

interface RenderWidgetItemProps {
  widget: WidgetConfig;
  widgetDef: WidgetDefinition;
  isOffGrid: boolean;
  hasLayoutIssue: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

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
  selectedWidgetId?: string | null;
  onSelect?: (id: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  className?: string;
  style?: CSSProperties;
  renderWidgetItem?: (props: RenderWidgetItemProps) => ReactNode;
  renderAddButton?: (props: { onClick: () => void; theme: DisplayConfig['theme'] }) => ReactNode;
  renderEmptyState?: () => ReactNode;
}

interface SortableWidgetLayerProps {
  widget: WidgetConfig;
  widgetDef?: WidgetDefinition;
  isSelected: boolean;
  isOffGrid: boolean;
  hasLayoutIssue: boolean;
  canReorder: boolean;
  onSelect?: (id: string) => void;
  setEditingWidget: (widget: WidgetConfig | null) => void;
  removeWidget: (id: string) => void;
  renderWidgetItem?: (props: RenderWidgetItemProps) => ReactNode;
}

function SortableWidgetLayer({
  widget,
  widgetDef,
  isSelected,
  isOffGrid,
  hasLayoutIssue,
  canReorder,
  onSelect,
  setEditingWidget,
  removeWidget,
  renderWidgetItem,
}: SortableWidgetLayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id, disabled: !canReorder });
  const widgetName = widgetDef?.name ?? widget.type;
  const handleEdit = () => {
    onSelect?.(widget.id);
    setEditingWidget(widget);
  };
  const handleRemove = () => removeWidget(widget.id);

  if (renderWidgetItem && widgetDef) {
    return (
      <div
        ref={setNodeRef}
        className={`flex items-start gap-2 ${isDragging ? 'opacity-60' : ''}`}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <button
          type="button"
          className="mt-1 inline-flex h-8 w-7 shrink-0 touch-none items-center justify-center rounded-md text-white/40 transition-colors hover:bg-[var(--ui-item-hover)] hover:text-white"
          aria-label={`Move ${widgetName} layer`}
          title="Drag to reorder layer"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <div className="min-w-0 flex-1" onClick={() => onSelect?.(widget.id)}>
          {renderWidgetItem({
            widget,
            widgetDef,
            isOffGrid,
            hasLayoutIssue,
            onEdit: handleEdit,
            onRemove: handleRemove,
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-2 rounded-lg border p-3 ${
        isDragging ? 'opacity-60' : ''
      } ${
        isSelected
          ? 'border-[var(--color-accent)] bg-[var(--ui-accent-soft)] ring-1 ring-[var(--color-accent)]'
          : isOffGrid
            ? 'border-amber-500/30 bg-amber-500/10'
            : hasLayoutIssue
              ? 'border-amber-400/30 bg-amber-500/10'
              : 'border-[color:var(--ui-panel-border)] bg-[var(--ui-panel-bg)]'
      }`}
    >
      <button
        type="button"
        className="inline-flex h-8 w-7 shrink-0 touch-none items-center justify-center rounded-md text-white/40 transition-colors hover:bg-[var(--ui-item-hover)] hover:text-white"
        aria-label={`Move ${widgetName} layer`}
        title="Drag to reorder layer"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <button
        type="button"
        onClick={() => onSelect?.(widget.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-pressed={isSelected}
      >
        {widgetDef ? (
          <AppIcon name={widgetDef.icon} className="h-5 w-5 shrink-0 text-white/90" />
        ) : (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold text-white/60">
            ?
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{widgetName}</span>
            {isOffGrid && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                OFF GRID
              </span>
            )}
            {!isOffGrid && hasLayoutIssue && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                CLIPPED
              </span>
            )}
          </span>
          <span className="block text-xs text-white/40">
            {widget.w}×{widget.h} at ({widget.x}, {widget.y})
          </span>
        </span>
      </button>
      <div className="flex items-center gap-1">
        {widgetDef?.OptionsComponent && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-[var(--ui-item-hover)] hover:text-white"
            title="Configure"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15z" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={handleRemove}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-400"
          title="Remove"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
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
  selectedWidgetId,
  onSelect,
  onReorder,
  className,
  style,
  renderWidgetItem,
  renderAddButton,
  renderEmptyState,
}: WidgetsTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const layers = sortWidgetLayers(config.layout).map((widget) => ({
    widget,
    widgetDef: getWidget(widget.type),
  }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || !onReorder) return;
    const activeId = String(active.id);
    onSelect?.(activeId);
    onReorder(activeId, String(over.id));
  };

  return (
    <div className={className ?? ''} style={style}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          Widgets
          {config.layout.length > 0 && (
            <span className="ml-2 text-sm font-normal text-white/40">({config.layout.length})</span>
          )}
        </h2>
        {config.layout.length > 0 && (
          <button
            onClick={() => setConfig((prev) => ({ ...prev, layout: [], tickerEnabled: false }))}
            className="text-xs text-red-400 transition-colors hover:text-red-300"
          >
            Clear All
          </button>
        )}
      </div>

      {renderAddButton ? renderAddButton({ onClick: () => setShowWidgetLibrary(true), theme: config.theme }) : (
        <button
          onClick={() => setShowWidgetLibrary(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundColor: config.theme.accent, color: config.theme.background }}
        >
          <span className="text-lg leading-none">+</span>
          Add Widget
        </button>
      )}

      {placementError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {placementError}
        </div>
      )}

      {offGridCount > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {offGridCount} widget{offGridCount > 1 ? 's' : ''} off grid — will not appear in exports or generated URLs. Scroll the preview to find {offGridCount > 1 ? 'them' : 'it'}.
        </div>
      )}

      {layoutIssueCount > 0 && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {layoutIssueCount} widget{layoutIssueCount > 1 ? 's show' : ' shows'} clipped content at the current preview size.
        </div>
      )}

      {layers.length === 0 ? (
        renderEmptyState ? renderEmptyState() : (
          <div className="py-8 text-center text-white/30">
            <div className="mb-2 text-3xl">+</div>
            <p className="text-sm">No widgets yet</p>
            <p className="mt-1 text-xs">Click &quot;Add Widget&quot; to get started</p>
          </div>
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={layers.map(({ widget }) => widget.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {layers.map(({ widget, widgetDef }) => (
                <SortableWidgetLayer
                  key={widget.id}
                  widget={widget}
                  widgetDef={widgetDef}
                  isSelected={selectedWidgetId === widget.id}
                  isOffGrid={offGridIds.has(widget.id)}
                  hasLayoutIssue={layoutIssueIds.has(widget.id)}
                  canReorder={!!onReorder}
                  onSelect={onSelect}
                  setEditingWidget={setEditingWidget}
                  removeWidget={removeWidget}
                  renderWidgetItem={renderWidgetItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
