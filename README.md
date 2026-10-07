# VeCI

**VeCI — Easy Configuration Interface for OpenWrt**

VeCI is a lightweight, vendor-style administration UI for OpenWrt. It is designed for people who want a router interface that feels like a polished commercial product without losing access to OpenWrt's advanced capabilities.

VeCI is not a LuCI theme. It is its own frontend and its own OpenWrt package.

## What makes VeCI different

- **Task-first navigation:** Home, Internet, Wi-Fi, Devices, Security, Network, System and Apps.
- **Hardware-aware:** the displayed manufacturer/model comes from the running OpenWrt board data; VeCI does not hardcode one router model.
- **CoachAssist visual language:** light blue surfaces, dark navy navigation, compact cards and restrained shadows aligned with the design system used by CoachAssist / vervue.my.id.
- **Low-resource core:** no mandatory DPI engine, flow database, traffic-history daemon or app store background service.
- **OpenWrt-native:** UCI, ubus, rpcd, netifd, firewall4 and dnsmasq remain the source of truth.
- **Expert fallback:** when LuCI is installed, VeCI exposes it as an Expert path while native VeCI coverage is still being completed.
- **Safer privilege boundary:** VeCI Core uses narrow rpcd methods instead of blanket shell execution.
- **No stored router password:** the password is never persisted by VeCI in browser storage.

## Current native pages

| Area | Native VeCI coverage |
| --- | --- |
| Home | Router identity, Internet status, Wi-Fi count, DHCP clients, uptime and memory |
| Internet | Interface status, addresses, protocol, connect/disconnect |
| Wi-Fi | Radio/SSID discovery plus native SSID, security, visibility, enable/disable and client-isolation editing |
| Devices | DHCP client inventory |
| Security | Firewall zones, rules and redirect summary |
| Network | Interfaces, bridges and physical-port inventory |
| System | Hardware, firmware, runtime resources and reboot |
| Apps | Lightweight capability discovery |

Advanced configuration remains available through LuCI Expert until each area reaches native parity. See [docs/FEATURE-MATRIX.md](docs/FEATURE-MATRIX.md).

## Hardware identity

VeCI reads the real board data from:

```sh
ubus call system board
```

The UI prefers the returned `model`, `board_name`, release and kernel values.

That means:

- a ZBT router shows the ZBT model reported by OpenWrt;
- a GL.iNet, Xiaomi, TP-Link, NanoPi or x86 OpenWrt installation shows its own reported identity;
- generic VeCI source does not contain a hardcoded WE5927 model string.

Device-specific functionality belongs in optional `veci-app-*` packages.

## Architecture

```text
Browser
  |
  +-- VeCI shell
  |    +-- task-oriented pages
  |    +-- hardware/capability discovery
  |    +-- CoachAssist-derived visual tokens
  |
  +-- /ubus
       +-- session
       +-- system
       +-- network.interface
       +-- network.wireless
       +-- uci
       +-- veci (narrow rpcd helper)
```

The active source is intentionally split into small VeCI-owned modules:

```text
veci/
  index.html
  app.css
  js/
    app.js
    lib/
      api.js
      dom.js
      format.js
      icons.js
    pages/
      home.js
      internet.js
      wifi.js
      devices.js
      security.js
      network.js
      system.js
      apps.js
```

## Resource policy

VeCI Core is intended to remain practical on small OpenWrt hardware, including 64 MB RAM class devices.

Heavy features are optional apps:

- DPI / application classification
- long-term flow history
- vnStat-style history
- advanced bandwidth accounting
- speed-test daemons
- cellular modem integration
- captive portal / voucher management

A feature may be visually integrated with VeCI without becoming a mandatory Core dependency.

## Install / build

VeCI is still development software.

```bash
git clone https://github.com/aicoach-alpha/veci.git
cd veci
pnpm install
pnpm check
```

The production web bundle is written to `dist/veci/`.

OpenWrt packaging is defined in [Makefile](Makefile). The package is architecture-independent (`PKGARCH:=all`) and the release workflow validates both OpenWrt 24.10 and 25.12 packaging.

## Custom firmware integration

A firmware vendor can make VeCI the default landing page while keeping LuCI available as Expert.

For the aicoach-alpha ZBT firmware, the intended integration is:

```text
default administration UI -> VeCI
advanced compatibility UI -> LuCI Expert
cellular controls         -> veci-app-cellular
voucher controls          -> veci-app-voucher
```

Those device-specific apps are not hardcoded into generic VeCI Core.

## Security

Read [SECURITY.md](SECURITY.md).

Important defaults:

- same-origin ubus access;
- session token stored only in `sessionStorage`;
- no persistent plaintext administrator password;
- no generic `file.exec` permission in the VeCI Core ACL;
- public third-party app feed disabled until VeCI has a signing/review pipeline;
- destructive operations require explicit confirmation.

## Project documents

- [Architecture](docs/ARCHITECTURE.md)
- [Source independence](docs/SOURCE-INDEPENDENCE.md)
- [Feature matrix](docs/FEATURE-MATRIX.md)
- [Roadmap](docs/ROADMAP.md)
- [Application model](docs/addons.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Attribution](NOTICE.md)

## Attribution

VeCI was informed by the public MoCI project and the OpenWrt community discussion about modern router UIs. The active VeCI source has since been re-architected into its own application shell, page model, visual system, rpcd helper and packaging boundary.

The upstream attribution required for reused/derived material is retained in [NOTICE.md](NOTICE.md).

## License

MIT. See [LICENSE](LICENSE).
