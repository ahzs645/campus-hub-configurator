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
