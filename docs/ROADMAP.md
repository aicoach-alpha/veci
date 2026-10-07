# VeCI roadmap

## v0.2 — independent foundation

- Replace the inherited monolithic shell with VeCI's own page architecture.
- Use CoachAssist visual tokens and interaction language.
- Discover hardware from OpenWrt board data.
- Remove persistent password storage.
- Remove generic shell execution from the Core ACL.
- Add Home, Internet, Wi-Fi, Devices, Security, Network, System and Apps pages.
- Keep LuCI Expert as the compatibility layer.
- Build architecture-independent OpenWrt packages.

## v0.3 — everyday router workflows

- Wi-Fi edit/create workflow with safe WPA2/WPA3 defaults.
- Guest Wi-Fi wizard.
- Friendly connected-device naming.
- Static DHCP reservation workflow.
- Port-forward wizard.
- Internet uplink setup wizard.
- First-run setup wizard.
- Language switch.
- Theme preference: auto / light / dark.

## v0.4 — native advanced networking

- Device / bridge editor.
- Bridge VLAN filtering.
- IPv4/IPv6 route management.
- Firewall rules and redirects.
- DNS / DHCP advanced settings.
- Multi-WAN capability adapter.

## v0.5 — system administration

- Backup / restore.
- Firmware validation and upgrade.
- Service/startup manager.
- Logs and diagnostics.
- Package management with explicit storage/RAM warnings.
- SSH key management.

## v0.6 — app SDK

- Stable `veci-app-*` contract.
- Signed package feed.
- Compatibility metadata.
- Resource-tier declarations.
- Cellular integration contract.
- Voucher/captive-portal integration contract.

## v1.0

Requirements:

- maintained feature matrix;
- production package builds for supported OpenWrt releases;
- no known critical security findings;
- real-device tests on a small MIPS router and a larger reference platform;
- complete recovery path through LuCI or failsafe;
- documentation for firmware vendors making VeCI the default UI.
