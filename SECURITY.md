# VeCI security policy

## Current development status

VeCI is development software. Do not expose the router administration UI to the public Internet.

## Authentication

VeCI uses OpenWrt ubus session authentication.

VeCI itself does **not** store the administrator password after login. The browser receives an ubus session token, which VeCI keeps in `sessionStorage` so it survives a page reload in the same tab but is not persisted as a reusable password across browser restarts.

A browser's own password manager may still offer to save credentials; that behavior is controlled by the browser/user, not by VeCI.

## Privilege model

An authenticated root administration session is powerful. Client JavaScript running in that session must be treated as privileged code.

Therefore:

- remote third-party JavaScript is not loaded;
- a public third-party app feed is not enabled until package signing and review gates are complete;
- app permissions are not described as a sandbox unless they are actually enforced;
- narrow rpcd methods are preferred over broad file/shell execution.

## Cross-site scripting

All untrusted device names, hostnames, package metadata and log-derived values must be escaped before insertion into HTML.

The SPA ships a restrictive Content Security Policy and same-origin network policy. Any relaxation requires review.

## Firmware and destructive actions

Firmware flashing, factory reset, firewall changes, credential changes and package installation are high-risk operations and must require explicit user confirmation.

VeCI must use OpenWrt validation mechanisms such as `sysupgrade -T` before a flash and must never add force-flash behavior as a convenience shortcut.

## Reporting

Please open a GitHub security advisory or private maintainer contact for vulnerabilities rather than publishing an exploit against currently deployed routers before a fix is available.
