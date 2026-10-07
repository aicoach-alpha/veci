# VeCI application model

VeCI Core stays small. Device-specific or resource-heavy features belong in separate OpenWrt packages named:

```text
veci-app-<feature>
```

Examples:

```text
veci-app-cellular
veci-app-voucher
veci-app-sqm
veci-app-vnstat
```

## App contract

An app may contribute:

- one or more pages;
- dashboard cards;
- capability data through a dedicated ubus object;
- its own UCI configuration;
- its own narrow rpcd ACL.

An app must not silently inherit VeCI Core's privileges.

## Discovery

The long-term discovery contract is a small manifest installed under:

```text
/usr/share/veci/apps/<id>.json
```

The manifest will describe:

- id and display name;
- installed version;
- VeCI compatibility range;
- required OpenWrt packages;
- resource tier;
- frontend entry point;
- ubus/rpcd permissions used.

## Resource tiers

- **S:** suitable for small-flash / 64 MB RAM routers.
- **M:** normal modern routers.
- **L:** high-resource devices; may run traffic history, DPI or other daemons.

Core must never automatically install an M/L app on an S-class device.

## Public feed

The public VeCI app feed is disabled during development.

It will not be enabled until VeCI has:

1. its own signing key;
2. documented key rotation;
3. reproducible package builds;
4. compatibility metadata;
5. permission/resource disclosure.

No upstream or third-party signing key is rebranded as a VeCI key.
