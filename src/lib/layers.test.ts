import { describe, expect, it } from 'vitest'
import type { WidgetConfig } from './config'
import {
  getWidgetZIndex,
  reorderWidgetLayers,
  sortWidgetLayers,
} from './layers'

const widget = (
  id: string,
  zIndex?: number,
  props?: Record<string, unknown>,
): WidgetConfig => ({
  id,
  type: 'clock',
  x: 0,
  y: 0,
  w: 2,
  h: 1,
  zIndex,
  props,
})

describe('widget layers', () => {
  it('orders front-to-back and uses array order for legacy widgets', () => {
    const layout = [
      widget('back', -1),
      widget('legacy'),
      widget('front', 8),
    ]

    expect(sortWidgetLayers(layout).map((item) => item.id)).toEqual([
      'front',
      'legacy',
      'back',
    ])
    expect(getWidgetZIndex(layout[1], 1)).toBe(1)
  })

  it('preserves original array order when layers are tied', () => {
    const layout = [
      widget('first', 3),
      widget('second', 3),
      widget('third', 3),
    ]

    expect(sortWidgetLayers(layout).map((item) => item.id)).toEqual([
      'first',
      'second',
      'third',
    ])
  })

  it('moves a layer and re-stamps contiguous z-indexes without losing widget data', () => {
    const layout = [
      widget('back', 0, { label: 'preserved' }),
      widget('middle', 1),
      widget('front', 2),
    ]

    const reordered = reorderWidgetLayers(layout, 'back', 'front')

    expect(reordered.map((item) => item.id)).toEqual([
      'back',
      'front',
      'middle',
    ])
    expect(reordered.map((item) => item.zIndex)).toEqual([2, 1, 0])
    expect(reordered[0].props).toEqual({ label: 'preserved' })
    expect(reordered.map((item) => item.zIndex).sort((a, b) => a! - b!)).toEqual([
      0,
      1,
      2,
    ])
  })

  it('leaves the layout unchanged when either layer is missing', () => {
    const layout = [widget('back', 0), widget('front', 1)]

    expect(reorderWidgetLayers(layout, 'missing', 'front')).toEqual(layout)
  })
})
