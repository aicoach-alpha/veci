# VeCI Add-ons

An add-on is a client-side ES module loaded into the VeCI SPA, optionally backed
by a daemon and an rpcd ACL. Two distribution paths:

- **Package (trusted)**: a signed `opkg`/`apk` package in a VeCI feed. Installs
  via the package manager; its ACL and any daemon ship inside the package.
- **Sideload (dev, untrusted)**: fetched from a GitHub URL straight into the
  webroot. Off by default, gets **no** router permissions, and requires the dev
  ACL (`files/veci-dev-sideload.json`) installed by hand. Use only while
  developing.

> Security note: an installed add-on runs in the VeCI session, which is root.
> A signature proves **who** published an add-on, not that it is **safe**.
> Only install add-ons from sources you trust. See `docs/security.md`.

## Anatomy

```
veci-app-<id>/
  manifest.json          required
  addon.js               required (the module; field "entry")
  style.css              optional (field "css")
  files/<daemon>         optional server-side daemon
  files/<id>.init        optional procd init script
  files/acl.json         optional rpcd ACL fragment (permissions)
  Makefile               required to build a package
```

Package name convention: `veci-app-<id>`, installed to
`/www/veci/js/addons/<id>/`.

## manifest.json

```json
{
  "id": "speedtest",
  "entry": "addon.js",
  "name": "Speedtest",
  "version": "1.0.0",
  "description": "Network speed test.",
  "author": { "name": "You" },
  "license": "MIT",
  "css": "style.css",
  "files": ["addon.js", "style.css"],
  "nav": { "route": "/speedtest", "label": "SPEEDTEST", "placement": "top" }
}
```

| field | use |
|-------|-----|
| `id` | `[a-zA-Z0-9_-]+`; also the install dir and route base |
| `entry` | module filename, always `addon.js` |
| `css` | optional stylesheet, injected when the add-on loads |
| `files` | files to copy: **sideload only** (packages list files in the Makefile) |
| `nav.route` | hash route, e.g. `/speedtest` |
| `nav.label` | nav text |
| `nav.placement` | `top` (main nav), `addons` (dropdown group), or `none` (no page) |

Permissions are **not** declared here: they live in the package's ACL fragment
(below), which is what the install screen shows.

## addon.js

```js
export default class SpeedtestAddon {
  constructor(core) {
    this.core = core;
    this.core.registerRoute('/speedtest', () => this.render());
  }

  // optional async setup at load time
  async init() {}

  // optional: contribute to extension points
  getExtensions() {
    return {
      'dashboard:widget': { id: 'speedtest-widget', render: el => this.renderWidget(el) }
    };
  }

  // optional: called on disable/uninstall
  cleanup() {}

  render() {
    const page = document.getElementById('addon-speedtest-page');
    page.innerHTML = `<div class="page-header"><h1>Speedtest</h1></div>...`;
  }
}
```

The page element `addon-<id>-page` is created for you. Useful `core` methods:

- `ubusCall(object, method, params = {}, { timeout, retries })` → `[status, data]`
- `uciGet/uciSet/uciAdd/uciDelete/uciCommit`
- `showToast(message, type)`: `info | success | error`
- `escapeHtml(text)`: always escape add-on-controlled strings before DOM insertion
- `navigate(path)`, `registerRoute(path, handler)`
- `delegateActions(containerId, { action: id => ... })`, `setupModal`, `openModal/closeModal`
- `setupSubTabs(pageId, handlers)`, `renderEmptyTable`, `renderBadge`
- `formatBytes/formatUptime/formatRate`

### Extension points

Return contributions from `getExtensions()`:

| point | contribution | rendered by |
|-------|-------------|-------------|
| `dashboard:widget` | `{ id, render(container) }` | a card on the dashboard |
| `network:tab` | `{ id, render(container) }` | a tab on the network page |

## Permissions (package ACL fragment)

If the add-on calls ubus/uci/file operations beyond what core exposes, ship an
rpcd ACL fragment as `files/acl.json`, installed to
`/usr/share/rpcd/acl.d/veci-app-<id>.json`:

```json
{
  "veci-app-pinglog": {
    "description": "VeCI add-on Ping Log: read latency history",
    "read": { "file": { "/tmp/veci-pinglog.log": ["read"] } }
  }
}
```

`veci-pkg-call inspect` extracts this exact file from the package and shows it on
the install screen, so consent matches what is applied. (Runtime is root, so this
is least-privilege documentation, not a sandbox: see `docs/security.md`.)

## Packaging

Minimal client-only package: see `examples/veci-app-speedtest/`:

```make
include $(TOPDIR)/rules.mk
PKG_NAME:=veci-app-speedtest
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
include $(INCLUDE_DIR)/package.mk

define Package/veci-app-speedtest
  SECTION:=admin
  CATEGORY:=Administration
  SUBMENU:=VeCI Add-ons
  TITLE:=VeCI Add-on: Speedtest
  PKGARCH:=all
  DEPENDS:=+veci
endef

define Build/Compile
endef

define Package/veci-app-speedtest/install
	$(INSTALL_DIR) $(1)/www/veci/js/addons/speedtest
	$(INSTALL_DATA) ./files/manifest.json $(1)/www/veci/js/addons/speedtest/manifest.json
	$(INSTALL_DATA) ./files/addon.js $(1)/www/veci/js/addons/speedtest/addon.js
	$(INSTALL_DATA) ./files/style.css $(1)/www/veci/js/addons/speedtest/style.css
endef

$(eval $(call BuildPackage,veci-app-speedtest))
```

For a daemon + ACL package (init script, ACL fragment, and a `postinst` that
runs `/etc/init.d/rpcd reload` so the new ACL takes effect), see
`examples/veci-app-pinglog/`. The package reloads rpcd itself; VeCI core never
holds that privilege.

## Feeds

VeCI does **not** ship an enabled public application feed yet.

The upstream MoCI feed key and feed URL are deliberately not rebranded or
reused. A VeCI feed will be enabled only after VeCI has its own signing key,
release process, key-rotation policy, and package compatibility checks.

Third-party feeds can still be configured manually by advanced users. Their
trust keys must be installed out of band; VeCI does not grant itself permission
to create a new trust root from an arbitrary web page.

## Publishing to a feed

The repository keeps a development feed-building script as engineering
infrastructure. Before any official VeCI feed is published it must:

1. Build the `.ipk` / `.apk` packages reproducibly.
2. Generate package indexes and checksums.
3. Sign the index with a VeCI-controlled `usign` key.
4. Publish the corresponding public key and fingerprint through a documented
   release channel.
5. Test installation on supported OpenWrt releases.

## Installing

- **Signed package:** preferred once a VeCI or trusted third-party feed exists.
- **CLI package:** `opkg install veci-app-<id>` or the OpenWrt 25.12+ `apk`
  equivalent.
- **Dev sideload:** opt-in, untrusted, and for development only.
