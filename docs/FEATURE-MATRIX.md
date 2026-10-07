# VeCI feature matrix

VeCI follows a simple rule: **do not remove OpenWrt capability just because the friendly UI is not finished yet.**

When LuCI is installed, the **Expert** entry remains available until the matching VeCI-native surface reaches parity.

| Capability | VeCI native | Expert fallback | Status |
| --- | --- | --- | --- |
| Router / board identity | Yes | n/a | Ready |
| Internet interface status | Yes | Yes | Ready |
| Interface up/down | Yes | Yes | Ready |
| Full interface editor | Partial | Yes | Planned |
| Wi-Fi SSID/radio status | Yes | Yes | Ready |
| Wi-Fi create/edit/delete | Partial | Yes | Planned |
| DHCP client list | Yes | Yes | Ready |
| Static leases | No | Yes | Planned |
| Firewall zone overview | Yes | Yes | Ready |
| Port-forward overview | Yes | Yes | Ready |
| Firewall rule editor | No | Yes | Planned |
| Bridge / port inventory | Yes | Yes | Ready |
| VLAN editor | No | Yes | Planned |
| IPv4/IPv6 route editor | No | Yes | Planned |
| System identity/runtime | Yes | Yes | Ready |
| Reboot | Yes | Yes | Ready |
| Backup / restore | No | Yes | Planned |
| Firmware upgrade | No | Yes | Planned |
| Services / startup | No | Yes | Planned |
| Package management | No | Yes | Planned |
| System / kernel logs | No | Yes | Planned |
| Diagnostics | No | Yes | Planned |
| DDNS | Capability discovery | Yes | App/native planned |
| SQM | Capability discovery | Yes | App/native planned |
| WireGuard | Capability discovery | Yes | App/native planned |
| Captive portal / voucher | Optional app | Yes | In development |
| Cellular modem / SIM | Optional app | Device-specific | In development |

## Parity gate

A LuCI Expert link may be hidden by a custom firmware only when all features that firmware exposes have either:

1. an equivalent VeCI-native workflow, or
2. a deliberate documented replacement.

The ZBT firmware will keep Expert available during the transition.
