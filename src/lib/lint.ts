// Template linter — best-practice checks adapted from TRMNL's plugin lint
// engine (trmnlp lib/trmnlp/lint/checks). Pure and dependency-injected: it
// takes a resolver for widget definitions so the configurator package stays
// decoupled from the widget SDK.

import { isWidgetInBounds, type DisplayConfig, type WidgetConfig } from './config'

export type LintSeverity = 'error' | 'warning' | 'info'

export interface LintFinding {
  /** Stable rule id, e.g. 'empty-layout'. */
  id: string
  severity: LintSeverity
  message: string
  widgetId?: string
  widgetType?: string
  learnMore?: string
}

/** Minimal structural view of an options field the linter needs. */
export interface LintWidgetField {
  name: string
  label?: string
  fieldType?: string
  required?: boolean
  showIf?: { field: string; equals: unknown | unknown[] }
}

/** Minimal structural view of a widget definition (injected from the SDK). */
export interface LintWidgetDef {
  type: string
  name?: string
  optionsSchema?: LintWidgetField[]
}

export interface LintContext {
  /** Resolve a widget type to its definition (typically SDK `getWidget`). */
  getWidget?: (type: string) => LintWidgetDef | undefined
  /** Whether a media-library id still exists (for broken-media-ref). */
  mediaExists?: (id: string) => boolean
}

const DEFAULT_COLS = 12
const DEFAULT_ROWS = 8
const URL_PROP_RE = /^https?:\/\//i
const MEDIA_ID_PROP_RE = /mediaid$/i

function fieldVisible(field: LintWidgetField, props: Record<string, unknown>): boolean {
  if (!field.showIf) return true
  const current = props[field.showIf.field]
  const { equals } = field.showIf
  return Array.isArray(equals) ? equals.includes(current) : current === equals
}

function valueMissing(fieldType: string | undefined, value: unknown): boolean {
  if (fieldType === 'boolean') return false
  if (fieldType === 'number') {
    return value === undefined || value === null || Number.isNaN(value as number)
  }
  return value === undefined || value === null || String(value).trim() === ''
}

/** Collect string leaves from a prop value, one level into arrays/objects. */
function collectStrings(value: unknown, depth = 0): string[] {
  if (typeof value === 'string') return [value]
  if (depth >= 2) return []
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v, depth + 1))
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((v) =>
      collectStrings(v, depth + 1),
    )
  }
  return []
}

function checkRequiredOptions(
  widget: WidgetConfig,
  def: LintWidgetDef | undefined,
): LintFinding[] {
  if (!def?.optionsSchema) return []
  const props = widget.props ?? {}
  const out: LintFinding[] = []
  for (const field of def.optionsSchema) {
    if (!field.required) continue
    if (!fieldVisible(field, props)) continue
    if (valueMissing(field.fieldType, props[field.name])) {
      out.push({
        id: 'required-options-missing',
        severity: 'error',
        message: `${def.name ?? widget.type} is missing required option "${field.label ?? field.name}".`,
        widgetId: widget.id,
        widgetType: widget.type,
      })
    }
  }
  return out
}

function checkUrlsAndMedia(widget: WidgetConfig, ctx: LintContext): LintFinding[] {
  const props = widget.props ?? {}
  const out: LintFinding[] = []

  for (const [key, raw] of Object.entries(props)) {
    if (key.startsWith('__')) continue // internal markers like __sourceRef

    // Broken media-library reference.
    if (ctx.mediaExists && MEDIA_ID_PROP_RE.test(key) && typeof raw === 'string' && raw.trim()) {
      if (!ctx.mediaExists(raw)) {
        out.push({
          id: 'broken-media-ref',
          severity: 'warning',
          message: `${widget.type}: "${key}" points to a media item that no longer exists.`,
          widgetId: widget.id,
          widgetType: widget.type,
        })
      }
    }

    // Malformed / insecure URLs.
    for (const str of collectStrings(raw)) {
      if (!URL_PROP_RE.test(str) || str.includes('{{')) continue
      let parsed: URL | null = null
      try {
        parsed = new URL(str)
      } catch {
        out.push({
          id: 'malformed-url',
          severity: 'warning',
          message: `${widget.type}: "${key}" has a malformed URL.`,
          widgetId: widget.id,
          widgetType: widget.type,
        })
        continue
      }
      if (parsed.protocol === 'http:') {
        out.push({
          id: 'insecure-url',
          severity: 'warning',
          message: `${widget.type}: "${key}" uses an insecure http:// URL; many displays block mixed content.`,
          widgetId: widget.id,
          widgetType: widget.type,
        })
      }
    }
  }
  return out
}

/**
 * Lint a display config. Returns findings ordered errors → warnings → info.
 * Non-throwing and side-effect free.
 */
export function lintConfig(config: DisplayConfig, ctx: LintContext = {}): LintFinding[] {
  const findings: LintFinding[] = []
  const layout = Array.isArray(config.layout) ? config.layout : []

  // empty-layout
  if (layout.length === 0) {
    findings.push({
      id: 'empty-layout',
      severity: 'error',
      message: 'This template has no widgets. Add at least one before publishing.',
    })
  }

  const cols = config.gridCols ?? DEFAULT_COLS
  const rows = config.gridRows ?? DEFAULT_ROWS

  for (const widget of layout) {
    const def = ctx.getWidget?.(widget.type)

    // unknown-widget-type
    if (ctx.getWidget && !def) {
      findings.push({
        id: 'unknown-widget-type',
        severity: 'error',
        message: `Unknown widget type "${widget.type}". It won't render on the display.`,
        widgetId: widget.id,
        widgetType: widget.type,
      })
    }

    // widget-out-of-bounds
    if (!isWidgetInBounds(widget, cols, rows)) {
      findings.push({
        id: 'widget-out-of-bounds',
        severity: 'warning',
        message: `${def?.name ?? widget.type} extends outside the ${cols}×${rows} grid and may be clipped.`,
        widgetId: widget.id,
        widgetType: widget.type,
      })
    }

    findings.push(...checkRequiredOptions(widget, def))
    findings.push(...checkUrlsAndMedia(widget, ctx))
  }

  const rank: Record<LintSeverity, number> = { error: 0, warning: 1, info: 2 }
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity])
}

/** Convenience: counts by severity, for badges. */
export function summarizeFindings(findings: LintFinding[]) {
  return {
    error: findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
  }
}
