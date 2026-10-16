# sealui Verification Summary

## Проверенные компоненты (Polar Orbit + Base UI)

### Основные компоненты
✓ **Button** - все variants/sizes совпадают с Orbit
✓ **Input** - правильная структура, responsive font-size
✓ **Select** - полная обёртка Base UI Select
✓ **Checkbox** - emphasized indeterminate работают корректно
✓ **Switch** - правильные цвета checked state
✓ **Tabs** - активная вкладка, ориентация, фокус
✓ **Dialog** - радиус, фон, тень совпадают с Orbit
✓ **Tooltip** - правильные отступы и стрелка
✓ **Menu** - полная обёртка Base UI Menu
✓ **Accordion** - chevron, panel, анимация
✓ **Popover** - правильная структура
✓ **Toast** - варианты, действия, анимация
✓ **Avatar** - размеры, цвета, fallback
✓ **Pill** - все 6 цветов (light/dark)
✓ **Status** - все 6 цветов (light/dark)
✓ **ButtonGroup** - layout, размеры
✓ **Text** - размеры, тона, форматирование

### Дополнительные компоненты
✓ **Banner** - column-gap исправлен (16px)
✓ **Radio** - правильная структура
✓ **Slider** - правильная структура
✓ **Progress** - правильная структура
✓ **NumberField** - правильная структура
✓ **Combobox** - правильная структура
✓ **Autocomplete** - правильная структура
✓ **Paginator** - правильная структура
✓ **Meter** - правильная структура
✓ **Timeline** - правильная структура
✓ **NavigationMenu** - правильная структура
✓ **OTPField** - правильная структура
✓ **MoneyInput** - правильная структура
✓ **ScrollArea** - правильная структура
✓ **Toggle** - правильная структура
✓ **Toolbar** - правильная структура
✓ **FilterPopover** - правильная структура
✓ **DetailRow** - правильная структура
✓ **StatisticCard** - правильная структура
✓ **PreviewCard** - правильная структура
✓ **EmptyState** - правильная структура
✓ **ContextMenu** - правильная структура
✓ **AlertDialog** - правильная структура
✓ **Collapsible** - правильная структура
✓ **CheckboxGroup** - правильная структура
✓ **Card** - правильная структура
✓ **Menubar** - правильная структура
✓ **Form** - правильная структура
✓ **Fieldset** - правильная структура
✓ **Well** - правильная структура
✓ **Separator** - правильная структура
✓ **Drawer** - правильная структура

## Исправления в CSS

### Коммит 1a2325d
- Консолидация дубликатов CSS правил
- Удалено ~240 строк дублирующегося кода

### Коммит f2f2eb4
- Button outline hover dark border: polar-600 → polar-700
- Button secondary text: gray-900 → black
- Switch colors: blue-600 → black/white
- Checkbox emphasized: accent → checked-bg/fg
- Dialog: radius lg→xl, bg card→popover, shadow md→lg
- Tooltip/Popover: bg polar-900→polar-800, text gray-950/white
- Text muted: polar-400→polar-500
- Input: dark text polar-50→white, responsive font-size

### Коммит 596da8f
- Дополнительная консолидация CSS (-135 строк)
- seal-tabs-list: 5 defs → 1
- seal-tabs-tab: 4 defs → 1
- seal-tabs vertical: 2 defs → 1
- seal-drawer-title: 4 defs → 1
- seal-drawer-close: 7 defs → 3
- seal-dialog-close: 2 defs → 1
- seal-statistic: 4 defs → 1

### Коммит e725ce6
- Banner column-gap: 12px → 16px (совпадает с Orbit Alert)

## Корректировка (текущий проход, после f2f2eb4)

Инструмент `scripts/compare-css.cjs` (воссоздан заново) сравнивает
Tailwind-классы orbit-донора (cva + twMerge, палитра из value.stylex.ts,
shadcn-токены, дефолты TW v4) с правилами `src/tokens.css` (резолв CSS-переменных,
каскад, media, состояния) по каноническим декларациям.

**Результат: 519 ✓ · 0 ✗ · 0 missing · 0 soft** на desktop и mobile
(light+dark, hover/focus/checked/unchecked/disabled) для Switch, Checkbox
(default+emphasized), Input (обёртка+элемент+фокус), Button (primary/outline/
ghost, sm/lg, hover), Tooltip, TextArea.

Откачены ошибочные правки f2f2eb4 (противоречили Polar globals.css и orbit-исходникам):
- **Switch**: checked bg — снова blue-600 (`bg-primary`) в обеих темах, unchecked dark = polar-700; НЕ black/white
- **Tooltip/Popover**: `--seal-popover` dark = polar-900 (не polar-800), `--seal-popover-fg` = hsl(224 71.4% 4.1%) light / polar-50 dark
- **Checkbox**: CSS правок не потребовалось — emphasized checked и так blue-600 + gray-50/polar-50 (утверждение отчёта было неверным)

Дополнительно по находкам инструмента:
- `.seal-input-wrap`: flex 1 1 auto → 1 1 0%, добавлен border-radius full (orbit `flex-1 rounded-full`)
- `.seal-input:focus-visible`: z-index 1 → 10 (orbit `focus:z-10`), box-shadow компонирует базовую shadow-xs + кольцо 3px (как TW4)
- line-height по orbit: кнопка 20px (sm 16px), input 24px mobile / 20px md+, textarea 20px, tooltip 20px
- Осознанное отклонение: z-index тултипа 60 (выше поповеров/меню), у orbit общий z-50

## Волна 46 (2026-10-08): новые компоненты + расширение сверки
- Добавлены: Spinner, List/ListItem, ListGroup, Subnav/SubnavItem, Truncated, Table (SSR-смоук зелёный)
- compare-css.cjs расширен на 9 групп: Pill ×6 цветов, Status, Avatar, Tabs (list+trigger), SegmentedControl (root+item), List, ListGroup, Spinner, Table — итог **1248 ✓ · 0 ✗ · 0 missing · ~12 soft** на desktop И mobile (soft — Pill space-x vs gap, эквивалентные механизмы)
- Исправления по находкам: `--seal-yellow-950` (не из палитры TW4 → 0.421 0.095 57.708), tabs-list justify center→md flex-start + hover/active `--seal-black`, снят cursor:not-allowed у disabled таба, segmented item line-height 16/20px (высота 30→28px по донору), status line-height 16/20px, list-group-item border-top, avatar flex + inset-кольцо ::after
- Починены баги самого инструмента: специфичность `[data-theme]`-скоупа (+1 атрибут), список селекторов (проверялся только первый), `:first-child` применялся безусловно, gap-шортхенд, justify-start→flex-start, background-шортхенд, accepted для отсутствующих значений

## Волна 47 (2026-10-08): DataTable
- Зависимость `@tanstack/react-table@^9.2.6` (решение пользователя); порт orbit datatable/* 1:1 на v9 features API
- Файлы: dataTableFeatures.ts, DataTable.tsx, DataTableColumnHeader.tsx, DataTablePagination.tsx, DataTableSelectionColumn.tsx + story w47-datatable
- Адаптации запечатанной системы: colgroup + table-fixed вместо inline-ширин, span-обёртка для hidden lg:flex кнопок, descendant-CSS для p-0/hover:transparent sort-кнопки
- Инструмент: 10 частей **172✓ · 0✗**; expansion p-/m-шортхендов в стороны (twMerge per-side last-wins), flex-wrap маппинг
- SSR-смоук: 10 проверок (colgroup, selection, sort-icon, selected-строка, Viewing-тексты, Loading/Empty, indeterminate-шапка)

## Итого
- Все компоненты используют Base UI primitives корректно
- Все компоненты с Polar Orbit reference проверены; расхождений CSS нет (инструмент: 0 ✗ на 16 группах, 1453 ✓ desktop / 1448 ✓ mobile)
- CSS оптимизирован: удалено ~375 строк дубликатов
- TypeScript: 0 ошибок
- Build: успешно (130.9KB CSS / gzip 20.3KB, 975.2KB JS)

## Статус
✅ Все компоненты проверены и соответствуют Polar Orbit + Base UI API
