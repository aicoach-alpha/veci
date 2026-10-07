# VeCI design system

VeCI uses the same product-design language as CoachAssist at `vervue.my.id`, adapted for router administration.

It does **not** use MoCI's monochrome dark/glass theme.

## Brand tokens

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#1769AA` | actions, links, active information |
| Primary hover | `#0F4C81` | action hover |
| Secondary | `#F47B20` | limited warning/brand accent |
| Accent | `#168AD8` | gradients and information accents |
| Page | `#F2F7FB` | application background |
| Card | `#FFFFFF` | content surfaces |
| Panel | `#EDF5FB` | secondary surfaces |
| Text | `#102A43` | primary copy |
| Border | `#D7E4EF` | card/form boundaries |
| Navigation top | `#071421` | sidebar/header dark surface |
| Navigation bottom | `#06101A` | sidebar/header dark surface |

## Visual hierarchy

VeCI has two visual zones:

1. **Navigation / device chrome** — dark navy, compact, high contrast.
2. **Configuration workspace** — light, calm, card-based, with strong whitespace.

This mirrors CoachAssist's dark navigation + light analytical workspace rather than copying a generic router skin.

## Interaction rules

- everyday actions use plain language;
- destructive actions use red only when needed;
- orange is reserved for warnings rather than general decoration;
- cards use subtle shadows, not neon glow;
- advanced configuration is visually secondary to common workflows;
- status colors supplement text, never replace it;
- layouts must work down to 320 px viewport width;
- reduced-motion preference is respected.

## Router-specific UI rules

- The hardware model shown in the shell comes from the live OpenWrt board object.
- SSID names, hostnames, interface names and other router-supplied values are escaped before HTML insertion.
- Technical identifiers use the mono font only when it improves scanning.
- UCI section names are not exposed as primary labels unless the operator is in an advanced workflow.

## Iconography

VeCI Core ships its own small local SVG icon set and makes no runtime request to an external icon CDN.

The application mark is a VeCI `V` with network-node accents on a CoachAssist navy background.
