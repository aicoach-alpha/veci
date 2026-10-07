# VeCI architecture

VeCI is an OpenWrt administration frontend, not a theme layer over another UI.

## Runtime model

```text
Browser
  |
  +-- /veci/
  |    +-- index.html          shell only
  |    +-- app.css             VeCI design system
  |    +-- js/app.js           router + session + page lifecycle
  |    +-- js/lib/*            API, escaping, formatting, icons
  |    +-- js/pages/*          task-oriented pages
  |
  +-- /ubus
       +-- session
       +-- system
       +-- network.interface
       +-- network.wireless
       +-- uci
       +-- veci                narrow rpcd helper
```

OpenWrt remains the source of truth. VeCI does not maintain a second configuration database.

## Browser architecture

### `js/app.js`

Owns:

- login/logout lifecycle;
- ubus session validation;
- top-level navigation;
- page routing;
- hardware identity shown in the shell;
- toast and confirmation UI;
- optional LuCI Expert detection.

### `js/lib/api.js`

The only general JSON-RPC client in Core.

It:

- posts to same-origin `/ubus`;
- stores only the ubus session token in `sessionStorage`;
- exposes typed convenience methods for the OpenWrt objects VeCI uses;
- does not persist the router password.

### Page modules

Each page represents an operator task, not an OpenWrt config filename:

- Home
- Internet
- Wi-Fi
- Devices
- Security
- Network
- System
- Apps

Pages may use UCI when configuration data is needed, but UCI terminology is not the primary navigation model.

## Server-side helper

`files/rpcd-veci` exposes only a small set of methods:

- `capabilities`
- `clients`
- `networkInventory`
- `health`
- `serviceAction`

The helper exists for information that is inconvenient or unsafe to collect through generic browser-side shell calls.

VeCI Core deliberately does **not** grant blanket `file.exec` access.

## Hardware identity

The shell reads:

```text
system.board
```

and displays the returned:

1. `model`;
2. `board_name`;
3. OpenWrt release information;
4. kernel information.

Generic VeCI source must not contain a specific commercial router model as its UI identity.

## Capability model

Capabilities are discovered from runtime state, not from a hardcoded board list.

Core capability examples:

- OpenNDS config present;
- SQM config present;
- DDNS config present;
- WireGuard available;
- optional `veci.voucher` ubus provider present.

A device-specific package can add a VeCI app without changing VeCI Core.

## Expert compatibility

VeCI checks whether LuCI is available at `/cgi-bin/luci/`.

When present, Expert remains available while native VeCI coverage is incomplete. This guarantees that simplifying the default UI does not intentionally hide OpenWrt capability.

The parity status is tracked in [FEATURE-MATRIX.md](FEATURE-MATRIX.md).

## Resource policy

VeCI Core has no mandatory traffic-history, DPI, speed-test or flow-analysis daemon.

Resource tiers for optional apps:

- **S:** small routers, including 64 MB RAM class devices;
- **M:** normal current routers;
- **L:** high-resource devices.

Apps must declare their expected tier before the public app ecosystem is enabled.

## Firmware integration

Generic package:

```text
/veci/            VeCI
/cgi-bin/luci/    optional Expert UI
```

A custom firmware may redirect its root administration landing page to VeCI without changing the generic package.

Board-specific modules such as cellular or voucher management are delivered as separate `veci-app-*` packages.
