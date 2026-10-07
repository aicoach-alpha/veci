# VeCI

**Vendor-style Easy Configuration Interface for OpenWrt**

VeCI is a lightweight, hardware-aware web interface for OpenWrt. The goal is to make OpenWrt feel like a polished commercial router UI without removing the power that advanced OpenWrt users expect.

VeCI is derived from the ideas and MIT-licensed codebase of HudsonGraeme/MoCI. The VeCI project keeps the original project history and adds a different product direction: easier navigation, hardware-aware presentation, safe feature clustering, low-resource operation, and an explicit path to full LuCI feature parity. See [NOTICE.md](NOTICE.md).

## Design goals

- **Easy by default.** Common router tasks are grouped as Home, Internet, Wi-Fi, Devices, Security, Network, System and Apps.
- **No fake hardware branding.** VeCI reads the actual OpenWrt board data at runtime and displays the real model / board identity reported by the installed hardware.
- **No feature loss.** VeCI is intended to cover the complete OpenWrt administration surface. On firmware images that also ship LuCI, an Expert entry provides a compatibility escape hatch while native VeCI coverage is completed.
- **Small-router friendly.** Core VeCI stays framework-free and avoids heavy telemetry daemons. Expensive features belong in optional `veci-app-*` packages.
- **Modular.** Full router, AP/switch, cellular-router and other device roles can expose different menus without hardcoding one router model.
- **Secure defaults.** VeCI does not persist the router password in browser storage. The ubus session token is kept in `sessionStorage`, and third-party app loading is disabled by default until the VeCI feed/signing model is production-ready.
- **OpenWrt-native.** Configuration remains UCI/ubus/rpcd based. VeCI is not a separate configuration database.

## Current foundation

The current development branch already includes the MoCI 0.2-era baseline for:

- live dashboard and traffic graphs;
- interfaces, bridges and bridge VLANs;
- wireless configuration;
- firewall zones, rules, NAT and port forwarding;
- IPv4/IPv6 routes;
- DHCP, static leases, DNS and hosts;
- DDNS, QoS and WireGuard;
- diagnostics;
- system configuration, logs, backup/restore, firmware upgrade, services and packages;
- installable application architecture.

VeCI adds:

- vendor-style top-level clustering;
- dynamic model / board / firmware identity using `system.board`;
- session-only credential handling;
- optional LuCI Expert compatibility link;
- low-resource-first architecture;
- device-role profiles and capability-oriented roadmap.

## Hardware identity

VeCI must never hardcode a specific router brand or model into the generic UI.

The dashboard reads:

```text
ubus call system board
```

and uses the returned `model`, `board_name`, `release` and kernel information. A ZBT device therefore shows its ZBT model; another supported OpenWrt router shows its own identity.

Device-specific integrations belong in separate apps or firmware profiles, not in the VeCI core branding.

## Navigation model

The default user-facing hierarchy is:

```text
Home
Internet
Wi-Fi
Devices
Security
Network
System
Apps
Expert
```

The same underlying OpenWrt settings remain available. The hierarchy is intentionally task-oriented rather than exposing UCI concepts first.

## Low-resource policy

VeCI Core targets small OpenWrt devices as well as large routers. Heavy capabilities such as DPI/Netify, long-term traffic databases, large flow collectors or speed-test daemons are optional apps and are not part of the core dependency set.

This is especially important for devices with 64 MB RAM or small NOR flash.

## Installation status

VeCI is currently **development software**. Do not treat the repository as a stable package feed yet.

For development on a normal OpenWrt router:

```bash
git clone https://github.com/aicoach-alpha/veci.git
cd veci
pnpm install
pnpm build
```

The package definition supports OpenWrt packaging. Release packages and signed feeds will be published only after real-hardware and security gates pass.

## Default UI in custom firmware

The standalone VeCI package installs under `/veci/` so it does not unexpectedly replace another administrator's UI.

A firmware vendor or custom firmware can make VeCI the default landing page while retaining LuCI as an Expert fallback. The aicoach-alpha ZBT firmware will use this model after VeCI passes its hardware gates.

## Security

Read [SECURITY.md](SECURITY.md). Important current principles:

- no plaintext router password in localStorage;
- same-origin ubus/rpcd access only;
- no TLS verification bypass;
- no unsigned public app feed enabled by default;
- high-risk actions require explicit UI confirmation;
- LuCI remains available as a compatibility path in the custom firmware until VeCI reaches complete native parity.

## Architecture and roadmap

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Application model](docs/addons.md)

## Upstream inspiration and community feedback

VeCI incorporates lessons from the OpenWrt community discussion around MoCI: modular device roles, semantic releases, proper OpenWrt packages, code-quality tooling, smaller server-side helpers instead of fragile shell pipelines, consistent UCI access, explicit security boundaries, and real-hardware testing.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
