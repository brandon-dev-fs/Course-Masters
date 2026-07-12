---
id: cm-0025
title: Landing Page Card & How It Works Updates
stage: design
status: approved
approver: human
approved_at: 2026-05-26T00:00:00Z
---

# Frontend Plan — cm-0025: Landing Page Card & How It Works Updates

## 1. Overview

This plan covers two frontend-only changes to `HomePage` (`/`):

**Part A — Course Card Grid (signed-in users)**
Redesign the existing `CourseCard` component and the `HomePage` course section:
- Replace the current two-column grid with a three-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Add a subject-colored icon, three-dot action menu (`CourseCardMenu`), two-line clamped description, category tag pill, and unit count footer to each card
- Mobile-specific horizontal card layout (icon-left, content-right) below the `md` breakpoint
- Add a `CourseFilters` bar (search input + category pills) above the grid with client-side filtering
- Move the "New Course" button into the section header row

**Part B — How It Works Section (signed-out users)**
Create a new `HowItWorksSection` component rendered below `HeroSection` for guest visitors:
- Three color-coded steps (green / blue / orange) with icons, badges, and a connecting line
- Responsive layout: horizontal three-column grid on desktop, vertical stack on mobile
- "Get started" CTA button linking to `/register`

No API endpoints are added or modified. All data comes from the existing `GET /courses` response, which already includes `_count.units`. Lesson counts are not returned by `GET /courses`; the card footer will show unit count only. Category assignment is a client-side static mapping derived from the course title.

Acceptance criteria references: FR-01 through FR-17, NFR-01 through NFR-06.

---

## 2. Folder Structure

Files to create (new) and modify (existing):

```
client/src/
├── features/
│   ├── courses/
│   │   ├── CourseCard.tsx              [MODIFY] — full redesign
│   │   ├── CourseCardMenu.tsx          [NEW]    — three-dot dropdown
│   │   └── CourseFilters.tsx           [NEW]    — search + category pills
│   └── home/
│       ├── HomePage.tsx                [MODIFY] — state, conditional rendering
│       └── HowItWorksSection.tsx       [NEW]    — guest three-step section
└── api/
    └── types.ts                        [MODIFY] — add CourseCategory type
```

No new hooks are required. No new API modules are required. No new context providers are required.

---

## 3. Component Breakdown

### 3.1 `HomePage` — Modified

**File:** `client/src/features/home/HomePage.tsx`

**Type:** Page component

**Responsibilities:**
- Owns `searchQuery: string` and `selectedCategory: CourseCategory | 'All'` state
- Derives `filteredCourses` from `courses`, `searchQuery`, and `selectedCategory` (no extra state)
- Renders `HowItWorksSection` when `!loggedIn` (below `HeroSection`)
- Renders `CourseFilters` and the card grid when `loggedIn`
- Moves the "New Course" `Button` into the section header `div` (already present there; confirm button is inside the `flex items-center justify-between` row)
- Passes `index` prop to `CourseCard` for deterministic icon color assignment

**New state added:**
```ts
const [searchQuery, setSearchQuery] = useState<string>('');
const [selectedCategory, setSelectedCategory] = useState<CourseCategory | 'All'>('All');
```

**Derived value (not state):**
```ts
const filteredCourses = useMemo(() => {
  return courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      getCourseCategory(course.title) === selectedCategory;
    return matchesSearch && matchesCategory;
  }, [courses, searchQuery, selectedCategory]);
});
```

**Props interface:** No external props (page component).

---

### 3.2 `CourseCard` — Modified

**File:** `client/src/features/courses/CourseCard.tsx`

**Type:** UI component

**Responsibilities:**
- Renders a single course card with: subject-colored icon, course title (as `Link`), two-line clamped description, category tag pill, unit count footer
- Delegates three-dot menu to `CourseCardMenu` (only rendered when `canEdit`)
- Responds to `index` prop to determine icon color variant (index % 3)
- Uses responsive classes for desktop (flex-col) vs. mobile (flex-row) layout

**Props interface:**
```ts
interface CourseCardProps {
  course: Course;          // existing type from api/types.ts
  index: number;           // position in the courses array for deterministic icon color
  canEdit?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}
```

**Icon color variants (determined by `index % 3`):**

| index % 3 | Container class | Icon class | Lucide icon |
|---|---|---|---|
| 0 | `bg-green-surface` | `text-green-primary` | `BookOpen` |
| 1 | `bg-blue-surface` | `text-blue-accent` | `FlaskConical` |
| 2 | `bg-orange-surface` | `text-orange-surface-text` | `Music` |

**Note on orange icon:** The orange step uses `text-orange-surface-text` on `bg-orange-surface` (7.0:1 contrast, AA). Do NOT use `text-orange-accent` or white text on `bg-orange-accent` for normal-size icons — this fails WCAG AA for non-large text.

---

### 3.3 `CourseCardMenu` — New

**File:** `client/src/features/courses/CourseCardMenu.tsx`

**Type:** UI component

**Responsibilities:**
- Renders a `MoreVertical` icon button that toggles a floating dropdown
- Manages `isOpen: boolean` state internally
- Closes on: clicking outside (via `mousedown` listener on `document`), pressing `Escape`, or selecting a menu item
- Returns focus to the trigger button when closed via keyboard
- Calls `onEdit()` or `onDelete()` and then closes the menu

**Props interface:**
```ts
interface CourseCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}
```

**Internal state:**
```ts
const [isOpen, setIsOpen] = useState<boolean>(false);
const triggerRef = useRef<HTMLButtonElement>(null);
const menuRef = useRef<HTMLDivElement>(null);
```

**ARIA attributes:**
- Trigger button: `aria-label="Course options"`, `aria-haspopup="menu"`, `aria-expanded={isOpen}`
- Dropdown container: `role="menu"`
- Each item: `role="menuitem"`

---

### 3.4 `CourseFilters` — New

**File:** `client/src/features/courses/CourseFilters.tsx`

**Type:** UI component

**Responsibilities:**
- Renders the search input (with leading search icon and optional clear button)
- Renders category filter pills as `<button>` elements with `aria-pressed`
- Notifies parent of state changes via callback props; owns no internal state

**Props interface:**
```ts
export type CourseCategory = 'Mathematics' | 'Science' | 'Language' | 'Music' | 'Other';

interface CourseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: CourseCategory | 'All';
  onCategoryChange: (category: CourseCategory | 'All') => void;
}
```

**Static category list (defined as a constant inside the file):**
```ts
const CATEGORIES: Array<CourseCategory | 'All'> = [
  'All', 'Mathematics', 'Language', 'Science', 'Music', 'Other'
];
```

**Accessibility:**
- Search `<input>` has `aria-label="Search courses"`
- Leading search icon has `aria-hidden="true"`
- Clear button (shown when `searchQuery` is non-empty) has `aria-label="Clear search"`
- Category pill group wrapped in `<div role="group" aria-label="Filter by category">`
- Each pill: `<button aria-pressed={selectedCategory === category}>`
- The card grid region in `HomePage` should have `aria-live="polite"` with a live result count

---

### 3.5 `HowItWorksSection` — New

**File:** `client/src/features/home/HowItWorksSection.tsx`

**Type:** UI component (no props — all content is static)

**Responsibilities:**
- Renders the three-step "How it works" section for guest users
- Uses `bg-hero-deep` background to visually continue the hero
- Desktop: `grid grid-cols-3 gap-8` with absolute-positioned horizontal connecting line
- Mobile: `flex flex-col gap-10` with absolute-positioned vertical connecting line (left rail)
- Renders "Get started — it's free" CTA using `Link` from `react-router-dom` styled to match the `Button primary lg` appearance (or rendered as a `Button` that is a link; since `Button` is a `<button>`, wrap in a `<Link>` with matching classes instead of composing with `Button`, as `Button` does not accept an `as` prop)
- All icons have `aria-hidden="true"`
- Decorative connecting line has `aria-hidden="true"`

**Props interface:**
```ts
// No props — component is entirely self-contained static content
```

**Step data (defined as a typed constant inside the file):**
```ts
interface StepConfig {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  containerClass: string; // icon container bg
  iconClass: string;      // icon color
  badgeClass: string;     // badge bg + text
}

const STEPS: StepConfig[] = [
  {
    badge: 'Step 1',
    title: 'Build your course',
    description: 'Create units, add lessons, upload resources and tools for your students.',
    icon: BookOpen,
    containerClass: 'bg-green-surface',
    iconClass: 'text-green-primary',
    badgeClass: 'bg-green-surface text-green-surface-text',
  },
  {
    badge: 'Step 2',
    title: 'Add learning tools',
    description: 'Include flash cards, practice problems, and vocab to reinforce every lesson.',
    icon: Layers,
    containerClass: 'bg-blue-surface',
    iconClass: 'text-blue-accent',
    badgeClass: 'bg-blue-surface text-blue-surface-text',
  },
  {
    badge: 'Step 3',
    title: 'Track your progress',
    description: 'Students complete lessons, take quizzes, and earn a course certificate.',
    icon: TrendingUp,
    containerClass: 'bg-orange-surface',
    iconClass: 'text-orange-surface-text',   // surface-text on surface bg — WCAG safe
    badgeClass: 'bg-orange-surface text-orange-surface-text',
  },
];
```

---

## 4. Client Routes

No new routes. No modified routes. All changes are within the existing `/` route rendered by `HomePage`.

---

## 5. Hooks and Data Fetching

No new hooks are required.

**Existing hooks used:**
- `useAuth()` — from `AuthContext` — determines `loggedIn` and `user`
- `useCanEdit()` — from `src/hooks/useCanEdit.ts` — determines whether three-dot menu and "New Course" button render

**Existing data fetching:**
- `coursesApi.getAll()` — called in `HomePage` on mount when `loggedIn` — unchanged
- The response includes `Course[]`, each with `_count.units` — this is the only numeric count available from the API; lesson count is not exposed by `GET /courses` and will not be shown on the card

**No debounce** on the search input — filtering is against an in-memory array; updates fire on every keystroke (FR-04, NFR-04).

---

## 6. API Integration

This feature makes no new API calls. The single existing call is unchanged:

| Action | Method + Path | Request | Response |
|---|---|---|---|
| Load course list on mount | `GET /courses` | none | `Course[]` (each with `_count.units`) |
| Create course | `POST /courses` | `{ title, description? }` | `Course` |
| Update course | `PUT /courses/:courseId` | `{ title?, description? }` | `Course` |
| Delete course | `DELETE /courses/:courseId` | none | `void` (204) |

All four calls already exist in `HomePage` and are unchanged. `CourseFilters` and `HowItWorksSection` make no API calls.

**Lesson count:** `GET /courses` does not return `_count.lessons`. The card footer will display unit count only (e.g., "4 units"). The lesson count badge shown in the wireframe is omitted until a future API update exposes it. This is explicitly acceptable per the spec ("unit count only is acceptable per spec").

---

## 7. State Management

All new state lives in `HomePage` (page-level `useState`). No new context. No new global state.

| State | Type | Owner | Purpose |
|---|---|---|---|
| `courses` | `Course[]` | `HomePage` | Full fetched course list (existing) |
| `loading` | `boolean` | `HomePage` | Fetch loading state (existing) |
| `error` | `string` | `HomePage` | Fetch error state (existing) |
| `showCreate` | `boolean` | `HomePage` | Controls create modal (existing) |
| `editing` | `Course \| null` | `HomePage` | Controls edit modal (existing) |
| `deleting` | `Course \| null` | `HomePage` | Controls confirm dialog (existing) |
| `searchQuery` | `string` | `HomePage` | NEW — search input value |
| `selectedCategory` | `CourseCategory \| 'All'` | `HomePage` | NEW — active category filter |
| `isOpen` | `boolean` | `CourseCardMenu` | Internal dropdown open/close state |

**Derived values (not state):**

| Derived | Computed from | Location |
|---|---|---|
| `filteredCourses` | `courses`, `searchQuery`, `selectedCategory` | `HomePage` via `useMemo` |
| `canEdit` | `user.role` | `useCanEdit()` hook result |
| `loggedIn` | `user !== null` | `HomePage` inline |
| `colorVariant` | `index % 3` | `CourseCard` inline |
| `category` | `getCourseCategory(course.title)` | utility function, called inline |

**Category mapping utility** (`getCourseCategory`): a pure function that takes a course title string and returns `CourseCategory`. It checks the title against a static keyword list (case-insensitive). If no keyword matches, it returns `'Other'`. This function should be co-located in `CourseFilters.tsx` and exported for use in both `CourseFilters` and `CourseCard`.

```ts
// Pseudocode — not implementation
function getCourseCategory(title: string): CourseCategory {
  const lower = title.toLowerCase();
  if (lower includes any of: 'math', 'algebra', 'calculus', 'geometry', 'arithmetic') return 'Mathematics';
  if (lower includes any of: 'science', 'physics', 'chemistry', 'biology', 'lab') return 'Science';
  if (lower includes any of: 'language', 'english', 'spanish', 'french', 'writing', 'grammar') return 'Language';
  if (lower includes any of: 'music', 'guitar', 'piano', 'theory', 'rhythm') return 'Music';
  return 'Other';
}
```

Export this function from `CourseFilters.tsx` and import it in `CourseCard.tsx` for the category pill label.

---

## 8. Authentication and Authorization

| Component | Auth Requirement | Implementation |
|---|---|---|
| `HomePage` (course grid) | Authenticated | `if (!loggedIn) return` — renders `HowItWorksSection` instead |
| `HowItWorksSection` | Guest only | Rendered by `HomePage` when `!loggedIn` |
| `CourseCard` three-dot menu | `canEdit === true` (teacher/admin) | `{canEdit && <CourseCardMenu ... />}` |
| "New Course" button | `canEdit === true` (teacher/admin) | `{canEdit && <Button ...>}` — already present |
| `CourseFilters` | Authenticated (rendered inside the logged-in branch) | No additional check needed |

`useAuth()` is already called in `HomePage`. The `isLoading` guard is already present (the `if (loading) return <LoadingSpinner fullPage />` exits early before rendering the grid or the how-it-works section). No changes to auth guards needed.

**Note:** The existing `HomePage` checks `if (loading) return <LoadingSpinner fullPage />` and `if (error) return <ErrorMessage message={error} />` before the return — these must remain to prevent premature rendering of the guest section during the async session resolution.

---

## 9. Pseudocode for Complex Logic

### 9.1 `CourseCardMenu` — Click-outside and Escape handling

```
On mount (useEffect, deps: [isOpen]):
  if isOpen:
    attach document.addEventListener('mousedown', handleClickOutside)
    attach document.addEventListener('keydown', handleKeyDown)
  cleanup:
    remove both listeners

handleClickOutside(event):
  if menuRef.current does NOT contain event.target:
    setIsOpen(false)
    // do NOT return focus — user clicked elsewhere intentionally

handleKeyDown(event):
  if event.key === 'Escape':
    setIsOpen(false)
    triggerRef.current?.focus()   // return focus to trigger button
  if event.key === 'ArrowDown' and isOpen:
    event.preventDefault()
    focus first menu item
  if event.key === 'ArrowUp' and isOpen:
    event.preventDefault()
    focus last menu item

Trigger button onClick:
  setIsOpen(prev => !prev)

Menu item onClick (Edit):
  onEdit()
  setIsOpen(false)
  triggerRef.current?.focus()

Menu item onClick (Delete):
  onDelete()
  setIsOpen(false)
  // focus does not return to trigger here — a ConfirmDialog will open
```

### 9.2 `HomePage` — Filtered course list derivation

```
// Inside HomePage render (or useMemo):
filteredCourses = courses.filter(course => {
  matchesSearch = searchQuery === ''
    OR course.title.toLowerCase().includes(searchQuery.toLowerCase())
  
  matchesCategory = selectedCategory === 'All'
    OR getCourseCategory(course.title) === selectedCategory
  
  return matchesSearch AND matchesCategory
})

// Render decisions:
if courses.length === 0:
  render EmptyState("No courses yet", ...)
else if filteredCourses.length === 0:
  render EmptyState("No courses match your filters", ...)
else:
  render grid of filteredCourses.map((course, index) => CourseCard)
```

### 9.3 `HowItWorksSection` — Connecting line strategy

**Desktop (grid layout):**
The connecting line is a `<div aria-hidden="true">` with `absolute` positioning inside the step container:
```
position: absolute
top: 32px            (center of 64px icon = 32px from top of step block)
left: ~17%           (past first icon center)
right: ~17%          (before last icon center)
border-top: 1px solid white/20
z-index: 0
```
The step container has `relative` class. Each step block has `relative z-10` to sit above the line.

**Mobile (flex-col layout):**
The connecting line is a `<div aria-hidden="true">` with:
```
position: absolute
left: 24px           (center of 48px mobile icon = 24px from left)
top: 32px            (below first icon)
bottom: 32px         (above last icon)
width: 1px
background: white/20
z-index: 0
```
The step container uses `relative` class. Icon containers use `relative z-10`.

Responsive: the step container renders as `hidden md:grid grid-cols-3 gap-8 relative` for desktop and `flex flex-col gap-10 relative md:hidden` for mobile — OR a single container that uses responsive flex/grid classes: `grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8 relative`. The connecting line `div` uses `hidden md:block` (horizontal) and `block md:hidden` (vertical).

---

## 10. Styling Notes

### Design tokens used (all from `client/src/index.css`)

| Purpose | Token | Tailwind Class |
|---|---|---|
| Card background | `--surface` | `bg-surface` |
| Card border | `--border-subtle` | `border-border-subtle` |
| Card shadow default | warm-sm | `shadow-warm-sm` |
| Card shadow hover | warm-md | `shadow-warm-md` |
| Card hover lift | — | `hover:-translate-y-0.5 transition-all` |
| Title text | `--text-primary` | `text-text-primary` |
| Description text | `--text-secondary` | `text-text-secondary` |
| Green icon container | `--green-surface` | `bg-green-surface` |
| Green icon color | `--green-primary` | `text-green-primary` |
| Blue icon container | `--blue-surface` | `bg-blue-surface` |
| Blue icon color | `--blue-accent` | `text-blue-accent` |
| Orange icon container | `--orange-surface` | `bg-orange-surface` |
| Orange icon color | `--orange-surface-text` | `text-orange-surface-text` |
| Category pill — Mathematics | `--blue-surface` + `--blue-surface-text` | `bg-blue-surface text-blue-surface-text` |
| Category pill — Science | `--green-surface` + `--green-surface-text` | `bg-green-surface text-green-surface-text` |
| Category pill — Language | `--orange-surface` + `--orange-surface-text` | `bg-orange-surface text-orange-surface-text` |
| Category pill — Music | `--blue-surface` + `--blue-surface-text` | `bg-blue-surface text-blue-surface-text` |
| Category pill — Other | `--border-subtle` | `bg-surface border border-border-subtle text-text-secondary` |
| Active filter pill | `--green-surface` + `--green-surface-text` | `bg-green-surface text-green-surface-text border-transparent font-semibold` |
| Inactive filter pill | — | `bg-surface border border-border-subtle text-text-secondary` |
| How It Works bg | `--hero-deep` | `bg-hero-deep` |
| CTA button | `--green-button` + `--green-button-text` | `bg-green-button text-green-button-text` |
| Three-dot trigger hover | `--surface-raised` | `hover:bg-surface-raised` |
| Dropdown bg | `--surface-raised` | `bg-surface-raised` |
| Delete item | `--destructive` | `text-destructive` |

### Component-level class patterns

**CourseCard — desktop (full card):**
```
rounded-2xl bg-surface border border-border-subtle shadow-warm-sm
hover:shadow-warm-md hover:-translate-y-0.5 transition-all overflow-hidden
flex flex-col md:flex-row p-5 gap-3
```
Wait — the wireframe specifies desktop as flex-col and mobile as flex-row. Use:
```
flex flex-row md:flex-col   // mobile-first: row on small, col on medium+
```
But since the project convention is desktop-first (per `frontend.md` "Desktop-first approach"), use:
```
flex flex-col               // default (desktop)
sm:flex-row md:flex-col    // row on sm (mobile), back to col at md
```
Because `md` is the breakpoint at 768px where mobile becomes tablet. Actually the breakpoint is `< 768px` for mobile, so: default (no prefix) = applies to all sizes, `md:` overrides at 768px+. Pattern:

```
// Mobile (< md): flex-row
// Desktop (≥ md): flex-col
className="flex flex-row md:flex-col"
```

**CourseCard — three-dot button touch target:**
```
relative w-8 h-8 min-h-[44px] min-w-[44px] flex items-center justify-center
rounded-lg text-text-secondary hover:bg-surface-raised hover:text-text-primary
focus-visible:ring-2 focus-visible:ring-green-primary transition-colors
```

**CourseFilters — search input wrapper:**
```
relative mb-4
```
Search `<input>`:
```
w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface
text-text-primary placeholder:text-text-secondary
focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-green-primary
```

**HowItWorksSection — step icon container (desktop):**
```
w-16 h-16 rounded-2xl flex items-center justify-center mb-4
```

**HowItWorksSection — step icon container (mobile):**
```
w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative z-10
```

### Class string length
If any element accumulates more than ~10 utility classes, extract into a `const` string at the top of the component or consider whether the element should be a shared component. `CourseCard` and `HowItWorksSection` are both candidates for local `const` extractions.

---

## 11. Edge Cases and Error Handling

### Empty States

| Condition | `courses.length` | `filteredCourses.length` | Render |
|---|---|---|---|
| No courses exist yet | 0 | 0 | `EmptyState` — "No courses yet" + optional "New Course" action for teachers |
| Courses exist, all filtered out | > 0 | 0 | `EmptyState` — "No courses match your filters" + description "Try a different search term or category" (no action button — user should modify filters) |
| Courses exist, some match | > 0 | > 0 | Card grid of `filteredCourses` |

`CourseFilters` is rendered in all three cases (so the user can modify their query even when no results are shown). The `EmptyState` for filtered results must be a distinct call with a `Search` icon from `lucide-react`, not the default `Inbox` icon.

### Lesson Count Unavailability
`GET /courses` does not return lesson counts. The footer shows unit count only:
```
4 units
```
Do not render a "lessons" badge. Do not make a separate API call per card to fetch lesson counts — no extra requests (spec: no new API calls).

### Three-Dot Menu — Rightmost Column Overflow
The dropdown uses `absolute right-0 top-full mt-1 z-10`. Anchoring to `right-0` of the trigger button prevents right-side overflow for cards in the third column. No additional viewport check is needed because `right-0` naturally aligns the dropdown's right edge with the button's right edge.

### Three-Dot Menu — Close on Outside Click
The `mousedown` event (not `click`) is used to detect outside clicks so the menu closes before any `click` events fire on other elements. This prevents unintended interactions when clicking another card's trigger.

### Three-Dot Menu — Focus Management
When the menu closes via `Escape`, focus returns to `triggerRef.current`. When closed because an action was selected (Edit), focus also returns to the trigger. When closed because Delete was selected, a `ConfirmDialog` opens immediately — focus shifts to that dialog instead.

### Category Mapping — Ambiguous Titles
A course whose title matches no keyword list receives category `'Other'`. The mapping is intentionally loose (substring match, case-insensitive). Teachers cannot set a category explicitly — this is by design for this iteration.

### Search — Special Characters
`String.prototype.includes()` handles most Unicode gracefully. No regex escaping is needed since the search is a plain substring match, not a regex.

### `isLoading` Guard
`useAuth()` returns `isLoading: true` until the session resolves. The existing `if (loading) return <LoadingSpinner fullPage />` in `HomePage` covers the courses fetch, but the `useAuth().isLoading` is not currently guarded. For the guest `HowItWorksSection`, this is acceptable — `!loggedIn` is `true` when `user === null`, which includes the brief moment before the session resolves. If the session resolves to a logged-in user, the component re-renders and hides `HowItWorksSection`. This brief flash is the same behavior as the existing hero section (which already conditionally renders based on `loggedIn`). No additional guard is required.

### Orange Accent — WCAG Constraint
The orange color family is only used via `bg-orange-surface` + `text-orange-surface-text` pairings (7.0:1, AA). Never use `text-white` on `bg-orange-accent` for icon colors or small text. This applies to:
- `CourseCard` index % 3 === 2 icon: `text-orange-surface-text` on `bg-orange-surface`
- `HowItWorksSection` step 3 icon: `text-orange-surface-text` on `bg-orange-surface`
- `HowItWorksSection` step 3 badge: `text-orange-surface-text` on `bg-orange-surface`
- `CourseFilters` "Language" category pill: `text-orange-surface-text` on `bg-orange-surface`

### `dark:` Prefix — Forbidden
Never add `dark:` Tailwind prefix classes. All theming is handled by CSS custom property swapping on the `.dark` class on `<html>`. The design tokens already account for both themes.

---

## 12. File Change Summary

| File | Action | Notes |
|---|---|---|
| `client/src/features/home/HomePage.tsx` | Modify | Add `searchQuery`, `selectedCategory` state; `useMemo` for `filteredCourses`; render `CourseFilters`; render `HowItWorksSection`; pass `index` to `CourseCard` |
| `client/src/features/courses/CourseCard.tsx` | Modify | Full redesign: icon, `CourseCardMenu`, category pill, unit count footer, responsive layout |
| `client/src/features/courses/CourseCardMenu.tsx` | Create | Three-dot dropdown with click-outside + Escape handling |
| `client/src/features/courses/CourseFilters.tsx` | Create | Search input + category pills; exports `getCourseCategory` utility and `CourseCategory` type |
| `client/src/features/home/HowItWorksSection.tsx` | Create | Static three-step section for guest users |
| `client/src/api/types.ts` | Modify | Import `CourseCategory` type if co-located in `CourseFilters.tsx` is not sufficient; alternatively keep the type export in `CourseFilters.tsx` only if it is not used by `types.ts`-dependent files |

**Note on `CourseCategory` type placement:** `CourseCategory` is a frontend-only concept (no API field). It should be defined in `CourseFilters.tsx` and exported from there. `CourseCard.tsx` imports it from `CourseFilters.tsx`. Do not add it to `api/types.ts` — that file is for API response shapes.

---

## 13. Implementation Tasks

Ordered task list for the implementing developer:

1. [x] **Create `CourseFilters.tsx`**
   - Define and export `CourseCategory` type
   - Define and export `getCourseCategory(title: string): CourseCategory` utility
   - Define `CATEGORIES` constant
   - Implement search input with leading `Search` icon and conditional clear button
   - Implement category pill group with `aria-pressed` and `role="group"`
   - Wire all interactions to callback props (no internal state)

2. [x] **Create `CourseCardMenu.tsx`**
   - Implement `isOpen` state, `triggerRef`, and `menuRef`
   - Implement `useEffect` for click-outside (`mousedown`) and `Escape` listeners
   - Implement focus return to trigger on keyboard close
   - Render trigger button with correct ARIA attributes
   - Render dropdown with `role="menu"` and two `role="menuitem"` buttons
   - Ensure minimum 44×44px touch target on the trigger button

3. [x] **Modify `CourseCard.tsx`**
   - Update props interface to add `index: number`
   - Import `getCourseCategory` and `CourseCategory` from `CourseFilters.js`
   - Import `CourseCardMenu`
   - Implement icon color variant logic (`index % 3`)
   - Build the new card layout: icon header row, title `Link`, description (`line-clamp-2`), category pill, unit count footer
   - Implement responsive layout classes (`flex flex-row md:flex-col`)
   - Apply correct WCAG-safe color tokens for the orange variant

4. [x] **Create `HowItWorksSection.tsx`**
   - Define `STEPS` constant with `StepConfig` interface
   - Implement responsive grid/flex layout with `relative` container
   - Implement horizontal connecting line `div` (desktop, `hidden md:block`, `aria-hidden="true"`)
   - Implement vertical connecting line `div` (mobile, `block md:hidden`, `aria-hidden="true"`)
   - Implement step blocks with icon container, badge pill, title `<h3>`, and description
   - Render CTA as a `<Link to="/register">` with `Button`-equivalent styling
   - Apply `section` with `aria-labelledby` and `h2` with matching `id`

5. [x] **Modify `HomePage.tsx`**
   - Add `import { useState, useMemo } from 'react'` (add `useMemo`)
   - Import `CourseFilters` and `HowItWorksSection`
   - Add `searchQuery` and `selectedCategory` state
   - Add `filteredCourses` derived via `useMemo`
   - Update the grid render condition to distinguish "no courses" from "no matches" empty state
   - Pass `index` to `CourseCard` in the `filteredCourses.map()` call
   - Render `<CourseFilters ... />` above the grid (inside the logged-in branch)
   - Render `{!loggedIn && <HowItWorksSection />}` below `<HeroSection>`
   - Update grid class from `sm:grid-cols-2 lg:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-3` to match FR-01 breakpoints
   - Add `aria-live="polite"` region to announce filter results to screen readers

6. [x] **Verify and test**
   - Confirm all new class names reference design tokens (no raw hex, no `dark:` prefix)
   - Confirm orange instances use `text-orange-surface-text` on `bg-orange-surface` only
   - Confirm keyboard navigation: search → pills → New Course button → card title links → three-dot menu
   - Confirm three-dot menu closes on Escape and outside click
   - Confirm `HowItWorksSection` does not render when signed in
   - Confirm the "No courses match your filters" empty state appears (not "No courses yet") when filters produce zero results on a non-empty course list
