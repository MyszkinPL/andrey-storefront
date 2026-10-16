# sealui — карта токенов ↔ Polar (источник истины)

Проверено сверкой с двумя слоями Polar:

- **Tier 1 — палитра**: `polar-reference/clients/apps/web/src/styles/globals.css`, блок `@theme` (строка 95+).
- **Tier 2 — семантика**: `polar-reference/clients/packages/orbit/src/tokens/semantics.stylex.ts`
  (`backgroundColors`, `textColors` — строка 36, `borderColors`) — это то, чем реально
  пользуются компоненты Polar. Роли заданы парами `light-dark(light, dark)`.
- **Слой orbit (движковый)**: `globals.css`, `@layer base` → `:root` / `.dark`
  (`--orbit-bg`, `--orbit-text`, `--orbit-text-subtle`, `--orbit-text-disabled`, `--orbit-destructive`).

## 1. Палитра (Tier 1) — значения 1:1

| sealui | Polar | Примечание |
|---|---|---|
| `--seal-gray-50…950` | `--color-gray-*` (`globals.css`) | oklch, значения совпадают посимвольно |
| `--seal-blue-50…950` | `--color-blue-*` | oklch; `--seal-primary = blue-600` = Polar `--color-blue` |
| `--seal-red-50…950` | `--color-red-*` | oklch |
| `--seal-emerald-*` | `palette.emerald*` (`value.stylex.ts`) | имя из orbit; в `globals.css` тот же ряд назван `--color-green-*` (обёртки `--seal-green-*` оставлены) |
| `--seal-amber-*` | `palette.amber*` | используется `text-warning` / `background-warning` |
| `--seal-indigo-*` | `palette.indigo*` | используется `text-accent` / `background-accent` — **не выдумка** |
| `--seal-purple-*`, `--seal-violet-*`, `--seal-yellow-*` | Tailwind-дефолты | нужны только для пресетов Pill/Status |
| `--seal-polar-50…950` | `--color-polar-*` | hsl, значения совпадают |
| `--seal-white` / `--seal-black` | `palette.white` / `palette.black` | |

## 2. Радиусы, отступы, типографика, тени

| sealui | Polar | Значение |
|---|---|---|
| `--seal-radius` | `--radius` | `0.6rem` |
| `--seal-radius-sm` / `-md` / `-lg` | `calc(--radius - 4px)` / `- 2px` / `--radius` | 5.6 / 7.6 / 9.6 px |
| `--seal-radius-xl` / `-2xl` / `-3xl` | Tailwind дефолты | 12 / 16 / 24 px |
| `--seal-radius-4xl` | `--radius-4xl` | `2rem` = 32px |
| `--seal-space-1…12` | шаг Tailwind | 4/8/12/16/20/24/32/40/48 px |
| `--seal-text-xxs` | `--text-xxs` | `0.65rem` |
| `--seal-text-xs…4xl` | Tailwind дефолты | 12/14/16/18/20/24/30/36 px |
| `--seal-font-sans` / `-display` / `-mono` | `--font-sans` / `--font-display` / `--font-mono` | PP Neue Montreal / InterDisplay / GeistMono |
| `--seal-shadow-md` / `-lg` / `-xl` / `-3xl` | `--shadow-md` / `-lg` / `-xl` / `-3xl` | 15+2 / 20+5 / 30+10 / 50+50 px |

### 2.1 Шкалы (проверено в волне 5 — НЕ «чинить»)

**Радиусы.** У Polar два разных ряда радиусов, и их нельзя менять местами:

- **Tailwind-слой** (`globals.css`): `--radius: 0.6rem`, от него `--radius-lg = var(--radius)` = **9.6px**, `--radius-md = --radius - 2px` = **7.6px**, `--radius-sm = --radius - 4px` = **5.6px**. Дефолты Tailwind 4/6/8 здесь **переопределены**. Именно этот слой видят компоненты `packages/ui/src/components/ui/*` (popover, dropdown-menu, dialog, select, toast).
- **Orbit-слой** (`orbit/src/tokens/value.stylex.ts`): `borderRadii = s 8 / m 12 / l 16 / xl 32 / full`. Это другая система (Stylex), ею пользуются компоненты orbit.

Наши `--seal-radius-sm/md/lg = 5.6/7.6/9.6px` — точный порт **первого** ряда, менять их нельзя. Там, где портируется orbit-компонент (Button `rounded-full`, Pill `rounded-full`, Well `rounded-3xl`) — берётся значение из orbit. `--seal-radius-xl/2xl/3xl/4xl = 12/16/24/32px` совпадают в обоих слоях.

В волне 5 три воркера независимо требовали «исправить» 5.6/7.6/9.6 на 4/6/8 (дефолты Tailwind) — скептик опроверг это по файлу `globals.css`. Это ложная правка, а не улучшение.

### 2.2 Открытые расхождения шкал (для очистителя токенов)

- `--seal-radius-xs: 2px` — такого шага нет ни в Tailwind-слое Polar, ни в orbit (у нас используется только у пунктов меню).
- `--seal-space-5: 20px` и `--seal-space-10: 40px` — в шкале orbit нет 20 и 40 (`value.stylex.ts`: 0/4/8/12/16/24/32/48/64/96); при этом 64 и 96 в токенах отсутствуют, хотя `SPACE` у Stack их знает и совпадает с Polar. Стоит привести `--seal-space-*` к шагам orbit.
- `--seal-accent-soft` (blue-50/blue-900) — у Polar такого токена нет; ближайшее — `background-accent` = indigo-50/indigo-950.
- `--seal-input-focus` / `--seal-input-focus-ring` до сих пор gray-200/polar-700, тогда как фокус Polar orbit/Input — `blue-300` + 3px `blue-100` (тёмная `blue-600` + `blue-700/40`). Сейчас эффект верный только потому, что отдельный слой перебивает их значениями примитивов — правильнее вписать значения в сами токены и снять слой.
- Радиус пункта у Select (8px) расходится с Polar `rounded-md` (7.6px) — это следствие смешения двух шкал, см. 2.1.

## 3. Цвет текста (Tier 2) — исправлено в этом проходе

`textColors` в Polar задаёт пары: `text-primary = (black, white)`,
`text-secondary = (gray-500, polar-400)`, `text-tertiary = (gray-400, polar-500)`,
`text-disabled = (gray-300, polar-600)`.

| sealui | Polar textColors | Было | Стало |
|---|---|---|---|
| `--seal-text-primary` | `text-primary` | gray-900 / polar-50 (shadcn `--card-foreground`) | **black / white** |
| `--seal-text-secondary` | `text-secondary` | `hsl(0 0% 60%)` / polar-400 | **gray-500 / polar-400** |
| `--seal-text-tertiary` | `text-tertiary` | gray-400 / polar-500 | без изменений — совпадало |
| `--seal-text-disabled` | `text-disabled` | `hsl(0 0% 32%)` / `hsl(233 2% 32%)` (это Tier-1 orbit) | **gray-300 / polar-600** |
| `--seal-text-muted` | `textColorStyles.muted` = `text-secondary` | gray-500 / polar-500 | **gray-500 / polar-400** |
| `--seal-text-success` | `text-success` | emerald-500 оба темы | без изменений |
| `--seal-text-danger` | `text-danger` | red-500 оба темы | без изменений |
| `--seal-text-warning` | `text-warning` | amber-500 оба темы | без изменений |
| `--seal-text-accent` | `text-accent` | indigo-500 оба темы | без изменений |
| `--seal-text-inverse` | `textColorStyles.inverse` (`semantics.stylex.ts:146`) | white / **polar-950** | **white / black** — тёмное значение было неверным (`light-dark(white, black)`) |

Добавлены отсутствовавшие токены слоя orbit (Tier-1), чтобы ничего не терялось и был
точный адрес для компонентов, которым нужен именно движковый слой:

| sealui | Polar | Светлая / тёмная |
|---|---|---|
| `--seal-orbit-bg` | `--orbit-bg` | white / `hsl(233 2% 3%)` |
| `--seal-orbit-surface` | `--orbit-bg-surface` | `hsl(0 0% 97%)` / `hsl(233 2% 6.5%)` |
| `--seal-orbit-elevated` | `--orbit-bg-elevated` | `hsl(0 0% 90%)` / `hsl(233 2% 9.5%)` |
| `--seal-orbit-text` | `--orbit-text` | `#111111` / `#f0f0f0` |
| `--seal-orbit-text-subtle` | `--orbit-text-subtle` | `hsl(0 0% 60%)` / `hsl(233 2% 52%)` |
| `--seal-orbit-text-disabled` | `--orbit-text-disabled` | `hsl(0 0% 32%)` / `hsl(233 2% 32%)` |
| `--seal-orbit-destructive` | `--orbit-destructive` | red-500 / red-600 |

### 3.1 Удалено как дубль

`--seal-disabled-text` объявлялся два раза и обоими значениями литералами (`hsl(0 0% 32%)` / `hsl(233 2% 32%)`) — это Tier-1 orbit-значения, разошедшиеся с Tier-2 ролью `text-disabled` (`gray-300` / `polar-600`). Токен удалён, оба его потребителя в `tokens.css` переведены на `--seal-text-disabled`.

## 4. Поверхности и границы

| sealui | Polar | Значение (light / dark) |
|---|---|---|
| `--seal-bg` / `--seal-background-primary` | shadcn `--background` из `globals.css` | gray-50 / polar-800 |
| `--seal-background-secondary` | `backgroundColors['background-secondary']` | gray-50 / polar-900 |
| `--seal-background-card` | `backgroundColors['background-card']` | gray-100 / polar-800 |
| `--seal-background-inverse` | `backgroundColors['background-inverse']` | gray-900 / white |
| `--seal-background-accent` / `-warning` / `-success` / `-danger` | одноимённые | indigo-50/950, amber-50/950, emerald-50/950, red-50/950 |
| `--seal-card` / `--seal-card-fg` | shadcn `--card` / `--card-foreground` | white / polar-800, gray-900 / polar-50 |
| `--seal-popover` / `--seal-popover-fg` | shadcn `--popover(-foreground)` | white / polar-900, `hsl(224 71.4% 4.1%)` / polar-50 |
| `--seal-border` / `-input` / `-ring` | shadcn `--border` / `--input` / `--ring` | gray-200 / polar-700 |
| `--seal-primary` / `--seal-primary-fg` | shadcn `--primary(-foreground)` | blue-600, gray-50 / polar-50 |
| `--seal-secondary-bg` / `-fg` | shadcn `--secondary(-foreground)` | gray-100 / polar-700…polar-900 |
| `--seal-accent` / `--seal-accent-fg` | shadcn `--accent(-foreground)` | blue-600, white / polar-50 |
| `--seal-destructive` | shadcn `--destructive` | red-500 обе темы |
| `--seal-muted-bg` | shadcn `--muted` | gray-100 / polar-700 |
| `--seal-text-secondary` ≡ shadcn `--muted-foreground`? | нет | `--muted-foreground` = gray-500 / **polar-500**, а `text-secondary` = polar-400. Мы следуем Tier-2 (`text-secondary`) |

## 5. Что НЕ менялось (осознанно) и почему

- `--seal-status-*`, `--seal-pill-*` — пресеты Pill/Status, сверены построчно с `orbit/Pill.tsx`
  и `orbit/Status.tsx` отдельным проходом; они используют Tailwind-палитру, а не Tier-2.
- `--seal-select-*`, `--seal-progress-*`, `--seal-switch-*`, `--seal-checkbox-*` — производные
  от Tier-1/2; перечислены врезками в своих компонентах.
- `--seal-secondary-border`, `--seal-avatar-outline`, `--seal-backdrop`,
  `--seal-input-shadow`, `--seal-statistic-border` — значения вне полярных токенов
  (Polar задаёт их классами утилит `border-black/5`, `ring-black/10`, `bg-black/80`,
  `shadow-xs`, `data-[state=open]:border-transparent`), перенесены как есть.

## 6. Мёртвые селекторы, подтверждённые для удаления

Проверено `code_search` по `src/**/*.tsx` — совпадений нет, правила в `tokens.css` мертвы:

`.seal-select-positioner`, `.seal-select-popup`, `.seal-select-list`, `.seal-select-backdrop`,
`.seal-select-arrow`, `.seal-select-group`, `.seal-select-group-label`, `.seal-select-separator`,
`.seal-select-item-text`, `.seal-empty-title`, `.seal-empty-description`, `.seal-timeline-fold`,
`.seal-timeline-fold-chevron`, `.seal-timeline-empty-title`, `.seal-popover-title`,
`.seal-popover-description`.

Дополнено по отчётам скептиков волны 5 (перед удалением подтвердить grep’ом — файл правился параллельно):

`.seal-filter-nav`, `.seal-filter-nav-secondary` (кнопки переведены на наш `Button`),
`.seal-menu-submenu-arrow`, `.seal-navigation-menu-arrow` (+ `::before` и `[data-side]` — стрелка сведена к общему `.seal-menu-arrow`), `.seal-radio-description`,
`.seal-checkbox-row-nested`, `.seal-toast-action`, `.seal-toast-close` (теперь наш `Button`),
`.seal-autocomplete-input-group`, `-search-icon`, `-input`, `-clear`, `-trigger`, `-icon`, `-inline-list`
(после переделки Autocomplete в волне 5 он живёт на общих `.seal-combobox-*`).

Дубли, где молча побеждает последнее объявление (стоит свести к одному правилу):
`.seal-tabs-tab[data-active]` (3 объявления), `.seal-toggle[aria-pressed='true']` (2),
`.seal-filter-item` (3), `.seal-popover-popup` (4 вместе с базой),
`.seal-segmented-item[aria-pressed='true']` (2).

**Живые** (не удалять, вопреки отчёту воркера 15): `.seal-select-trigger`, `-value`, `-icon`,
`-label`, `-item`, `-item-indicator`, `-scroll-arrow` → токен `--seal-select-popup-bg` тоже жив
(`.seal-select-scroll-arrow`).

## 7. Правило: какой слой Polar главный для какой роли

У Polar минимум три слоя, и один токен невозможно взять «просто из Polar» — нужно знать, какой компонент мы портируем:

- **Текстовые роли** → Tier 2 (orbit `semantics.stylex.ts`): этим пользуются `Text` и всё, что портировано из orbit. `muted` по определению Polar равен `secondary` (`textColorStyles.muted → text-secondary`), светлое значение совпадает с shadcn `--muted-foreground`, тёмное — нет.
- **Поверхности, границы, панели меню и попапов, поля, радиусы** → shadcn-слой (`globals.css` `@theme` + `:root`/`.dark`): из него портированы компоненты `ui/*`.
- **Палитра (Tier 1)** → блок `@theme`, значения совпадают посимвольно (oklch/hsl).

Если два слоя дают разные значения для одной роли — выбираем слой того компонента, который портируем, и фиксируем выбор здесь. Разбирательство «какой Polar прав» без указания слоя и файла считаем недействительным.
