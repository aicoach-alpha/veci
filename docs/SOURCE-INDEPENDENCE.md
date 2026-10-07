# VeCI source-independence policy

VeCI is inspired by the problem that MoCI set out to solve, but VeCI is not intended to be a rebranded copy.

## Current source boundary

The active application uses a VeCI-owned structure:

```text
veci/
  index.html
  app.css
  icons/veci.svg
  js/
    app.js
    lib/
      api.js
      dom.js
      format.js
      icons.js
    pages/
      home.js
      internet.js
      wifi.js
      devices.js
      security.js
      network.js
      system.js
      apps.js
```

The active runtime does not contain the former MoCI `core.js`, `js/modules/`, MoCI package names, MoCI rpcd helper, MoCI app feed, MoCI signing key, or MoCI example applications.

## Git history

On 2026-10-07 the VeCI repository branches `main` and `dev` were rebuilt from a clean VeCI root commit after the independent application structure was established.

The public VeCI history therefore represents VeCI development rather than mirroring the upstream MoCI commit history.

Upstream attribution remains in [NOTICE.md](../NOTICE.md).

## CI enforcement

The VeCI quality workflow fails when:

- MoCI identifiers reappear in active runtime/package source;
- legacy MoCI application layout reappears;
- a router model is hardcoded into generic VeCI;
- administrator credentials are persisted in browser storage;
- source formatting, linting, build or rpcd syntax checks fail.

## Design independence

VeCI's product hierarchy is task-oriented:

- Home
- Internet
- Wi-Fi
- Devices
- Security
- Network
- System
- Apps

Its visual language follows the CoachAssist / vervue.my.id product system, not MoCI's monochrome dark/glass visual style.

## Functional rule

Source independence must not become feature regression. VeCI's own pages should gradually cover the full OpenWrt administration surface. LuCI remains available as an Expert fallback until VeCI native parity is proven by the feature matrix.
