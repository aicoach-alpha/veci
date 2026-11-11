# Live VeCI change record — 11 November 2026

These changes were made to the router through the user-authorized Windows Ethernet management laptop, without a firmware flash.

## Guest portal startup guard
- Preconditions: `wireless.veci_guest.disabled=1`, `network.veci_guest` returned `NO_DEVICE`.
- Set `uhttpd.veci_guest.enabled=0`; disabled boot startup of `uspot` and `uspotfilter` which were repeatedly crashing without a configured guest AP.
- Kept all guest network definitions. Re-loaded `uhttpd`.
- **Verification:** TCP 443 LISTEN, `ubus session list` responsive, correct UCI setting, no uspot boot symlinks. Guest access itself remains disabled by design; enabling requires a real interface and correct uspot configuration.
- Saved backups on the management laptop, not on the router overlay.

## LTE event evidence extension
- Verified initial live WAN V2 SHA-256: `89c792b74d160f7c1df57b779ab2b9d3ac6de5f6c4a9743c9a05145d84b71147`.
- Added **read-only AT+CGATT? and AT+CGACT?** capture exclusively on a genuine `icmp_and_https_failed` event via the existing shared AT lock. Output is bounded booleans/unknown written to `/overlay/veci-reliability/wan-pdp-YYYYMMDD.csv` (`epoch,attached,cid1_active`). No SIM or account identifiers or SMS payloads captured.
- This extension **does not change LTE recovery policy or reset the modem**.
- Shell `sh -n`: PASS. Post-deployment SHA-256: `ce6fbb3f6cbb60d06274d8c1767ebc6925cce073ea25cffba49da18e9b41c1af`.
- LTE daemon restart: PASS. Current LTE interface: up. Public ICMP 1.1.1.1: PASS (0% loss). Prior watchdog file is backed up on the management laptop.
- Periodic upstream outage root cause is still unknown until event-time PDP evidence is captured. A healthy-time sample gave `CGATT=1, CGACT CID1=1`; this does not rule out session drops during the recurring incidents.

## Wi-Fi kernel
- Driver mt76 timeout/deadlock was observed in kernel with `hostapd` and `rpcd` in D state. Standard reboot restored SSID and login.
- Upstream candidate fix is staged in this PR but **not installed** on production. The original beacon disappearance is not proven fixed by that patch; an exact-matching verified firmware build and bench validation are mandatory.

## Windows scheduled monitoring
- No Windows scheduled monitoring was re-enabled.
