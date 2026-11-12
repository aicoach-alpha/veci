# VeCI single-owner menu, IPv6 default off, low-downtime policy

## Status 2026-11-12
Staged source implementation in `aicoach-alpha/veci`, **not installed on physical router**. Firmware project `aicoach-alpha/zbt-we5927-openwrt` requires a pinned VeCI source update plus exact-board image UAT before release.

## Single-owner navigation
- Home: dashboard only
- Internet: WAN/LTE data path overview; modem-specific controls stay in Cellular
- Wi-Fi: radio and SSIDs
- Cellular: modem, SIM, SMS
- Network: LAN, DHCP, DNS, IPv6, device entry point
- Security: firewall
- System: firmware OTA, backup/restore, admin, diagnostics, reboot
- Apps: optional addon inventory/install
- Devices remains a deep link from Home or Network.
- Old routes `update`, `firmware`, `ota` resolve to System; `ipv6` resolves to Network. Do not render an extra Update main tab.
- Current VeCI main repository does not itself implement a complete OTA updater. A real OTA panel must use a signed updater backend only; it must not present a fake functional button. Other deployed VeCI overlays may include duplicate OTA routes and require source capture before patching.

## IPv6 policy
- New installations ship with `veci.ipv6.enabled=0`, kernel IPv6 policy off and LAN RA/DHCPv6 disabled via the boot helper.
- Existing installations whose preserved config lacks a `veci.ipv6` section are **left unchanged** until operator action.
- Network > IPv6 provides explicit Off/On selection and `ipv6Configure` through authenticated rpcd ACL.
- Setting the mode only persists a UCI desired-state value. **No live netifd restart, Wi-Fi reload, modem reset, or service action** is performed. The UI accurately says **next router restart**. The boot helper runs before normal network startup.
- Setting On restores kernel IPv6 enablement and *only* narrow default LAN/wan6 UCI options if those sections exist. IPv6 external connectivity depends on ISP/modem. No WAN6 interface is fabricated.
- Legacy `99-veci-ipv4-only.conf` policy must be migrated separately before On is allowed; fail closed rather than presenting an active IPv6 state.
- Boot changes are idempotent: UCI files are committed only if values change. No periodic storage writes.

## Gate before deploy
1. Confirm exact live UI asset ownership and pinned `aicoach-alpha/veci` commit in both build/OTA paths.
2. Verify the router's real IPv6 disabled config and conflicting legacy sysctl package. Migration must not remove previous config without backup.
3. Test mock RPC, authentication/ACL, effective runtime status, boot transitions Off->On->Off, external IPv6 availability (when operator supports), and unchanged IPv4 LTE + DHCP.
4. Verify Wi-Fi still advertises SSID from independent clients, SMS transactions, VeCI login, and network monitoring during a staged upgrade.
5. No firmware flash or live reboot until signed exact-board sysupgrade, backup/ART protection, and 72h acceptance.
6. Measure actual menu bundle size, idle RSS, boot time, beacon uptime, LTE recovery, not guessed improvements.

## Downtime objective
Target zero **runtime** interruption for preference changes. A later planned reboot necessarily has downtime; quantify it in hardware UAT. Do not promise zero downtime or automatic dual-bank rollback on the WE5927's 8 MB NOR.
