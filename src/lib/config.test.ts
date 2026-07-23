import { describe, expect, it } from 'vitest'
import { decodeConfig, encodeConfig, normalizeConfig } from './config'

describe('normalizeConfig', () => {
  it('derives tickerEnabled from the layout instead of trusting stale flags', () => {
    expect(
      normalizeConfig({
        layout: [],
        tickerEnabled: true,
      }).tickerEnabled,
    ).toBe(false)

    expect(
      normalizeConfig({
        layout: [
          {
            id: 'news-1',
            type: 'news-ticker',
            x: 0,
            y: 0,
            w: 12,
            h: 1,
          },
        ],
        tickerEnabled: false,
      }).tickerEnabled,
    ).toBe(true)
  })

  it('preserves arbitrary widget types during normalization', () => {
    const config = normalizeConfig({
      layout: [
        {
          id: 'audience-1',
          type: 'audience-response',
          x: 1,
          y: 2,
          w: 5,
          h: 4,
          props: { sessionKey: 'session-1' },
        },
      ],
    })

    expect(config.layout).toEqual([
      expect.objectContaining({
        id: 'audience-1',
        type: 'audience-response',
        props: { sessionKey: 'session-1' },
      }),
    ])
  })

  it('preserves and round-trips a valid visibility condition', () => {
    const condition = {
      source: { kind: 'signal', key: 'emergency' },
      operator: 'equals',
      value: true,
      behavior: 'pulse',
      autoHideSeconds: 15,
    } as const
    const normalized = normalizeConfig({
      layout: [{
        id: 'alert-1',
        type: 'notice',
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        visibilityCondition: condition,
      }],
    })

    expect(normalized.layout[0]?.visibilityCondition).toEqual(condition)
    expect(normalizeConfig(normalized)).toEqual(normalized)
  })

  it('strips a malformed visibility condition', () => {
    const normalized = normalizeConfig({
      layout: [{
        id: 'alert-1',
        type: 'notice',
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        visibilityCondition: {
          source: { kind: 'other', key: 'emergency' },
          operator: 'equals',
          value: true,
          behavior: 'while-matched',
        },
      }],
    })

    expect(normalized.layout[0]?.visibilityCondition).toBeUndefined()
  })

  it('preserves finite z-indexes, truncates fractions, and falls back to array order', () => {
    const normalized = normalizeConfig({
      layout: [
        { id: 'back', type: 'clock', x: 0, y: 0, w: 2, h: 1, zIndex: -2 },
        { id: 'front', type: 'clock', x: 0, y: 0, w: 2, h: 1, zIndex: 7.9 },
        { id: 'legacy', type: 'clock', x: 0, y: 0, w: 2, h: 1 },
        { id: 'invalid', type: 'clock', x: 0, y: 0, w: 2, h: 1, zIndex: Number.POSITIVE_INFINITY },
      ],
    })

    expect(normalized.layout.map((widget) => widget.zIndex)).toEqual([
      -2,
      7,
      2,
      3,
    ])
    expect(normalizeConfig(normalized)).toEqual(normalized)
  })

  it('round-trips z-indexes through the share URL codec', async () => {
    const normalized = normalizeConfig({
      layout: [
        { id: 'back', type: 'clock', x: 0, y: 0, w: 2, h: 1, zIndex: 0 },
        { id: 'front', type: 'clock', x: 0, y: 0, w: 2, h: 1, zIndex: 9 },
      ],
    })

    const decoded = await decodeConfig(await encodeConfig(normalized))

    expect(decoded).toEqual(normalized)
  })
})
