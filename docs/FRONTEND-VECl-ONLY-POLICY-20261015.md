# VeCI is the only user-facing router UI

**Product directive, effective 15 October 2026:** all new router UI, dashboards, operator quota, SMS controls, and feature administration must be implemented in **VeCI**. LuCI is retained only as a pre-existing OpenWrt technical administration fallback, not as an application development surface.

For all new features, implement UI in `veci/js/pages/` (or an explicitly loaded VeCI extension) and route authenticated requests through the shared VeCI `VeciApi` / `ubus` provider. Keep device-specific backend logic in OpenWrt `rpcd`, `ubus`, UCI or small native packages; this does **not** authorize a new LuCI menu or LuCI page.

The Indonesia operator quota view belongs inside VeCI > Cellular. `veci.quota` is a read-only provider. It must fail closed and show no numeric balance until a genuine authorized `carrier_authenticated` snapshot exists. An installed LuCI-only quota view is historical, not the product destination.

No redirect to LuCI may be described as a delivered VeCI feature. Publishing a VeCI change requires source validation, package integration, and real device VeCI UI verification; GitHub commits alone are not LIVE.
