# Design Rules

Loaded by: `designer`, `frontend-architect`, `frontend-developer`.

## Approach

- Desktop-first design. Default layouts target desktop viewports; adapt down to tablet and mobile via Tailwind's `max-*` breakpoints.
- Minimum supported viewport: 360px width.
- Follow Tailwind defaults unless a project-specific token is defined.

## Accessibility

- Target WCAG 2.1 Level AA.
- Color contrast: 4.5:1 for normal text, 3:1 for large text (18pt+ or 14pt+ bold).
- Never communicate state with color alone. Pair color with an icon, label, or shape.
- All interactive elements must be reachable and operable by keyboard.
- Focus states are required and must be visible against the background.
- Form fields must have visible labels (not placeholder-only).

## Component behavior

- Loading states: every async action has a visible loading indicator.
- Empty states: every list or collection view has an empty state with guidance on what to do next.
- Error states: rendered via `<ErrorMessage>` (see `frontend.md`).
- Disabled states: visually distinct from enabled, with reduced contrast and `cursor-not-allowed`.

## Layout

- Use Tailwind's spacing scale exclusively. Do not use arbitrary pixel values.
- Maintain consistent rhythm: prefer `space-y-*` and `gap-*` over manual margins between siblings.
- Container max-widths come from Tailwind's `max-w-*` scale.

## Typography

- Font sizes from Tailwind's type scale (`text-sm`, `text-base`, etc.). Do not use arbitrary sizes.
- Limit font weight variations to two per surface (e.g., `font-normal` and `font-semibold`).
- Line height pairs with font size via Tailwind's defaults.

## Color

- Use semantic Tailwind tokens where defined in `tailwind.config.js` (e.g., `bg-primary`, `text-danger`).
- Never hardcode hex values in components.
- When a needed semantic color does not exist, the designer adds it to the Tailwind config as part of the design artifact, not the developer ad hoc.

## Iconography

- Single icon library across the app. Document the choice in `tailwind.config.js` or a top-level README.
- Icons used decoratively get `aria-hidden="true"`. Icons that convey meaning get an `aria-label`.

## Wireframes

When `/design` produces a wireframe, it must include:

- Layout at desktop viewport (≥1280px width).
- Layout at mobile viewport (≤480px width).
- All states for each interactive element: default, hover, focus, active, disabled, loading, error, empty.
- Annotations referencing the design tokens used (color, spacing, type scale).

Wireframes do not need to be high-fidelity mockups. ASCII, mermaid diagrams, or structured markdown describing layout and component composition is sufficient as long as it covers the above.

## Design token gaps

If a design requires a token (color, spacing, font size, breakpoint) that does not exist in `tailwind.config.js`, the designer adds it to the wireframe doc as a "Required Token Additions" section. The frontend developer adds these to `tailwind.config.js` during implementation before using them.

Never use arbitrary values (e.g., `text-[13px]`, `bg-[#ff5500]`) to work around a missing token. Add the token instead.
