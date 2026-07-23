import { describe, expect, it } from 'vitest'
import { normalizeConfig } from './config'

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
})
