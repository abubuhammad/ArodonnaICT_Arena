# Arodonna ICT Arena Design System

## Scope and source of truth

The active UI is a React client mounted by the Next.js shell through `src/app/legacy-client.tsx`. The requested `src/pages/` and `src/components/ui/` paths did not exist in this cleaned repository; the reference pages and their existing import paths live under `src/legacy/`.

The canonical shared primitives now live in `src/components/ui/`. The files under `src/legacy/components/ui/` are compatibility re-exports so existing pages inherit the same system without page-level edits.

Reference audit targets:

- `src/legacy/pages/About.tsx`
- `src/legacy/pages/Login.tsx`
- `src/legacy/pages/StudentDashboard.tsx`
- `tailwind.config.js`
- `src/legacy/index.css`

## Color

### Palette actually in use

| Role | Current token/classes | Usage |
| --- | --- | --- |
| Page background | `--bg: #f8fafc`, `bg-gray-50`, `bg-slate-50` | Public pages and dashboard shells |
| Dark page background | `--bg: #0b1020`, `bg-gray-950`, `bg-slate-950` | Dark mode page surfaces |
| Surface | `--surface: #ffffff`, `bg-white`, `bg-gray-900`, `bg-slate-900` | Cards, forms, dashboard panels |
| Primary | `--primary: #6366f1`, `indigo-600`, `blue-600` | Main actions, links, headings, focus states |
| Primary dark | `--primary: #818cf8`, `indigo-400` | Dark mode links and accents |
| Accent | `--accent: #22d3ee`, cyan-400 | Ambient background accents and secondary emphasis |
| Body text | `--text: #0f172a`, `gray-900`, `slate-900` | Headings and primary content |
| Muted text | `--muted: #64748b`, `gray-600`, `slate-500` | Supporting copy, metadata, placeholders |
| Dark muted text | `--muted: #94a3b8`, `gray-300`, `slate-400` | Supporting copy on dark surfaces |
| Success | `emerald-600`, `emerald-100` | Positive status and completion |
| Warning | `amber-500`, `amber-100` | Attention and pending status |
| Error | `red-600`, `red-50`, `red-200` | Validation and request failures |

### Decisions

- Use indigo as the single primary action color. Do not mix blue and indigo for equivalent actions.
- Keep cyan as a restrained supporting accent, not a second primary button color.
- Use slate for neutral surfaces and text; avoid introducing additional gray families in new work.
- Dark surfaces must use `slate-950` for inputs and `slate-900` for cards, with `slate-50` text and `slate-400` supporting text.
- Error text must pair with a tinted surface and border. Do not use red text alone on a white page.
- `tailwind.config.js` currently relies on Tailwind defaults. The existing CSS variables in `src/legacy/index.css` remain the runtime source for page-level theme values; new shared components should use the explicit slate/indigo classes documented here.

## Typography

The current app uses a system sans stack and Tailwind defaults. Standardize new UI on this scale:

| Purpose | Classes |
| --- | --- |
| Page title | `text-4xl font-bold leading-tight` |
| Section title | `text-2xl font-bold leading-8` |
| Card title | `text-lg font-semibold leading-7` |
| Body | `text-base font-normal leading-6` |
| Supporting text | `text-sm font-normal leading-5` |
| Metadata / labels | `text-xs font-medium leading-4` |
| Button text | `text-sm font-medium leading-5` |

Use `font-bold` only for page and section titles. Use `font-semibold` for card titles and important labels. Keep body copy at `leading-6`; do not compress paragraphs to `leading-none` or `leading-tight`.

## Spacing and layout

Use one value per common use case:

| Use case | Rule |
| --- | --- |
| Main content container | `max-w-7xl mx-auto px-6` |
| Narrow form container | `max-w-md mx-auto px-6` |
| Public section vertical padding | `py-16` |
| Dashboard page padding | `p-6` |
| Section-to-section gap | `space-y-8` |
| Responsive grid gap | `gap-6` |
| Card padding | `p-6` |
| Compact control padding | `px-3` / `h-10` |
| Standard button height | `h-10` |
| Large button height | `h-11` |
| Small button height | `h-9` |
| Control radius | `rounded-lg` |
| Card radius | `rounded-xl` |
| Status pill radius | `rounded-full` |

Do not nest cards inside cards. Use a full-width page band with one constrained inner container, then use cards only for repeated records or genuinely framed tools.

## Shared component variants

Canonical implementations are in `src/components/ui/` and are re-exported through `src/legacy/components/ui/`.

### Button

`Button` supports `default`, `destructive`, `outline`, `secondary`, `ghost`, and `link` variants. It also supports `sm`, `md`, `lg`, and `icon` sizes.

- `default`: indigo filled action
- `destructive`: red filled destructive action
- `outline`: bordered secondary action
- `secondary`: neutral slate action
- `ghost`: low-emphasis toolbar action
- `link`: inline navigation action

Buttons have a stable height, `rounded-lg`, visible focus rings, disabled opacity, and a default `type="button"` to prevent accidental form submission.

### Card

`Card`, `CardHeader`, `CardContent`, and `CardFooter` use `rounded-xl`, a subtle border, white/slate surfaces, and `p-6` section padding. Card headings use the standardized card-title scale.

### Input

`Input` is a full-width `h-10` control with `rounded-lg`, a slate border, white/slate-950 surface, indigo focus treatment, muted placeholder text, and disabled state styling. Labels remain the responsibility of the consuming form.

### Badge

`Badge` supports `default`, `secondary`, `success`, `warning`, `destructive`, and `outline`. Badges are compact pills with `text-xs font-medium leading-4`. Use them for status or category metadata, not for primary actions.

## Motion

Keep motion purposeful and consistent. Use only these patterns:

1. **Page entrance:** one parent `motion.div` with `initial={{ opacity: 0, y: 12 }}` and `animate={{ opacity: 1, y: 0 }}` over `0.25s` to `0.4s`.
2. **List reveal:** stagger direct list items by `0.04s` to `0.06s`, with the same small opacity/y transition. Avoid animating every nested element.
3. **Interaction feedback:** use `whileHover={{ scale: 1.01 }}` and `whileTap={{ scale: 0.99 }}` only for prominent clickable controls. Prefer CSS color transitions for ordinary buttons and links.

Respect reduced motion preferences when introducing new page-level animations. Do not use continuous decorative motion.

## Empty, loading, and error states

### Empty state

Use a centered, unframed block inside the existing page container:

- `py-12 text-center`
- a short `text-lg font-semibold` heading
- one `text-sm text-slate-500 dark:text-slate-400` explanation
- one optional `Button` action below with `mt-4`

Empty states should explain what is absent and offer the next useful action. Do not show a blank card or an unexplained zero.

### Loading state

Use `LoadingSpinner` for an action or page-level wait and `SkeletonLoader` for known content shapes.

- Spinner: `role="status"`, `aria-live="polite"`, indigo ring, `sm` for buttons, `md` for content, `lg` for full-page waits.
- Skeleton: `bg-slate-200 dark:bg-slate-800`, `rounded-md`, `animate-pulse`, with the first line at `w-3/4` and remaining lines at `w-full`.
- Preserve the final layout dimensions where practical to avoid content shifting.

### Error state

Use `ErrorMessage` for page or request failures:

- `role="alert"`
- `rounded-lg border border-red-200 bg-red-50`
- dark mode: `dark:border-red-500/30 dark:bg-red-950/30`
- include a concise title and the actionable error message

Inline field errors should sit below the field in `text-sm text-red-600`; reserve the full error panel for request or page-level failures.

## Anti-patterns to avoid

These are recognizable generic-template tells, not flexible rules of thumb. Do not preserve them when modernizing a page.

- **Unrelated content blocks rendered as identical cards:** A mission statement, value list, and feature list are different content structures. Rendering each as the same white rounded card with a thin border and identical shadow makes the page feel assembled from a generic template. If a page does this for three or more distinct sections, break up the repetition with hierarchy, full-width bands, editorial spacing, or a genuinely different treatment.
- **Tracked-out all-caps eyebrow labels:** Labels such as `A PRACTICAL PATH FORWARD` are decorative when they add no information. Remove them rather than adding letter spacing and uppercase styling above every heading. Use a short contextual label only when it communicates real metadata, such as a role, status, or section category.
- **Numbered markers without sequence:** Do not add `01`, `02`, or `03` to content that is not an actual sequence, process, or ordered set. Numbers imply progression and create false structure when the content is simply grouped information.
- **Cards for unrelated content:** Cards and list items are appropriate for repeating collections of like items, including course listings, table rows, status records, and stat tiles. They are not a default wrapper for arbitrary unrelated sections. Use cards when the content benefits from repeated comparison or a clear tool boundary; otherwise use unframed sections and full-width bands.
