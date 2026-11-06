# @firstform/campus-hub-configurator

Drag-and-drop layout editor for Campus Hub displays, built on
[`@firstform/campus-hub-engine`](https://github.com/ahzs645/campus-hub-engine)
and the widget registry from
[`@firstform/campus-hub-widget-sdk`](https://github.com/ahzs645/campus-hub-widget-sdk).

## What it provides

| Export | Purpose |
| --- | --- |
| `ConfigurePage` | Complete editor page: canvas, sidebar (widgets, presets, settings), share URL. Used by the Next.js `campus-hub` host. |
| `EditorArea` | The editor canvas on its own, for hosts that bring their own chrome (campus-hub-cloud uses this). |
| `./config` | `DisplayConfig` normalization and URL encoding/decoding (`encodeConfig`, `decodeConfig`). |
| `./presets`, `./history` | Starter layouts and undo/redo history. |
| `lintConfig`, layer and layout-diagnostic helpers | Template checks shown in the editor. |

Display settings edited here (theme, grid, aspect ratio, logo, display-level
"Coming Soon") are rendered by the engine's `DisplayRenderer`. Cross-origin
widget requests are proxied by the SDK using the deployment-wide
`VITE_CORS_PROXY_URL`; there is no per-display proxy setting.

## Shared source workflow

Hosts supply their saved source library and a single source-picker callback:

```tsx
<ConfigurePage
  sources={savedSources}
  onPickSource={openSourceWorkflow}
  onChange={saveDraft}
/>
```

`openSourceWorkflow` receives the SDK's `SourcePickRequest`: the widget type,
its `SourceBinding[]`, the requested `library`, `store` or `create` tab, and an
`onSelect(source)` callback. Reuse the same source-management UI as the host's
Sources page. After a source is successfully saved or added from the store,
call `onSelect` with that saved `LinkedSource`; it can be linked immediately,
even before the refreshed library arrives. Closing the source workflow should
leave the widget draft unchanged. The host remains responsible for storage,
authorization and validation of supported source types.

When the request includes `portalContainer`, render the source modal's portal
inside that element. The engine supplies its native widget dialog so the
browser keeps the source modal in the active top layer and its controls stay
interactive. Panel editors leave the host's normal portal placement unchanged.

Alternatively, wrap the editor in the SDK's `SourcePickerProvider`. When
`onPickSource` is omitted, `ConfigurePage` inherits that provider, including
for nested widgets. Hosts using `EditorArea` and `WidgetEditPanel` separately
can wrap their entire workspace in the same provider. The source picker is
available for an empty library and for plugins that declare only a source
binding or an options schema; a bespoke options component is not required.
The provider can also supply `getSourceDisabledReason(source, binding)` to
enforce host rules such as workspace scope in inline lists and returned picks.
Nested editors inherit that policy; custom source controls can read it through
the SDK's `useSourceDisabledReason` hook.

Demo presets contain local sample artwork and example data. They do not
install feeds, load a default website, start a video, or choose a weather
location. Open a widget's settings to select or create a real source. The
configured canvas still renders a user's chosen live sources; source-free
gallery and options previews use the SDK's sample-preview contract.

## Peer dependencies

The host provides `react`, `react-dom`, `lucide-react`, the `@dnd-kit`
packages, `@firstform/json-url`, the engine and the widget SDK.

## Development

Tests and typechecks run with a host's toolchain. From a host checkout such as
`campus-hub-cloud/packages/campus-hub-configurator`:

```bash
npm run typecheck
npm test
```

The host's vitest, React, engine and single copy of the widget SDK are used;
this package declares none of them as dev dependencies, because hosts install
the dev dependencies of `file:`-linked packages and a second SDK copy would
split the widget registry. (The npm-published `@firstform/campus-hub-engine`
0.1.0 is an old snapshot; don't rely on it.) Keep `@firstform/json-url` at
4.1.0: 4.2.0 references an LZMA worker path that breaks bundling. Never run
`npm install` inside a host's `packages/` checkout.

