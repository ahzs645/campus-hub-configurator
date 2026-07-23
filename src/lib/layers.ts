import type { WidgetConfig } from './config'

export function getWidgetZIndex(
  widget: WidgetConfig,
  fallbackIndex: number,
): number {
  return typeof widget.zIndex === 'number' && Number.isFinite(widget.zIndex)
    ? Math.trunc(widget.zIndex)
    : fallbackIndex
}

export function sortWidgetLayers(
  layout: readonly WidgetConfig[],
): WidgetConfig[] {
  return layout
    .map((widget, index) => ({
      widget,
      index,
      zIndex: getWidgetZIndex(widget, index),
    }))
    // Tied z-indexes paint in DOM order (later element on top), so the later
    // layout index is the more frontmost layer.
    .sort((a, b) => b.zIndex - a.zIndex || b.index - a.index)
    .map(({ widget }) => widget)
}

export function reorderWidgetLayers(
  layout: readonly WidgetConfig[],
  activeId: string,
  overId: string,
): WidgetConfig[] {
  const ordered = sortWidgetLayers(layout)
  const activeIndex = ordered.findIndex((widget) => widget.id === activeId)
  const overIndex = ordered.findIndex((widget) => widget.id === overId)

  if (activeIndex < 0 || overIndex < 0) {
    return [...layout]
  }

  const [activeWidget] = ordered.splice(activeIndex, 1)
  ordered.splice(overIndex, 0, activeWidget)

  return ordered.map((widget, index) => ({
    ...widget,
    zIndex: ordered.length - index - 1,
  }))
}
