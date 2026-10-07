# VeCI feature parity matrix

VeCI is intended to become the everyday default OpenWrt GUI without removing OpenWrt capabilities.

Until a row reaches **Native**, the firmware keeps LuCI available through **Expert**. A feature is never marked Native merely because VeCI can display part of it.

| Area | VeCI status | Native coverage | Expert / remaining coverage |
| --- | --- | --- | --- |
| Router identity | **Native** | Live model, board, firmware, kernel from `system.board` | — |
| Home / health | **Native** | Internet state, Wi-Fi count, DHCP client count, RAM, uptime | Detailed LuCI status remains available |
| Internet overview | **Native** | Interfaces, protocol, device, address, connect/disconnect, DHCP/static IPv4 and DNS editing for normal uplinks | Cellular uplinks stay on the Cellular page; unusual protocols remain Expert |
| Cellular | **Native when provider exists** | Signal, operator, SIM, data address, reconnect, SIM switching | Modem-specific diagnostics and uncommon AT controls stay device-specific |
| Wi-Fi SSID | **Native** | SSID, WPA2/WPA3 personal security, password update, enable/disable, hidden flag, client isolation | — |
| Guest Wi-Fi | **Native** | Isolated guest SSID, dedicated DHCP/firewall zone, Internet-only forwarding, safe removal of VeCI-owned sections | Complex multi-zone/custom VLAN guest layouts stay Expert |
| Wi-Fi radio tuning | **Expert** | Radio/channel status visible | Channel width, country, power, advanced 802.11, enterprise modes |
| Connected devices | **Native** | DHCP lease inventory, hostname/IP/MAC, lease expiry | ARP/neighbour/wireless association deep detail remains Expert |
| DHCP reservations | **Native** | Create/remove static lease for a connected client | Advanced DHCP options remain Expert |
| Firewall overview | **Native** | Zones, policies, rule/forward counts | Full rule editor stays Expert |
| Port forwarding | **Native** | Create/remove IPv4 DNAT forwards with validation and confirmation | Advanced NAT/reflection/source restrictions stay Expert |
| Network layout | **Native read** | Interfaces, bridges, physical-port inventory | Interface/device/VLAN creation and editing stay Expert |
| Diagnostics | **Native** | Bounded ping/traceroute through narrow rpcd helper | Packet capture and advanced tools stay Expert |
| DNS / DHCP advanced | **Expert** | Basic client/reservation workflows native | dnsmasq advanced settings, host files, relay and unusual DHCP modes |
| System information | **Native** | Model, board, firmware, kernel, uptime, memory, load, overlay use | — |
| Reboot | **Native** | Confirmed router reboot | — |
| Hostname / timezone / NTP | **Expert** | Display only where applicable | Editing not yet native |
| Firmware upgrade | **Expert** | — | Sysupgrade, compatibility check and flash workflow |
| Backup / restore / reset | **Expert** | — | Backup archive, restore, factory reset |
| Packages | **Expert** | App capability view only | Full apk/opkg package management |
| Services / startup | **Expert** | Narrow allow-listed reload actions used internally | General service enable/disable/startup editor |
| System / kernel logs | **Expert** | — | Full log viewer |
| SSH keys / administration | **Expert** | — | SSH key and advanced administration |
| Voucher hotspot | **In development** | Generic VeCI contract and UI planned | Current firmware voucher implementation remains staged until live gates pass |
| Optional apps | **Capability based** | Apps page reports installed capabilities | Public VeCI app feed remains disabled until signing/release gates exist |

## Parity rule

A future release may hide LuCI from the normal navigation only after every administration feature required by that firmware image is either:

1. implemented natively in VeCI; or
2. deliberately classified as an optional Expert capability and still reachable.

LuCI must not be removed from the firmware merely to make VeCI appear complete.

## Resource rule

Native parity does not mean installing every optional OpenWrt service. VeCI only exposes features that exist on the device. Heavy services such as DPI, long-term flow databases and large telemetry stacks remain optional packages.
