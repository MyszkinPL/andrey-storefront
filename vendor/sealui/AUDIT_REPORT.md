# sealui Audit Report
## Polar Orbit + Base UI Verification

### Commits
- `1a2325d` — CSS duplicate consolidation (-240 lines)
- `f2f2eb4` — Token alignment with Polar Orbit
- `596da8f` — Additional CSS consolidation (-135 lines)

### Components Verified (Base UI API + Polar Orbit)

#### ✓ Button
- Uses `BaseButton` from `@base-ui/react`
- All variants match Orbit: primary, secondary, ghost, danger, outline, link, underline
- All sizes match Orbit: sm(32px), md(40px), lg(48px), icon(40px)
- Supports: focusableWhenDisabled, loading, icon (Polar features)

#### ✓ Input
- Uses `BaseInput` from `@base-ui/react`
- Supports preSlot/postSlot (Polar orbit/Input)
- Responsive font-size: text-base (mobile) → text-sm (md+)
- Dark text: white (Orbit: dark:text-white)

#### ✓ Select
- Uses `BaseSelect` from `@base-ui/react/select`
- All parts wrapped: Root, Trigger, Value, Icon, Portal, Backdrop, Positioner, Popup, List, Item, ItemIndicator, ItemText, Arrow, ScrollUpArrow, ScrollDownArrow, Group, GroupLabel, Separator

#### ✓ Checkbox
- Uses `BaseCheckbox` from `@base-ui/react`
- Supports: emphasized (Polar), indeterminate, parent (Base UI group)
- Verified vs orbit Checkbox.tsx by `scripts/compare-css.cjs`: default checked = black/white (bg-foreground/text-background), emphasized checked = **primary blue-600** + text gray-50/polar-50. (The earlier claim "emphasized uses black/white" was wrong — the CSS already matched orbit; only the report needed fixing.)

#### ✓ Switch
- Uses `BaseSwitch` from `@base-ui/react`
- Corrected (reverts f2f2eb4): checked bg = **primary blue-600** in both themes (orbit `data-[state=checked]:bg-primary`), unchecked = gray-200 light / polar-700 dark, disabled = gray-100/polar-800
- Thumb: bg-background; dark unchecked = polar-500; checked = white; translate-x 4px → 22px on check
- Verified: 106/106 checks pass via `scripts/compare-css.cjs` (Root+Thumb × light/dark × checked/unchecked/disabled)

#### ✓ Tabs
- Uses `BaseTabs` from `@base-ui/react/tabs`
- Supports: orientation, activateOnFocus, loopFocus
- All parts exported for manual composition
- Active tab: gray-100/polar-700 bg, black/white text (Orbit match)

#### ✓ Dialog
- Uses `BaseDialog` from `@base-ui/react/dialog`
- Fixed: radius xl(12px), bg popover, shadow lg (Orbit match)
- All parts: Root, Trigger, Portal, Backdrop, Viewport, Popup, Title, Description, Close

#### ✓ Tooltip
- Uses `BaseTooltip` from `@base-ui/react/tooltip`
- Corrected (reverts f2f2eb4): bg/text follow `--popover`/`--popover-foreground` exactly as orbit `bg-popover text-popover-foreground` — white / polar-900 bg, hsl(224 71.4% 4.1%) / polar-50 text. The earlier "polar-800, gray-950/white (Orbit match)" claim contradicted Polar globals.css (docs/TOKENS-POLAR.md, POLAR-TOKENS.md) and was reverted.
- Accepted deviation: popup z-index 60 (tooltip must sit above popovers/menus); orbit uses a shared z-50 with DOM ordering

#### ✓ Menu
- Uses `BaseMenu` from `@base-ui/react/menu`
- All parts: Root, Trigger, Portal, Backdrop, Positioner, Popup, Arrow, Viewport, Item, LinkItem, CheckboxItem, RadioGroup, RadioItem, SubmenuRoot, SubmenuTrigger, Group, GroupLabel, Separator
- Full Base UI API coverage

#### ✓ Accordion
- Uses `BaseAccordion` from `@base-ui/react/accordion`
- Supports: multiple, hiddenUntilFound, keepMounted
- All parts exported

#### ✓ Popover
- Uses `BasePopover` from `@base-ui/react/popover`
- All parts wrapped

#### ✓ Toast
- Uses `BaseToast` from `@base-ui/react/toast`
- All parts: Provider, Root, Content, Title, Description, Action, Close, Portal, Viewport, Positioner, Arrow

#### ✓ Avatar
- Matches Orbit: 24px, rounded-full, gray-50/polar-900 bg, gray-700/polar-500 text
- Outline: rgb(0,0,0,0.1)/rgb(255,255,255,0.1)

#### ✓ ButtonGroup
- Matches Orbit: column (mobile) → row (sm+), gap 8px
- First button: primary, second: ghost

#### ✓ Text
- Sizes: xs/sm/md/lg/xl (Polar fontSizes[1..5])
- Tones match Polar textColors
- Supports: align, wrap, truncate, monospace, tabularNums, lineThrough, formatter

### CSS Token Fixes

#### Button
- outline hover dark border: polar-600 → polar-700
- secondary text: gray-900 → black

#### Switch (f2f2eb4 changes REVERTED this pass)
- checked bg = blue-600 (orbit `bg-primary` = blue-600, NOT black/white) in both themes
- unchecked dark = polar-700 (orbit literal `dark:data-[state=unchecked]:bg-polar-700`)
- thumb: bg-background light, polar-500 dark-unchecked, white dark-checked; ring-0; translate-x 4px/22px

#### Checkbox
- no CSS change needed: default checked = black/white, emphasized checked = blue-600 + gray-50/polar-50 — matches orbit as-is (f2f2eb4 report line was inaccurate)

#### Dialog
- border-radius: radius-lg(9.6px) → radius-xl(12px)
- background: card → popover
- shadow: shadow-md → shadow-lg

#### Tooltip/Popover (f2f2eb4 changes REVERTED this pass)
- `--seal-popover` dark = polar-900 (was polar-800) — per Polar globals.css `--popover`
- `--seal-popover-fg` light = hsl(224 71.4% 4.1%) (was gray-950), dark = polar-50 (was white) — per `--popover-foreground`

#### Text
- text-muted dark: polar-400 → polar-500

### CSS Comparison Verification (this pass)

`scripts/compare-css.cjs` — recreates the lost tool: resolves orbit Tailwind
classes (cva + twMerge semantics, palette from `value.stylex.ts`, shadcn
semantic tokens, TW v4 defaults) and sealui `src/tokens.css` rules (CSS-var
resolution, cascade, media, states) into canonical declarations, then compares
them property by property.

Result (desktop and mobile viewports, light+dark, incl. hover/focus/checked/
unchecked/disabled states): **519 ✓ · 0 ✗ · 0 missing · 0 soft** per viewport
for Switch, Checkbox (default+emphasized), Input (wrapper+element+focus),
Button (primary/outline/ghost, sm/lg, hover), Tooltip, TextArea.

Wave 46 extension — 9 more groups compared (Pill ×6 colors, Status, Avatar,
Tabs list+trigger, SegmentedControl root+item, List, ListGroup, Spinner,
Table wrap/table/head/row/cell incl. hover/selected): **1248 ✓ · 0 ✗ ·
0 missing · ~12 soft** per viewport. The 12 soft lines are Pill `@space-x`
(orbit uses `space-x-1` child margins, sealui uses `gap: 4px` — visually
identical, mechanism differs by design).

Fixes made from the wave-46 comparison:
- `--seal-yellow-950`: oklch(0.286 0.066 53.813) → oklch(0.421 0.095 57.708)
  (real Tailwind v4 value; dark Pill/Status yellow bg was off)
- `.seal-tabs-list`: `justify-content: center` + muted color base, `flex-start`
  at md+ (orbit `justify-center` + `md:justify-start`), `align-items` fixed by
  including the horizontal-variant literal in the comparison anchors
- `.seal-tabs-tab:hover` / `[data-active]`: color `--seal-black` (orbit
  hover:text-black / data-state:active:text-black); dark theme keeps polar-50 /
  white via more specific `[data-theme='dark']` rules
- `.seal-tabs-tab[disabled]`: dropped `cursor: not-allowed` — orbit keeps
  cursor-pointer and relies on `pointer-events: none` (cursor never renders)
- SegmentedControl item line-height: 16px (sm/md, text-xs) / 20px (lg, text-sm)
  — item height now 28px matching orbit instead of 30px
- Status line-height: 16px small / 20px medium (orbit text-xs/text-sm)
- ListGroup: root ring → `box-shadow: 0 0 0 1px` gray-200 / polar-700 parity;
  item `border-top: 1px solid` divider (was missing width/color)
- Avatar: `display: flex` (orbit `flex`, was inline-flex) + inset ring moved to
  `::after` overlay (orbit paints ring span above content)

Tool fixes in the same pass (bugs found by self-check, not component bugs):
- theme scope `[data-theme='dark']` now adds +1 specificity (attribute
  selector) — late light-theme rules no longer "beat" dark rules
- selector lists: every selector is tried (was: only the first, then break)
- `:first-child`/`:last-child`/`:only-child` apply only when the descriptor
  declares them (was: unconditional → ListGroupItem lost its border-top)
- `gap` shorthand expands to row-gap/column-gap; `justify-start/end` map to
  `flex-start/flex-end`; single-color `background` normalizes to
  `background-color`; accepted-deviation list consulted for absent values too

Additional fixes made from tool findings:
- `.seal-input-wrap`: flex 1 1 auto → `1 1 0%`, added `border-radius: full` (orbit wrapper `flex-1 rounded-full`)
- `.seal-input:focus-visible`: z-index 1 → 10 (orbit `focus:z-10`), box-shadow composes base shadow-xs + 3px ring (orbit TW4 composes layers)
- line-height parity: button 20px (sm 16px), input 24px mobile / 20px md+, textarea 20px, tooltip 20px

Usage: `node scripts/compare-css.cjs [--component=X,Y] [--viewport=desktop|mobile]
[--theme=light|dark|both] [--json] [--fail-on-diff] [--verbose]`

#### Input
- dark text: polar-50 → white
- Added responsive font-size media query

### CSS Consolidation
- seal-tabs-list: 5 defs → 1
- seal-tabs-tab: 4 defs → 1
- seal-drawer-title: 4 defs → 1
- seal-drawer-close: 7 defs → 3
- seal-dialog-close: 2 defs → 1
- seal-statistic: 4 defs → 1
- seal-filter-header-label: 5 defs → 2
- seal-well: 4 defs → 1
- seal-banner: 3 defs → 1
- seal-accordion-chevron: 4 defs → 1

**Total lines removed: ~375**

### Components Without Polar Orbit Reference
These components use Base UI correctly but don't have direct Orbit equivalents:
- Radio, Slider, NumberField, Combobox, Autocomplete, NavigationMenu, Paginator, Drawer, Collapsible, Separator, Progress, Meter, Timeline, etc.

### Wave 47 — DataTable (was deferred, now implemented)
`@tanstack/react-table@^9.2.6` added (user decision). Ported 1:1 from
`orbit datatable/` (DataTable, DataTableColumnHeader, DataTablePagination,
DataTableSelectionColumn, features.ts) on the tanstack v9 features API
(`tableFeatures` with columnSizing/columnVisibility/rowExpanding+
expandedRowModel/rowPagination/rowSorting), manual pagination/sorting with
consumer-owned state. Sealed-component adaptations: column widths via
`colgroup` + `table-layout: fixed` (donor sets inline styles on th/td),
first/last page buttons hidden below lg via a span wrapper (donor puts
`hidden lg:flex` on the Button itself), sort-button `p-0 hover:bg-transparent`
overrides via descendant CSS. Verified: 10 parts through compare-css
(**172 ✓ · 0 ✗**), SSR smoke (10 checks), tsc + build green.

### Deferred
- **Box/Grid/GridItem**: skipped — StyleX layout system; sealui covers the same
  needs with Stack/Cluster/Container.
- **Alert** → covered by Banner; **Modal/InlineModal** → covered by
  Dialog/Drawer (documented mapping, no separate components).

### Status
All components with Polar Orbit references have been verified and match
(1453 ✓ desktop / 1448 ✓ mobile · 0 ✗ · ~12 soft across 16 component
groups incl. DataTable). All Base UI
primitives are used correctly with full API coverage. CSS tokens aligned with
Polar design system. Wave 46 added Spinner, List/ListItem, ListGroup,
Subnav/SubnavItem, Truncated and Table; wave 47 added the DataTable stack on
@tanstack/react-table v9 (SSR-smoke tested, build green).
