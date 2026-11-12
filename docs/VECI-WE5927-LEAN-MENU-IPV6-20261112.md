# WE5927 production-pinned VeCI: single-owner menu and IPv6

**Firmware VeCI source baseline:** `a1504e607d4b7b32ce9f6a6858cdf59dd777acfb` (used by the `zbt-we5927-openwrt` firmware source branch on 2026-11-12). This baseline includes the real SMS / Cellular / Hotspot / firmware OTA modules that the older `veci/main` does not all contain.

## Source edits (not yet live)
- Eight primary menus: Home, Internet, Wi-Fi, Cellular, Network, Security, System, Apps.
- Keep `Updates`, `Hotspot`, `Devices` routes **functional but not top-level**. System has the sole firmware entry to the full Updates page; Apps has the hotspot entry; Network has Connected Devices.
- Remove duplicated OTA upload/check/apply controls from System, retaining the full tools on the Updates subpage. Existing direct routes resolve, and System stays highlighted.
- Network > IPv6: default OFF on new installs, authenticated status/set methods, explicit next-boot apply (no live reload). Existing config without VeCI management section is preserved.
- No disabling/removing LuCI or existing source modules until separate native parity gate is complete.

## Known safety limitations
- Existing WE5927 builds may include `/etc/sysctl.d/99-veci-ipv4-only.conf` from a one-way previous IPv4-only experiment. Enabling IPv6 must refuse until that legacy policy has been migrated with a backup; no silent override.
- Actual ability to obtain a routed IPv6 address depends on operator/modem and wan6 config. The panel reports configured kernel state, not upstream IPv6 availability.
- A mode preference change never reloads Wi-Fi, LTE, network, uhttpd or rpcd. Only a **subsequent planned router reboot** changes kernel/sysctl/network mode.
- OTA automatic installation is a separate release-gate risk; no unattended reboot is permitted in the final stable firmware. Any existing auto-install setting must be audited and forced to manual approval before rollout.
- Existing boot firmware and live UI cannot be claimed modified from this PR. All source and CI results are offline evidence.

## Hardware UAT before release
1. Build exact board + kernel-ABI firmware with pinned reviewed VeCI commit; verify signatures and image size/ART preservation.
2. Confirm all eight nav routes, proper deep links, no OTA duplicate form and no regression to SMS, quota, hotspot, admin login, device list.
3. Validate IPv6 Off -> On -> Off, old config migration, `wan6` presence, no undesired IPv4 DHCP changes, unchanged Wi-Fi/LTE through save.
4. Observe independent Wi-Fi SSID scans, kernel D-state, LTE gateway/DHCP and SMS. Never reboot/flash without backup and local wired recovery.
5. 72-hour continuous evidence, availability, downtime and router RAM/flash measured. No claim of improved uptime without physical metrics.
