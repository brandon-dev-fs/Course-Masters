---
id: <prefix>-<n>
title: <Feature name> — wireframe
stage: design
status: pending
# optional: approver: human
# optional: approved_at: 2026-04-15T10:30:00Z
---

# <Title> — Wireframe

## Overview

<One paragraph: what this UI does, the primary user flow.>

## Desktop Layout (≥1280px)

<ASCII, mermaid, or structured markdown describing layout. Annotate with Tailwind tokens.>

```
┌─────────────────────────────────────────────────┐
│  Header                                          │
├─────────────────────────────────────────────────┤
│  Main content area                               │
│                                                  │
│  [bg-surface, p-6, max-w-screen-xl]              │
└─────────────────────────────────────────────────┘
```

## Mobile Layout (≤480px)

<Same component set, adapted layout.>

## Component States

For each interactive element, specify all states:

### <Component name>

- **Default**: <description, tokens>
- **Hover**: <description, tokens>
- **Focus**: <description, tokens — must be visible per WCAG AA>
- **Active**: <description>
- **Disabled**: <description, reduced contrast, cursor-not-allowed>
- **Loading**: <description, indicator>
- **Error**: <description, rendered via ErrorMessage>
- **Empty**: <description, guidance text>

## Accessibility Notes

- <Keyboard interactions specific to this UI>
- <ARIA labels for non-semantic elements>
- <Color contrast considerations>

## Required Token Additions

Tokens needed by this design that do not currently exist in `tailwind.config.js`. Frontend developer adds these before using them.

- <e.g., `colors.brand.muted: #6b7280`>
- <Remove section if none needed>

## Open Questions

<Design decisions awaiting human input. Remove section if none.>
