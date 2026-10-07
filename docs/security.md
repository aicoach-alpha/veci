# VeCI application security model

VeCI applications are privileged router-administration code. The application
system is therefore a **supply-chain trust model, not a browser sandbox**.

The project-wide security policy is in [../SECURITY.md](../SECURITY.md).

## Current default

The public `veci-app-*` feed is **disabled by default** while VeCI is in
development. VeCI does not ship a copied upstream signing key as if it were a
VeCI trust root.

A future public feed must have a VeCI-controlled signing key, documented key
rotation, checksums, and a reproducible package pipeline before it is enabled by
default.

## Authentication

VeCI uses an OpenWrt ubus session. The router password is not stored by VeCI.
Only the ubus session token is retained in browser `sessionStorage`.

## Application privilege

If the administrator logs in as `root`, JavaScript running inside that session
can potentially exercise root-authorized ubus operations. An ACL declaration
therefore documents intended permissions but does not magically sandbox
client-side code from a root session.

For that reason:

- remote JavaScript is not treated as a safe extension mechanism;
- signed package provenance is required for the future public feed;
- server-side helpers should expose narrow rpcd methods;
- heavy or privileged daemons should use normal OpenWrt procd hardening where
  possible;
- application UI data must be escaped before insertion into HTML.

## Sideloading

Development sideloading is for developers only and remains opt-in. It must never
be presented as equivalent to a signed package.

## Future hardening

The long-term model is a dedicated non-root VeCI rpcd identity with enforceable
ACL groups for routine administration, plus explicit privilege elevation for
operations that truly require root.
