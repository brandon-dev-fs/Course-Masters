---
id: cm-0024
title: Home page UI polish — color migration, mobile nav, hero transition, card definition
stage: design
status: approved
approver: human
approved_at: 2026-05-23T00:00:00Z
---

# Frontend Plan: cm-0024

## 1. Overview

This plan covers four discrete, non-overlapping frontend tasks that together polish the home and landing pages:

1. **Token migration** — Replace every hardcoded `green-500`/`green-600` Tailwind utility across six component files with the approved design-system tokens (`bg-green-primary`, `text-green-primary`, `bg-green-surface`, `text-green-surface-text`). Also correct the `--success` dark-mode value in `index.css`.
2. **Mobile navigation drawer** — Add a hamburger button to `Layout.tsx` (hidden at `md` and above) that opens a new `MobileDrawer` component sliding in from the right, containing all nav items with full keyboard accessibility.
3. **Navbar hero-overlay** — Make the `Layout.tsx` header transparent when the guest landing page hero is in the viewport, transitioning to the standard opaque state on scroll or on any other page/user state.
4. **Light-mode card and hero definition** — Verify and enforce `bg-surface border border-border` on `CourseCard` (already present; confirmed via source read) and add `border-b border-border` to the signed-in variant of `HeroSection`.

No API calls are involved. No new dependencies are added.

Acceptance criteria from spec: FR-01 through FR-12, NFR-01 through NFR-05.

---

## 2. Folder Structure

New files to create:

```
client/src/components/MobileDrawer.tsx         ← new shared component
```

Files modified (no new directories needed):

```
client/src/index.css
client/src/components/Layout.tsx
client/src/features/home/HeroSection.tsx
client/src/features/home/HomePage.tsx          ← verify only, likely no change
client/src/features/courses/CourseCard.tsx     ← verify only, likely no change
client/src/components/ResourceCompletionCheckbox.tsx
client/src/components/LessonStatusIcon.tsx
client/src/features/tests/UnitTestCard.tsx
client/src/features/units/UnitCard.tsx
client/src/features/lessons/LearningResourceNav.tsx
client/src/features/exams/ExamCard.tsx
```

---

## 3. Component Tree

### 3a. Modified: `Layout`

**File:** `client/src/components/Layout.tsx`
**Type:** Layout component
**Responsibilities:**
- Renders the sticky application header, `<Outlet>`, and `<Footer>`.
- Adds hamburger button (visible only below `md` breakpoint) that toggles `drawerOpen`.
- Hides all inline nav items below `md` breakpoint.
- Derives `isHeroOverlay` (boolean) from scroll position, current route, auth state, and theme.
- Passes `isOpen`, `onClose`, and a `hamburgerRef` to `MobileDrawer`.

**New state:**
```ts
const [drawerOpen, setDrawerOpen] = useState(false);
const [hasScrolled, setHasScrolled] = useState(false);
const hamburgerRef = useRef<HTMLButtonElement>(null);
```

**Derived value (not stored):**
```ts
const location = useLocation();
const { theme } = useTheme();
const { user } = useAuth();

const isHeroPage = location.pathname === '/' && !user;
// Initialize hasScrolled synchronously on mount to avoid FOUC (NFR-01):
// see pseudocode in Section 9.
const isHeroOverlay = isHeroPage && !hasScrolled && theme !== 'dark';
```

**Props interface:** none (Layout takes no props)

### 3b. New: `MobileDrawer`

**File:** `client/src/components/MobileDrawer.tsx`
**Type:** Shared UI component
**Responsibilities:**
- Renders a fixed full-height panel sliding in from the right.
- Renders a `bg-black/40` backdrop behind it.
- Contains all nav items: Sign In / Sign Up (unauthenticated), Profile, Admin (admin only), dark-mode toggle, Sign Out (authenticated).
- Implements a native focus trap (no library).
- Closes on Escape key, backdrop click, or explicit close button.
- Returns focus to the hamburger button on close via a `focusReturnRef`.

**Props interface:**
```ts
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  focusReturnRef: React.RefObject<HTMLButtonElement>;
}
```

**Internal state:** none (all state is owned by `Layout`).

### 3c. Modified: `HeroSection`

**File:** `client/src/features/home/HeroSection.tsx`
**Type:** Feature UI component
**Responsibilities:** Unchanged. Single targeted diff: add `border-b border-border` to the `className` of the signed-in (`loggedIn === true`) variant's `<section>` element.

**Props interface:** unchanged (`loggedIn: boolean`, `userName?: string`)

### 3d. Verify: `CourseCard`

**File:** `client/src/features/courses/CourseCard.tsx`
**Status:** Already uses `bg-surface border border-border shadow-warm-sm` on the root `<div>`. No code change required. The token values (`--surface: #F9FAFB`, `--border: #E4E4E7`) produce sufficient contrast against `--background: #FFFFFF` in light mode. This file is verified-only; no edits.

### 3e. Verify: `HomePage`

**File:** `client/src/features/home/HomePage.tsx`
**Status:** The course list container uses `px-6 pt-8` with no explicit background. The page is wrapped in `bg-background` from `Layout`'s root `<div>`. Cards sit on `bg-surface` atop a `bg-background` page — correct and sufficient. No code change required.

### 3f. Token-migration targets (no structural change)

Each file below receives class string replacements only. Props, logic, and structure are unchanged.

| Component | File |
|---|---|
| `ResourceCompletionCheckbox` | `client/src/components/ResourceCompletionCheckbox.tsx` |
| `LessonStatusIcon` | `client/src/components/LessonStatusIcon.tsx` |
| `UnitTestCard` | `client/src/features/tests/UnitTestCard.tsx` |
| `UnitCard` | `client/src/features/units/UnitCard.tsx` |
| `LearningResourceNav` | `client/src/features/lessons/LearningResourceNav.tsx` |
| `ExamCard` | `client/src/features/exams/ExamCard.tsx` |

---

## 4. Client Routes

No new routes. No route changes. The mobile drawer and hero-overlay are purely presentational additions to `Layout`, which already wraps all routes except `/login` and `/register`.

The hero-overlay logic reads `location.pathname === '/'` via `useLocation()` within `Layout`. `useLocation()` is already available in the file via `react-router-dom`.

---

## 5. Hooks and Data Fetching

No new hooks. No data fetching changes. All state is local `useState` in `Layout.tsx`.

The scroll listener attaches to `window` in a `useEffect` inside `Layout`. The location and auth state already come from `useLocation()` and `useAuth()`, both of which are already imported or trivially added.

---

## 6. API Integration

Not applicable. This feature makes no API calls.

---

## 7. State Management

### Layout state

All new state lives in `Layout` (the component that owns the header):

| State | Type | Owner | Purpose |
|---|---|---|---|
| `drawerOpen` | `boolean` | `Layout` | Whether the mobile drawer is rendered open |
| `hasScrolled` | `boolean` | `Layout` | Whether the user has scrolled past the hero height threshold |
| `hamburgerRef` | `RefObject<HTMLButtonElement>` | `Layout` | Passed to `MobileDrawer` as `focusReturnRef` for focus restoration |

**Derived (not stored):**
- `isHeroPage`: `location.pathname === '/' && !user` — true only on the guest landing page.
- `isHeroOverlay`: `isHeroPage && !hasScrolled && theme !== 'dark'` — the class-switching flag. Not stored; recomputed on every render from the three independent state pieces above.

### MobileDrawer state

`MobileDrawer` is stateless. It renders open when `isOpen === true` and calls `onClose()` for all dismissal paths. No internal `useState`.

### Token migration targets

No state changes. Pure class string edits.

---

## 8. Authentication and Authorization

The `MobileDrawer` reads auth state via `useAuth()` to conditionally render:
- Unauthenticated: Sign In link, Sign Up link.
- Authenticated: Profile link, Admin link (only when `user.role === 'admin'`), Sign Out button.

The dark mode toggle is always visible in the drawer.

The `isHeroOverlay` logic also reads `user` from `useAuth()` to determine whether the guest hero is active. `Layout` already imports `useAuth()`.

Auth guard pattern: `useAuth()` is called at the top of `Layout` (already present). `MobileDrawer` receives no auth state as props — it calls `useAuth()` directly since it is a shared component that may conceptually stand alone.

The `logout()` function from `useAuth()` is called inside `MobileDrawer`'s Sign Out handler; the component then calls `onClose()` and uses the router's `navigate('/')`.

---

## 9. Pseudocode for Complex Logic

### 9a. Hero-overlay scroll detection in Layout

```
// On mount: initialize hasScrolled synchronously to avoid FOUC
// Read window.scrollY before first paint — no useEffect needed for init

function Layout() {
  const location = useLocation()
  const { user } = useAuth()
  const { theme } = useTheme()

  // Initialize from current scroll position synchronously
  // so the first render has the correct state (NFR-01)
  const heroHeightEstimate = 400  // px — approximate; exact value computed below
  const [hasScrolled, setHasScrolled] = useState(() => window.scrollY > heroHeightEstimate)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const isHeroPage = location.pathname === '/' && user === null
  const isHeroOverlay = isHeroPage && !hasScrolled && theme !== 'dark'

  // Scroll listener — only attach when on the guest hero page
  useEffect(() => {
    if (!isHeroPage) {
      setHasScrolled(false)   // reset when leaving the hero page
      return
    }

    function handleScroll() {
      // Query the hero section height dynamically via the section element
      // Fallback to 400px if element not found
      const heroEl = document.querySelector('[aria-label="Hero"]')
      const threshold = heroEl ? heroEl.getBoundingClientRect().height + heroEl.offsetTop : 400
      setHasScrolled(window.scrollY > threshold)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHeroPage])

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Header class string
  const headerClass = isHeroOverlay
    ? 'sticky top-0 z-40 bg-transparent px-6 py-4 flex items-center justify-between transition-colors duration-300'
    : 'sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-warm-sm px-6 py-4 flex items-center justify-between transition-colors duration-300'

  // Hamburger button: md:hidden, min 44×44px
  // Inline nav items: hidden on mobile (max-md:hidden)
  ...
}
```

**Note on initialization:** Using `useState(() => window.scrollY > heroHeightEstimate)` as the initializer function runs synchronously before the first render, ensuring `hasScrolled` is correct on mount (NFR-01). The `heroHeightEstimate` of 400px is a safe fallback — it errs toward showing the opaque navbar rather than flashing transparent, which is the less jarring failure mode.

### 9b. MobileDrawer focus trap

```
function MobileDrawer({ isOpen, onClose, focusReturnRef }) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Move focus into drawer when it opens
  useEffect(() => {
    if (isOpen) {
      // Small rAF to let the transition start before focusing
      requestAnimationFrame(() => closeBtnRef.current?.focus())
    } else {
      // Return focus to hamburger button on close
      focusReturnRef.current?.focus()
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap — Tab and Shift+Tab cycle within focusable elements
  function handleKeyDownOnDrawer(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !drawerRef.current) return

    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')
    const focusable = Array.from(
      drawerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  // Conditionally render nothing when closed (or use translate + pointer-events)
  // Chosen approach: conditional render (simpler, no animation issues)
  // The slide-in animation is triggered by presence in DOM + CSS transition
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={handleKeyDownOnDrawer}
        className="fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-background border-l border-border shadow-warm-lg flex flex-col z-60
                   animate-slide-in-right"
        // animate-slide-in-right = translate-x-0 transition-transform duration-300 ease-in-out
        // starting from translate-x-full (see CSS below)
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <span className="font-semibold text-primary">Course Masters</span>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close navigation menu"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer body — nav items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
          {!user && (
            <>
              <Link to="/login" onClick={onClose}
                className={drawerLinkClass(isActive('/login'))}>
                Sign In
              </Link>
              <Link to="/register" onClick={onClose}
                className="...primary filled variant">
                Sign Up
              </Link>
            </>
          )}
          {user && (
            <>
              <Link to="/profile" onClick={onClose}
                aria-current={isActive('/profile') ? 'page' : undefined}
                className={drawerLinkClass(isActive('/profile'))}>
                <UserCircle className="w-4 h-4" />
                {user.name}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/users" onClick={onClose}
                  aria-current={isActive('/admin/users') ? 'page' : undefined}
                  className={drawerLinkClass(isActive('/admin/users'))}>
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Drawer footer — theme toggle + sign out */}
        <div className="border-t border-border px-4 py-4 flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-between min-h-[44px] px-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2"
          >
            <span>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          {user && (
            <button
              onClick={handleSignOut}
              className="flex items-center min-h-[44px] px-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  )
}
```

**Sign-out handler inside MobileDrawer:**
```
async function handleSignOut() {
  onClose()
  await logout()
  navigate('/')
}
```

**Active-link helper (local to MobileDrawer):**
```
const location = useLocation()
function isActive(path: string) { return location.pathname === path }

function drawerLinkClass(active: boolean) {
  return active
    ? 'flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl bg-green-surface text-green-surface-text font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2'
    : 'flex items-center gap-2.5 min-h-[44px] px-3 rounded-xl text-text-primary hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-primary focus-visible:ring-offset-2'
}
```

### 9c. Drawer slide animation (CSS)

The conditional-render approach (`if (!isOpen) return null`) means there is no exit animation. The entry animation is achieved with a brief CSS keyframe added to `index.css`:

```css
@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.animate-slide-in-right {
  animation: slide-in-right 300ms ease-in-out forwards;
}
```

This satisfies NFR-02 (≤300ms). The `@media (prefers-reduced-motion: reduce)` block already in `index.css` will suppress this animation to `0.01ms` for users who prefer reduced motion.

---

## 10. Task-by-Task File Changes

### Task A: `index.css` — `--success` dark token fix

**File:** `client/src/index.css`

Single line change inside the `.dark` block:

```
Before: --success: #22c55e;
After:  --success: #16a34a;
```

Also add the `@keyframes slide-in-right` and `.animate-slide-in-right` CSS rule (see Section 9c). Place it after the `pencil-draw` keyframe block for consistency.

---

### Task B: Token migration — `ResourceCompletionCheckbox.tsx`

**File:** `client/src/components/ResourceCompletionCheckbox.tsx`

Current usages and replacements:

| Location | Old class | New class | Rationale |
|---|---|---|---|
| Button `className` conditional (completed, bg) | `bg-green-500/10` | `bg-green-surface` | Wash background when completed |
| Button `className` conditional (completed, text) | `text-green-600` | `text-green-surface-text` | Text on wash background (7.2:1 AAA) |
| Button `className` conditional (completed, hover) | `hover:bg-green-500/20` | `hover:bg-green-surface` | Hover on wash — token handles opacity |
| Inner div conditional (completed, bg) | `bg-green-500` | `bg-green-primary` | Filled checkbox background |
| Inner div conditional (completed, border) | `border-green-500` | `border-green-primary` | Checkbox border matches fill |

Result: the completed state uses `bg-green-surface text-green-surface-text hover:bg-green-surface` on the button and `bg-green-primary border-green-primary` on the inner checkbox indicator.

---

### Task C: Token migration — `LessonStatusIcon.tsx`

**File:** `client/src/components/LessonStatusIcon.tsx`

| Location | Old class | New class |
|---|---|---|
| `quizPassed` branch, outer div bg | `bg-green-500` | `bg-green-primary` |
| `quizPassed` branch, outer div border | `border-green-500` | `border-green-primary` |

The `attempted` branch already uses `bg-warning/10 border-warning` — no change. The default branch already uses `border-border bg-surface-raised` — no change.

---

### Task D: Token migration — `UnitTestCard.tsx`

**File:** `client/src/features/tests/UnitTestCard.tsx`

| Location | Old class | New class |
|---|---|---|
| Status indicator div, `passed` branch, bg | `bg-green-500` | `bg-green-primary` |
| Status indicator div, `passed` branch, border | `border-green-500` | `border-green-primary` |

---

### Task E: Token migration — `UnitCard.tsx`

**File:** `client/src/features/units/UnitCard.tsx`

| Location | Old class | New class |
|---|---|---|
| Accent bar, `isComplete` branch | `bg-green-500` | `bg-green-primary` |
| Order badge, `isComplete` branch, bg | `bg-green-500` | `bg-green-primary` |
| Unit test footer, `testPassed` icon | `text-green-500` | `text-green-primary` |
| Unit test footer, `testPassed` text | `text-green-600` | `text-green-primary` |

Note: `text-green-600` in the footer label conveys "passed" status text. The semantic token `text-success` (`--success: #16a34a`) would also be correct here (it is the same hue). Either `text-green-primary` or `text-success` is acceptable; prefer `text-green-primary` for visual consistency with other status indicators in this file.

---

### Task F: Token migration — `LearningResourceNav.tsx`

**File:** `client/src/features/lessons/LearningResourceNav.tsx`

| Location | Old class | New class |
|---|---|---|
| Resource button `isComplete` check icon | `text-green-500` | `text-green-primary` |

Single class substitution on the `<Check>` icon element.

---

### Task G: Token migration — `ExamCard.tsx`

**File:** `client/src/features/exams/ExamCard.tsx`

| Location | Old class | New class |
|---|---|---|
| Accent bar, `lastAttempt?.passed` branch | `bg-green-500` | `bg-green-primary` |
| Header badge, `lastAttempt?.passed` branch, bg | `bg-green-500` | `bg-green-primary` |
| Score label, `lastAttempt.passed` branch, text | `text-green-600` | `text-green-primary` |

---

### Task H: `HeroSection.tsx` — signed-in hero border

**File:** `client/src/features/home/HeroSection.tsx`

Single class addition to the signed-in variant's `<section>` element:

```
Before: className="w-full py-10 px-5 bg-surface md:py-14 md:px-6"
After:  className="w-full py-10 px-5 bg-surface border-b border-border md:py-14 md:px-6"
```

---

### Task I: `Layout.tsx` — hamburger, mobile hiding, hero-overlay, MobileDrawer mount

**File:** `client/src/components/Layout.tsx`

Changes:
1. Add `useLocation` to the import from `react-router-dom`.
2. Add `useRef` to the React import.
3. Add `drawerOpen` / `setDrawerOpen` state and `hamburgerRef`.
4. Add `hasScrolled` state (initialized synchronously from `window.scrollY`).
5. Add scroll `useEffect` (see Section 9a pseudocode).
6. Add navigation-change `useEffect` to close drawer on route change.
7. Derive `isHeroPage`, `isHeroOverlay`.
8. Replace static `className` on `<header>` with the conditional string.
9. Add `md:hidden` to each inline nav item wrapper (the `<div className="flex items-center gap-1">` div — add `max-md:hidden` so that the whole nav group is hidden below `md`).
10. Add hamburger `<button>` inside the header, with `md:hidden`, wired to `setDrawerOpen(true)`, referencing `hamburgerRef`, with `aria-label`, `aria-expanded`, `aria-controls`.
11. Mount `<MobileDrawer>` below the `<header>` (still inside `<div className="min-h-screen ...">`) with `isOpen={drawerOpen}`, `onClose={() => setDrawerOpen(false)}`, `focusReturnRef={hamburgerRef}`.
12. Add `import MobileDrawer from './MobileDrawer.js'`.

The inline nav items div gets `className="hidden md:flex items-center gap-1"` (was `"flex items-center gap-1"`).

---

### Task J: New `MobileDrawer.tsx`

**File:** `client/src/components/MobileDrawer.tsx`
**Type:** New shared component

Full implementation follows the pseudocode in Section 9b. Key details:

**Imports:**
```ts
import { useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Sun, Moon, UserCircle, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
```

**Props interface** (defined inline at top of file):
```ts
interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  focusReturnRef: React.RefObject<HTMLButtonElement>;
}
```

The component calls `useAuth()` and `useTheme()` directly. It does not receive auth or theme state as props — this keeps the props surface minimal and consistent with how other shared components (`Layout` itself) consume context.

---

## 11. Styling Notes

### Transition on navbar background (hero-overlay)

Apply `transition-colors duration-300` on the `<header>` element at all times. This ensures the background transition is smooth when `isHeroOverlay` flips (FR-09). Do not apply `transition-all` — only the background color and border should animate, not `padding` or `box-shadow`, to avoid layout jank.

### Drawer z-index layering

The backdrop uses `z-50`. The drawer panel uses `z-[60]` (Tailwind arbitrary value) to sit above the backdrop. The navbar uses `z-40`, which is below both, so the drawer correctly covers the header when open.

### Hamburger button classes

```
md:hidden w-11 h-11 flex items-center justify-center
text-muted-foreground hover:text-foreground transition-colors
rounded-xl hover:bg-surface
focus-visible:outline-none focus-visible:ring-2
focus-visible:ring-green-primary focus-visible:ring-offset-2
```

This produces a 44×44px (11 × 4px base) touch target (NFR-04).

### Drawer nav item touch targets

All drawer nav items must have `min-h-[44px]` per WCAG 2.1 AA (NFR-04). Achieved via `min-h-[44px] flex items-center` on every `<Link>` and `<button>` in the drawer body and footer.

### No `dark:` prefix

All conditional styling in `MobileDrawer` and `Layout` uses tokens only (`bg-background`, `border-border`, `bg-surface`, `text-green-primary`, etc.). The token values swap automatically via `.dark` on `<html>`. No `dark:` Tailwind prefix anywhere in the new code.

### Inline styles

The only acceptable inline style is for the drawer's conditional rendering — the slide animation is pure CSS (`@keyframes`). No `style={{ }}` attributes are used.

---

## 12. Edge Cases and Error Handling

### Hero-overlay flash on initial load (NFR-01)

The `hasScrolled` state is initialized with a function: `useState(() => window.scrollY > threshold)`. This runs synchronously before the first render, so the correct header class is applied from frame 1. No flash occurs. The threshold uses `heroHeightEstimate = 400` as a fallback (conservative — errs toward opaque, not transparent).

### Scroll listener cleanup

The scroll event listener is removed in the `useEffect` cleanup function. If the user navigates away from `/`, `isHeroPage` becomes false and the effect re-runs with an early return, removing the existing listener.

### Drawer state on navigation

A `useEffect` watching `location.pathname` sets `drawerOpen(false)` whenever the route changes. This handles the case where a user clicks a nav link (which also calls `onClose()` explicitly) and any other programmatic navigation.

### Escape key with multiple modals

The Escape key listener is added to `document` only when `isOpen === true` and removed on cleanup. If a `Modal` is also open (e.g., a course creation modal), both will receive the Escape event. The existing `Modal` component's own Escape handler will also fire. Since both close on Escape, the behavior is acceptable — the last opened overlay closes first (native DOM propagation order). No special coordination is required.

### `window.scrollY` in SSR

The project is a client-side Vite SPA with no SSR. `window` is always available. No guard needed.

### Focus return when hamburger button is unmounted

The hamburger button is always rendered in the DOM (it has `md:hidden` CSS, not conditional rendering). The `focusReturnRef` is always valid when focus return is called.

### Theme toggle in drawer does not close drawer

The dark mode toggle button calls `toggleTheme()` but does not call `onClose()`. This matches the spec flow (5b): "Theme toggled — Drawer stays open." The toggle does not navigate.

### Reduced motion

`@media (prefers-reduced-motion: reduce)` in `index.css` sets `animation-duration: 0.01ms`. The `animate-slide-in-right` keyframe will complete in effectively zero time, so the drawer appears instantly — acceptable and compliant with the spec's "no new dependencies" constraint.

### Token migration — `text-green-500` vs `text-green-primary` semantic fit

Every hardcoded `text-green-500` / `text-green-600` in the target files signals a "success" or "completed" state. `text-green-primary` (`#047857` light, `#10B981` dark) is the correct named token for these usages. `text-success` (`#16a34a` light) is also in the token set; after the dark-mode fix (Task A), both resolve to identical or near-identical hues. `text-green-primary` is preferred for visual indicator fills/icons; `text-success` is preferred for inline status text labels. The per-file breakdown in Section 10 applies this distinction.

---

## 13. Testing Considerations

### Manual verification checklist

**Token migration:**
- [ ] In light mode: completed `ResourceCompletionCheckbox` shows a dark green filled box (`#047857`) with white checkmark — no longer the old lighter `#22c55e` green.
- [ ] In dark mode: same checkbox shows `#10B981` fill (token swap is automatic).
- [ ] `UnitCard` accent bar for a completed unit uses `bg-green-primary`, not `bg-green-500`.
- [ ] `ExamCard` accent bar for a passed exam uses `bg-green-primary`.
- [ ] `LearningResourceNav` completed-resource check icon is green-primary, not the old green-500.

**Hero overlay:**
- [ ] Load `/` as a guest in light mode: navbar is transparent (no white background visible).
- [ ] Scroll down past the hero: navbar transitions to opaque with `bg-background/90` within 300ms, no layout shift.
- [ ] Scroll back to top: navbar returns to transparent.
- [ ] Switch to dark mode while on `/` as guest: navbar immediately shows opaque state (no transparent behavior in dark mode).
- [ ] Sign in and return to `/`: navbar is always opaque (no transparent behavior for authenticated user).
- [ ] Navigate to any non-`/` route: navbar is always opaque.
- [ ] Hard refresh at `/` while scrolled down: navbar starts in opaque state, no flash.

**Mobile drawer:**
- [ ] At viewport width below 768px: hamburger button is visible; inline nav items are hidden.
- [ ] At 768px and above: hamburger button is hidden; inline nav items are visible.
- [ ] Tapping hamburger opens drawer with slide-in animation (≤300ms).
- [ ] Close button, Escape key, and backdrop tap all close the drawer.
- [ ] On open: focus moves to the Close button inside the drawer.
- [ ] On close: focus returns to the hamburger button.
- [ ] Tab key cycles through drawer items only; focus does not escape to the page behind the backdrop.
- [ ] Shift+Tab cycles backwards.
- [ ] Unauthenticated drawer shows Sign In and Sign Up.
- [ ] Authenticated (non-admin) drawer shows Profile, dark mode toggle, Sign Out.
- [ ] Authenticated (admin) drawer also shows Admin link.
- [ ] Dark mode toggle in drawer toggles theme without closing drawer.
- [ ] Clicking a nav link closes the drawer and navigates.
- [ ] Sign Out closes drawer, calls logout, navigates to `/`.
- [ ] Touch targets: all drawer interactive elements visually appear at least 44px tall.

**Card and hero definition:**
- [ ] In light mode, signed-in home page: course cards have a visible border against the white page background.
- [ ] Signed-in hero section has a visible bottom border separating it from the course list.

### Unit test candidates

These behaviors are well-suited to unit tests using `renderWithProviders` and `jsdom`:

1. **`MobileDrawer` — conditional render**: assert the drawer panel is absent from the DOM when `isOpen={false}` and present when `isOpen={true}`.

2. **`MobileDrawer` — Escape closes drawer**: simulate a `keydown` event with `key: 'Escape'`; assert `onClose` spy was called.

3. **`MobileDrawer` — backdrop click closes drawer**: simulate a click on the backdrop element; assert `onClose` spy was called.

4. **`MobileDrawer` — unauthenticated nav items**: render with `makeAuthContext({ user: null })`; assert Sign In and Sign Up links are present; assert Profile and Sign Out are absent.

5. **`MobileDrawer` — authenticated nav items**: render with `makeAuthContext({ user: makeTeacherUser() })`; assert Profile and Sign Out are present; assert Admin link is absent.

6. **`MobileDrawer` — admin nav items**: render with `makeAuthContext({ user: makeAdminUser() })`; assert Admin link is present.

7. **`Layout` hero-overlay class**: render with `MemoryRouter initialEntries={['/']}` and no user; assert the `<header>` element has `bg-transparent`; simulate scrolling past threshold; assert the `<header>` element has `bg-background/90`.

Test files:
```
client/src/__tests__/components/MobileDrawer.test.tsx
client/src/__tests__/components/Layout.test.tsx   (new test cases, file may already exist)
```

Follow the `renderWithProviders` pattern from `client/src/__tests__/setup/renderWithProviders.tsx`. Mock `../../api/auth.js` with `authClientMock` for session state.
