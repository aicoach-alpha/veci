# VeCI roadmap

## Phase 0 — foundation

- Import the MIT-licensed MoCI history as the technical baseline.
- Rebrand package/runtime paths to VeCI.
- Preserve attribution.
- Remove browser-side plaintext password persistence.
- Add dynamic model, board and firmware identity.
- Introduce task-oriented top-level navigation.
- Keep LuCI Expert fallback optional.
- Add lint, formatter, build and package CI.

## Phase 1 — vendor-style everyday UI

- Home health dashboard.
- Internet wizard and status.
- Wi-Fi cards per radio / SSID.
- Connected Devices inventory with friendly names, reservation and block controls.
- Security center with firewall state and port-forward shortcuts.
- Guest Wi-Fi workflow.
- First-run setup wizard.
- Mobile-first navigation.
- Light/dark/auto appearance.

## Phase 2 — full native administration parity

Cover all settings currently available through the retained LuCI compatibility path:

- advanced interface/device/bridge/VLAN configuration;
- IPv4/IPv6 routes and rules;
- complete firewall4 surface;
- DHCP/DNS advanced options;
- package/service/startup management;
- firmware, backup, reset and recovery;
- logs and diagnostics;
- SSH keys and system administration.

Parity is measured by a maintained feature matrix, not by removing the Expert link.

## Phase 3 — capability and profile engine

- automatic router/AP/switch role detection;
- cellular capability provider;
- multi-WAN/failover provider;
- dynamic menu composition;
- board-specific extensions without core hardcoding.

## Phase 4 — application ecosystem

- `veci-app-*` package convention;
- signed package feed;
- install-time permission/resource disclosure;
- app compatibility metadata;
- no unsigned remote JavaScript execution.

## Phase 5 — custom firmware default

For the aicoach-alpha ZBT firmware:

- VeCI becomes the default landing page;
- model identity comes from the live board data;
- cellular/SIM controls appear through a VeCI cellular app;
- voucher management appears through `veci-app-voucher`;
- LuCI remains available under Expert until native parity gates are green.

## Release gates

A stable release requires:

- formatter/linter clean;
- JavaScript syntax/build tests clean;
- package build on OpenWrt 24.10 and 25.12;
- no plaintext credential persistence;
- security review of rpcd helpers and ACLs;
- real hardware tests on at least one small-MIPS router and one larger reference device;
- documented upgrade/rollback path;
- semantic versioned release and checksums.
