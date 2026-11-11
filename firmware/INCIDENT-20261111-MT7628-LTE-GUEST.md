# VeCI MT7628 + LTE + guest portal triage (2026-11-11)

## Device evidence
- Board ZBT-WE5927, MT7628AN, OpenWrt 25.12.5 r33051-f5dae5ece4, kernel 6.12.94, `ramips/mt76x8`.
- Wi-Fi SSID stopped appearing on two phones and Windows AX211 although radio0 was reported up, hostapd ENABLED, 2.4 GHz channel 1 HT20.
- During a radio-only restart, kernel logged `mt76_wmac: MCU message 08 ... timed out`, with hostapd, rpcd, iw and netlink consumers stuck in uninterruptible sleep (D). Login was consequently unavailable. One standard reboot restored access. **This does not prove original beacon-stall cause.**
- Upstream candidate: [openwrt/mt76 PR #1166](https://github.com/openwrt/mt76/pull/1166), draft and unmerged when reviewed. Patch stored here fixes the synchronous error-path deadlock only; source-level review, exact SDK ABI check, built image/kernel-module test and rollback MUST precede deployment.
- Cellular public ICMP plus HTTPS degraded at approximately 122-minute intervals while the LTE gateway responded. Existing WAN Reliability V2 is already installed: SHA-256 `89c792b74d160f7c1df57b779ab2b9d3ac6de5f6c4a9743c9a05145d84b71147` for `we5927-lte`, `089348907ac93f9288b6af796ef382a2dc2ede3b2f8078f081967547cb0c8aa2` for `veci-reliability`. **Do not reinstall V2.** Current modem baseline `CGATT: 1`, `CGACT: 1,1` does not reveal the state during outages. PDP/operator loss vs local RNDIS data-path failure remains unverified.
- `wireless.veci_guest.disabled=1`; `network.veci_guest` is `NO_DEVICE`; but guest uhttpd instance bound to 10.20.0.1:80 and uspot/uspotfilter start despite no valid configuration, causing startup crash loops.

## Live repairs (already verified)
- Backups saved to the user's Windows Ethernet management machine before changes.
- Set `uhttpd.veci_guest.enabled=0`, disabled boot auto-start of uspot and uspotfilter, reloaded uhttpd.
- Verified HTTPS 443 listening, session RPC available, and guest startup disabled without deleting guest configuration.
- Guest portal remains deliberately offline until guest interface/SSID and uspot configs are actually provisioned. This fixes the crash loop, **not** guest access functionality.

## Release requirements for MT7628 patch
1. Import the proposed patch into the *actual* OpenWrt firmware source used to build the signed image; this repository currently hosts VeCI front-end and triage assets, **not a reproducible firmware SDK build**.
2. Confirm the same `mt7603_set_channel()` recursive-lock error path exists in the exact build. Apply patch with context verification.
3. Build against exact 25.12.5 kernel/config/module ABI. Verify kernel `vermagic`, imported symbols, target and original module hashes; refuse mismatches.
4. Bench-test forced channel-error recovery on spare hardware; demonstrate hostapd/rpcd do not enter D state. Do not inject failures on the production router.
5. Prove SSID visibility, stable active clients, SMS and LTE path, and no fresh kernel MCU timeouts. Test at least one 24h period across independent client scans. Preserve working signed image/trust anchor and emergency rollback.
6. Investigate original beacon stall independently; the deadlock patch alone does not fix the original radio stall. Historical evidence: openwrt/mt76 issues #569, #865, #1080, #1151 and upstream PR #1166.

## LTE diagnosis and acceptance
- At the **next actual outage**, record simultaneously: gateway reachability, public ICMP, HTTPS, `AT+CGATT?`, `AT+CGACT?` while holding the existing shared AT lock (see `scripts/veci-modem-pdp-snapshot.sh`). Do not read IMSI, ICCID, IMEI or SMS contents.
- If modem packet service stays attached/active, investigate its RNDIS/NAT upstream data plane and operator session timers; if detached, investigate registration/PDP rejection and modem reconnect policy. The roughly 2-hour periodicity suggests a session timer but is **not proof**.
- Do not force a CFUN, power-cycle, SIM swap, reboot or DHCP flap based solely on one failed public ping while gateway remains reachable.
- Verify 24h end-to-end LTE availability with both the client and router, including multiple prior ~122-minute windows. Do not infer success from a one-time healthy test.

## Guest provisioning (later; not automatic)
- Keep guest services stopped when `wireless.veci_guest.disabled=1` or `network.veci_guest` is `NO_DEVICE`.
- When guest is intentionally enabled, provision its real AP or bridge, firewall isolation, DHCP, valid uspot configuration, and only then enable guest uhttpd/listener and uspot/filter. Validate LAN admin remains reachable.

## Operational boundaries
- No factory reset, blind reflash, module hot-swap, Wi-Fi reload into an already hung kernel, or Windows scheduled monitoring task.
- Current repairs are limited to the guest startup gate. Neither Wi-Fi kernel patch nor LTE modem fix has been deployed; they remain release blockers until verified.
