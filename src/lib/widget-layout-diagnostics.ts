export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface OverflowEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface WidgetLayoutDiagnostics {
  overflowX: boolean;
  overflowY: boolean;
  escapedBounds: boolean;
}

export interface WidgetLayoutDiagnosticsOptions {
  includeScrollMetrics?: boolean;
  tolerance?: number;
}

export const EMPTY_OVERFLOW_EDGES: OverflowEdges = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export const EMPTY_WIDGET_LAYOUT_DIAGNOSTICS: WidgetLayoutDiagnostics = {
  overflowX: false,
  overflowY: false,
  escapedBounds: false,
};

export function getOverflowEdges(
  containerRect: RectLike,
  subjectRect: RectLike,
  tolerance = 1,
): OverflowEdges {
  return {
    top: Math.max(0, containerRect.top - subjectRect.top - tolerance),
    right: Math.max(0, subjectRect.right - containerRect.right - tolerance),
    bottom: Math.max(0, subjectRect.bottom - containerRect.bottom - tolerance),
    left: Math.max(0, containerRect.left - subjectRect.left - tolerance),
  };
}

export function hasOverflowEdges(edges: OverflowEdges): boolean {
  return (
    edges.top > 0 ||
    edges.right > 0 ||
    edges.bottom > 0 ||
    edges.left > 0
  );
}

export function equalWidgetLayoutDiagnostics(
  left: WidgetLayoutDiagnostics,
  right: WidgetLayoutDiagnostics,
): boolean {
  return (
    left.overflowX === right.overflowX &&
    left.overflowY === right.overflowY &&
    left.escapedBounds === right.escapedBounds
  );
}

export function hasWidgetLayoutIssue(
  diagnostics: WidgetLayoutDiagnostics,
): boolean {
  return (
    diagnostics.overflowX ||
    diagnostics.overflowY ||
    diagnostics.escapedBounds
  );
}

export function getWidgetLayoutIssueMessage(
  diagnostics: WidgetLayoutDiagnostics,
): string {
  if (diagnostics.overflowX && diagnostics.overflowY) {
    return 'Content overflows the widget horizontally and vertically at this size.';
  }
  if (diagnostics.overflowY) {
    return 'Content is getting clipped vertically at this size.';
  }
  if (diagnostics.overflowX) {
    return 'Content is getting clipped horizontally at this size.';
  }
  if (diagnostics.escapedBounds) {
    return 'Content is escaping the widget bounds at this size.';
  }
  return 'Content fits within the widget bounds at this size.';
}

export function detectWidgetLayoutDiagnostics(
  container: HTMLElement,
  options: WidgetLayoutDiagnosticsOptions = {},
): WidgetLayoutDiagnostics {
  const tolerance = options.tolerance ?? 1;
  const includeScrollMetrics = options.includeScrollMetrics ?? true;
  const diagnostics: WidgetLayoutDiagnostics = {
    overflowX: includeScrollMetrics
      ? container.scrollWidth - container.clientWidth > tolerance
      : false,
    overflowY: includeScrollMetrics
      ? container.scrollHeight - container.clientHeight > tolerance
      : false,
    escapedBounds: false,
  };

  const containerRect = container.getBoundingClientRect();
  if (containerRect.width <= 0 || containerRect.height <= 0) {
    return diagnostics;
  }

  const descendants = container.querySelectorAll<HTMLElement>('*');
  for (const descendant of descendants) {
    if (
      descendant.dataset.layoutDiagnosticIgnore === 'true' ||
      descendant.closest('[data-layout-diagnostic-ignore="true"]')
    ) {
      continue;
    }

    const style = window.getComputedStyle(descendant);
    if (
      style.display === 'none' ||
      style.display === 'contents' ||
      style.visibility === 'hidden'
    ) {
      continue;
    }

    const rect = descendant.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) {
      continue;
    }

    if (hasOverflowEdges(getOverflowEdges(containerRect, rect, tolerance))) {
      diagnostics.escapedBounds = true;
      return diagnostics;
    }
  }

  return diagnostics;
}
