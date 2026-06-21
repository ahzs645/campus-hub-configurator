import { describe, expect, it } from 'vitest'
import { lintConfig, summarizeFindings, type LintWidgetDef } from './lint'
import type { DisplayConfig, WidgetConfig } from './config'

function makeConfig(layout: WidgetConfig[]): DisplayConfig {
  return {
    layout,
    theme: { primary: '#000', accent: '#111', background: '#222' },
    schoolName: 'Test',
    tickerEnabled: false,
    gridCols: 12,
    gridRows: 8,
  }
}

const getWidget = (type: string): LintWidgetDef | undefined => {
  if (type === 'clock') return { type: 'clock', name: 'Clock' }
  if (type === 'api')
    return {
      type: 'api',
      name: 'API',
      optionsSchema: [
        { name: 'url', label: 'URL', fieldType: 'string', required: true },
        {
          name: 'apiKey',
          label: 'API Key',
          fieldType: 'password',
          required: true,
          showIf: { field: 'authMode', equals: 'key' },
        },
      ],
    }
  return undefined
}

describe('lintConfig', () => {
  it('flags an empty layout', () => {
    const findings = lintConfig(makeConfig([]), { getWidget })
    expect(findings.some((f) => f.id === 'empty-layout')).toBe(true)
  })

  it('flags an unknown widget type', () => {
    const findings = lintConfig(
      makeConfig([{ id: 'a', type: 'mystery', x: 0, y: 0, w: 2, h: 2 }]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'unknown-widget-type')).toBe(true)
  })

  it('accepts a known, in-bounds widget with no issues', () => {
    const findings = lintConfig(
      makeConfig([{ id: 'a', type: 'clock', x: 0, y: 0, w: 2, h: 2 }]),
      { getWidget },
    )
    expect(findings).toHaveLength(0)
  })

  it('flags out-of-bounds widgets', () => {
    const findings = lintConfig(
      makeConfig([{ id: 'a', type: 'clock', x: 11, y: 0, w: 4, h: 2 }]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'widget-out-of-bounds')).toBe(true)
  })

  it('flags a missing required option', () => {
    const findings = lintConfig(
      makeConfig([{ id: 'a', type: 'api', x: 0, y: 0, w: 2, h: 2, props: {} }]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'required-options-missing')).toBe(true)
  })

  it('passes when required options are present', () => {
    const findings = lintConfig(
      makeConfig([
        { id: 'a', type: 'api', x: 0, y: 0, w: 2, h: 2, props: { url: 'https://x.test' } },
      ]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'required-options-missing')).toBe(false)
  })

  it('does not require a hidden conditional field', () => {
    // apiKey is required only when authMode === 'key'; here it's absent.
    const findings = lintConfig(
      makeConfig([
        { id: 'a', type: 'api', x: 0, y: 0, w: 2, h: 2, props: { url: 'https://x.test' } },
      ]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'required-options-missing')).toBe(false)
  })

  it('flags a malformed URL prop and insecure http', () => {
    const findings = lintConfig(
      makeConfig([
        { id: 'a', type: 'clock', x: 0, y: 0, w: 2, h: 2, props: { src: 'https://not a url' } },
        { id: 'b', type: 'clock', x: 0, y: 2, w: 2, h: 2, props: { src: 'http://insecure.test' } },
      ]),
      { getWidget },
    )
    expect(findings.some((f) => f.id === 'malformed-url')).toBe(true)
    expect(findings.some((f) => f.id === 'insecure-url')).toBe(true)
  })

  it('flags a broken media reference via mediaExists', () => {
    const findings = lintConfig(
      makeConfig([
        { id: 'a', type: 'clock', x: 0, y: 0, w: 2, h: 2, props: { logoMediaId: 'gone' } },
      ]),
      { getWidget, mediaExists: () => false },
    )
    expect(findings.some((f) => f.id === 'broken-media-ref')).toBe(true)
  })

  it('orders errors before warnings', () => {
    const findings = lintConfig(
      makeConfig([
        { id: 'a', type: 'mystery', x: 11, y: 0, w: 4, h: 2 }, // unknown (error) + oob (warning)
      ]),
      { getWidget },
    )
    expect(findings[0].severity).toBe('error')
  })
})

describe('summarizeFindings', () => {
  it('counts by severity', () => {
    const counts = summarizeFindings([
      { id: 'x', severity: 'error', message: '' },
      { id: 'y', severity: 'warning', message: '' },
      { id: 'z', severity: 'warning', message: '' },
    ])
    expect(counts).toEqual({ error: 1, warning: 2, info: 0 })
  })
})
