# VeCI architecture

## Product boundary

VeCI is a presentation and administration layer over OpenWrt. UCI, ubus, rpcd, netifd, firewall4, dnsmasq and the normal OpenWrt services remain the source of truth.

VeCI must not create a parallel router configuration database.

## Layers

```text
Browser
  |
  +-- VeCI SPA
  |     +-- task-oriented pages
  |     +-- capability / role detection
  |     +-- application extension points
  |
  +-- OpenWrt ubus JSON-RPC
        +-- system / network / service
        +-- uci
        +-- small veci rpcd helpers
        +-- optional veci-app-* helpers
```

## User-experience layers

### Everyday layer

The default UI uses concepts that router owners recognize:

- Home
- Internet
- Wi-Fi
- Devices
- Security
- Network
- System

A user should not need to understand UCI section names to change a Wi-Fi password, reserve an address, create a guest network or check Internet status.

### Expert layer

Advanced settings remain reachable. During the parity transition, firmware images may keep LuCI installed and expose it through **Expert**. VeCI must never delete or rewrite LuCI configuration just to own the UI.

The long-term target is native VeCI parity, with Expert retained as an optional compatibility tool rather than a requirement.

## Hardware identity

VeCI core derives identity from `ubus system board` and never hardcodes a product model.

Preferred fields:

1. `model`
2. `board_name`
3. OpenWrt release information
4. kernel version

Device-specific controls are capability driven. For example, a cellular page should appear because a modem integration is present, not because the board name equals one hardcoded ZBT model.

## Capability model

A future `veci.capabilities` object will combine:

- board data;
- available wireless PHYs;
- network interfaces and default routes;
- installed packages;
- registered ubus objects;
- UCI configs;
- optional board profile metadata.

This lets one codebase support routers, APs, switches, travel routers and cellular gateways.

## Device-role profiles

Core profiles:

- `full_router`: WAN/LAN, firewall, DHCP, DNS, routing.
- `ap_switch`: status, Wi-Fi, bridges, VLANs, system; L3-only controls hidden from the everyday layer.
- `cellular_router`: full router plus modem/SIM/data/failover integration when an app exposes that capability.
- `minimal`: dashboard and system recovery surface.

Profiles change presentation, not the underlying availability of OpenWrt itself.

## Resource tiers

### Tier S — small routers

Typical: <= 64 MB RAM or <= 16 MB flash.

Core only. No mandatory flow database, DPI engine, Netify, vnStat history daemon or local speed-test server.

### Tier M — normal routers

Optional traffic history, monitoring and convenience apps.

### Tier L — high-resource routers

Optional DPI, richer flow analytics and long-term telemetry.

A heavy app must declare its resource expectations.

## Security architecture

VeCI treats browser-side code as privileged administration code.

Rules:

- never persist the router password;
- session token is stored in `sessionStorage`, not long-lived localStorage;
- application modules are same-origin only;
- no arbitrary remote script loading;
- release apps must be package-managed and signed before the public app store is enabled;
- privileged shell operations should move to narrow rpcd helpers rather than general shell pipelines;
- dangerous actions must be explicit and auditable;
- third-party applications do not gain trust merely because their UI looks native.

## Application packages

Package naming follows OpenWrt convention:

```text
veci-app-<feature>
```

Examples:

```text
veci-app-voucher
veci-app-cellular
veci-app-adblock-fast
veci-app-vnstat
```

Apps can contribute pages, cards or tabs, but resource-heavy or device-specific dependencies stay outside VeCI Core.

## Firmware integration

Generic VeCI does not force itself onto `/`.

A custom firmware may:

1. include `veci`;
2. make `/veci/` the default landing page;
3. retain LuCI under `/cgi-bin/luci/` as Expert;
4. preinstall board-specific `veci-app-*` packages.

This separation lets VeCI be reused by other OpenWrt devices without carrying one vendor's hardware assumptions.
