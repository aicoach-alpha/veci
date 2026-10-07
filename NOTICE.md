# Attribution and project independence

VeCI is an independent OpenWrt administration-interface project maintained at:

- https://github.com/aicoach-alpha/veci

## MoCI research / ancestry

VeCI was created after studying the MIT-licensed **MoCI — Modern Configuration Interface for OpenWrt** repository by HudsonGraeme and the related public OpenWrt forum discussion.

An early private/bootstrap phase imported the MoCI development tree as an engineering reference. That imported application tree and its inherited Git history are **not the active VeCI codebase anymore**. The public VeCI `main` and `dev` branches now start from a VeCI-owned root commit and contain VeCI's own application shell, routing, pages, visual system, browser authentication handling, rpcd helper, ACL boundary, build scripts and package layout.

Where any implementation idea or code fragment remains derived from MIT-licensed upstream material, the MIT terms continue to apply.

Upstream reference:

- https://github.com/HudsonGraeme/MoCI
- Reference commit studied during bootstrap: `1797b7575ee101c1606b6c7fd7961d435184c906`
- License: MIT

MoCI names and identifiers are not permitted in VeCI active runtime source. Attribution belongs here and in documentation, not in the product namespace.

## OpenWrt

VeCI is not an official OpenWrt project and is not endorsed by the OpenWrt project unless OpenWrt states otherwise.

OpenWrt and LuCI names/trademarks belong to their respective owners.

## CoachAssist design relationship

VeCI uses the same in-house visual design language as CoachAssist / vervue.my.id: blue brand accents, light information surfaces and a dark navy navigation system. VeCI does not include CoachAssist application logic or user data.
