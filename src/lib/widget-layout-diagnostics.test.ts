import { describe, expect, it } from 'vitest';
import {
  EMPTY_WIDGET_LAYOUT_DIAGNOSTICS,
  detectWidgetLayoutDiagnostics,
  equalWidgetLayoutDiagnostics,
  getOverflowEdges,
  getWidgetLayoutIssueMessage,
  hasOverflowEdges,
  hasWidgetLayoutIssue,
} from './widget-layout-diagnostics';

describe('widget layout diagnostics', () => {
  it('calculates overflow edges relative to a container', () => {
    expect(
      getOverflowEdges(
        { left: 10, top: 20, right: 110, bottom: 120 },
        { left: 4, top: 16, right: 130, bottom: 126 },
        1,
      ),
    ).toEqual({
      top: 3,
      right: 19,
      bottom: 5,
      left: 5,
    });
  });

  it('treats the empty diagnostics state as healthy', () => {
    expect(hasWidgetLayoutIssue(EMPTY_WIDGET_LAYOUT_DIAGNOSTICS)).toBe(false);
    expect(getWidgetLayoutIssueMessage(EMPTY_WIDGET_LAYOUT_DIAGNOSTICS)).toContain('fits');
  });

  it('compares diagnostics by value', () => {
    expect(
      equalWidgetLayoutDiagnostics(
        { overflowX: true, overflowY: false, escapedBounds: true },
        { overflowX: true, overflowY: false, escapedBounds: true },
      ),
    ).toBe(true);
    expect(
      equalWidgetLayoutDiagnostics(
        { overflowX: true, overflowY: false, escapedBounds: true },
        { overflowX: false, overflowY: false, escapedBounds: true },
      ),
    ).toBe(false);
  });

  it('detects scroll-based clipping inside a widget', () => {
    const container = document.createElement('div');

    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 160 },
      clientHeight: { configurable: true, value: 90 },
      scrollWidth: { configurable: true, value: 220 },
      scrollHeight: { configurable: true, value: 90 },
    });
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 160, bottom: 90, width: 160, height: 90 } as DOMRect);

    expect(detectWidgetLayoutDiagnostics(container)).toEqual({
      overflowX: true,
      overflowY: false,
      escapedBounds: false,
    });
  });

  it('detects descendants that escape the widget bounds', () => {
    const container = document.createElement('div');
    const child = document.createElement('div');
    container.append(child);

    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 160 },
      clientHeight: { configurable: true, value: 90 },
      scrollWidth: { configurable: true, value: 160 },
      scrollHeight: { configurable: true, value: 90 },
    });
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 160, bottom: 90, width: 160, height: 90 } as DOMRect);
    child.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 185, bottom: 90, width: 185, height: 90 } as DOMRect);

    const diagnostics = detectWidgetLayoutDiagnostics(container);

    expect(diagnostics.escapedBounds).toBe(true);
    expect(hasOverflowEdges(getOverflowEdges(container.getBoundingClientRect(), child.getBoundingClientRect()))).toBe(true);
  });

  it('can ignore scroll metrics for transformed preview wrappers', () => {
    const container = document.createElement('div');

    Object.defineProperties(container, {
      clientWidth: { configurable: true, value: 160 },
      clientHeight: { configurable: true, value: 90 },
      scrollWidth: { configurable: true, value: 220 },
      scrollHeight: { configurable: true, value: 140 },
    });
    container.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 160, bottom: 90, width: 160, height: 90 } as DOMRect);

    expect(
      detectWidgetLayoutDiagnostics(container, { includeScrollMetrics: false }),
    ).toEqual({
      overflowX: false,
      overflowY: false,
      escapedBounds: false,
    });
  });
});
