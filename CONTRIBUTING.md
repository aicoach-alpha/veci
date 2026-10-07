# Contributing to VeCI

VeCI is an independent OpenWrt administration UI. The project intentionally does not mirror LuCI's menu structure or MoCI's source layout.

## Principles

1. **OpenWrt stays the source of truth.** Use UCI/ubus/rpcd; do not create a parallel settings database.
2. **Everyday tasks first.** A normal router owner should see Internet, Wi-Fi, Devices, Security, Network and System before low-level configuration terminology.
3. **No hardware hardcoding in core.** Read model and capabilities from the running device. Board-specific features belong in optional apps.
4. **Small routers matter.** Core changes must remain reasonable for 64 MB RAM / small-flash devices.
5. **Narrow privileges.** Do not add general shell execution merely to make a page easier to implement.
6. **No password persistence.** The administrator password must never be written to browser storage.
7. **Feature parity is measured, not claimed.** Until a native VeCI page covers an expert feature, the optional LuCI Expert path remains available.

## Source layout

```text
veci/
  index.html             minimal application shell
  app.css                VeCI / CoachAssist visual system
  js/
    app.js               routing, authentication, shell state
    lib/
      api.js             ubus + UCI client
      dom.js             safe rendering helpers
      format.js          presentation formatting
      icons.js           local SVG icon set
    pages/
      home.js
      internet.js
      wifi.js
      devices.js
      security.js
      network.js
      system.js
      apps.js

files/
  rpcd-veci              narrow server-side helper
  veci.config            VeCI runtime preferences

rpcd-acl.json            VeCI rpcd ACL
Makefile                 OpenWrt package
```

## Local checks

```bash
pnpm install
pnpm check
```

The production bundle is emitted to `dist/veci/`.

## Adding a page

A page module exports an object with:

```js
export default {
  id: 'example',
  title: 'Example',
  eyebrow: 'CATEGORY',
  icon: 'apps',
  async render(context) {
    context.root.innerHTML = '...';
  }
};
```

Register the module in `veci/js/app.js`. Prefer textContent or the shared HTML escaping helper for device-provided strings.

## Backend changes

If a page cannot be implemented safely using standard ubus objects, add one narrow method to `files/rpcd-veci` and grant only that method in `rpcd-acl.json`.

Do not add blanket `file.exec` permissions.

## Pull request gate

A PR should include:

- the user problem being solved;
- screenshots for visual changes where practical;
- supported OpenWrt versions / devices tested;
- output of `pnpm check`;
- any new rpcd permissions and why they are necessary;
- RAM/flash impact for new dependencies.
