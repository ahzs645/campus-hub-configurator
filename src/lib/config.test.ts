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
})
