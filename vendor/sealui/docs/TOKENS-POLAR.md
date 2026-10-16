# sealui tokens ↔ Polar: карта соответствия

Каждый токен `--seal-*` сверен с первоисточником Polar. Если у токена нет полярного
донора — он явно помечен как **наше расширение** (не выдаём за Polar).

## Источники истины

| Источник | Что берём |
|---|---|
| `polar-reference/clients/apps/web/src/styles/globals.css` | `@theme` (палитры, шрифты, тени, радиусы), `@layer base :root` (shadcn-токены светлой темы), `:root.dark` (тёмной), Orbit-токены (`--orbit-*`), типографика `body` |
| `polar-reference/clients/packages/orbit/src/value.stylex.ts` | шкала отступов и breakpoints |
| `polar-reference/clients/packages/orbit/src/primitives/createText.tsx`, `Text.tsx` | роли/размеры текста, `textColors`, `textWrapStyles`, `HEADING_FONT_FEATURES` |
| `polar-reference/clients/packages/orbit/src/components/*.tsx` | литеральные классы компонентов (кнопка, инпут, свитч, чекбокс, Pill/Status) |
| `polar-reference/clients/packages/ui/src/components/**` | shadcn-слой (popover, dialog, dropdown-menu, form, separator, calendar…) |

## Шкалы

| Токены | Значения | Полярный источник |
|---|---|---|
| `--seal-space-1…12` | 4/8/12/16/20/24/32/40/48 | Tailwind-шкала, которой пользуется Polar (`value.stylex.ts`) |
| `--seal-radius-xs…full` | **2 / 5.6 / 7.6 / 9.6** / 12 / 16 / 24 / 32 / 9999 | `globals.css` `@theme`: `--radius: 0.6rem`, `--radius-sm/md/lg = calc(--radius − 4/2/0)`, `--radius-4xl: 2rem` |
| `--seal-text-xxs…4xl` | 10.4 / 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 | `globals.css` `@theme --text-xxs: 0.65rem` + дефолт Tailwind v4 |
| `--seal-shadow-md/lg/xl/3xl` | как в Polar | `globals.css` `@theme` (`--shadow-md/lg/xl/3xl`) |
| `--seal-font-sans/display/mono` | PP Neue Montreal + Inter / InterDisplay / GeistMono | `globals.css` `@theme` (`--font-sans/display/mono`) |

> **Главный фикс:** раньше `--seal-radius-sm/md/lg` были 4/6/8px (дефолт Tailwind), а у
> Polar `rounded-sm/md/lg` = **5.6 / 7.6 / 9.6px**. Это затрагивало каждый компонент.

## Палитра

| Токены | Источник |
|---|---|
| `--seal-gray-*`, `--seal-blue-*`, `--seal-red-*` | `globals.css` `@theme` (oklch, 1:1) |
| `--seal-polar-*` | `globals.css` `@theme` (hsl 85/79/68/62/52/46/16/13/9.5/6.5/3.5 %) |
| `--seal-emerald-*` (+ алиасы `--seal-green-*`) | Polar-палитра green (oklch) |
| `--seal-amber/yellow/purple/violet/indigo-*` | дефолтные палитры Tailwind v4, которые Polar **не переопределяет** — значения совпадают с Tailwind 1:1 |

## Семантические токены: светлая тема

| Наш токен | Значение | Полярный источник (`globals.css :root`) |
|---|---|---|
| `--seal-background-primary` | gray-50 | `--background: var(--color-gray-50)` |
| `--seal-card` / `--seal-card-fg` | white / gray-900 | `--card`, `--card-foreground` |
| `--seal-popover` / `--seal-popover-fg` | white / `hsl(224 71.4% 4.1%)` | `--popover`, `--popover-foreground` |
| `--seal-border` / `--seal-input-border` / `--seal-ring` | gray-200 | `--border`, `--input`, `--ring` |
| `--seal-muted-bg` | gray-100 | `--muted` |
| `--seal-text-muted` | gray-500 | `--muted-foreground` |
| `--seal-accent` / `--seal-accent-fg` | blue-600 / white | `--accent` (`--color-blue`), `--accent-foreground` |
| `--seal-destructive` / `--seal-danger` | red-500 | `--destructive` |
| `--seal-secondary-bg` | gray-100 | `--secondary` |
| `--seal-secondary-fg` | gray-900 | `--secondary-foreground` |
| `--seal-text-primary` | gray-900 | `--card-foreground` + Orbit `--orbit-text: #111111` |
| `--seal-text-secondary` | `hsl(0 0% 60%)` | Orbit `--orbit-text-subtle` |
| `--seal-text-disabled` / `--seal-disabled-text` | `hsl(0 0% 32%)` | Orbit `--orbit-text-disabled` |
| `--seal-input-text` | gray-950 | `orbit/Input.tsx` → `text-gray-950` |
| `--seal-primary` / `--seal-primary-fg` | blue-600 / gray-50 | `--primary`, `--primary-foreground` |

## Семантические токены: тёмная тема

| Наш токен | Значение | Полярный источник (`globals.css :root.dark`) |
|---|---|---|
| `--seal-background-primary` | polar-800 | `--background: var(--color-polar-800)` |
| `--seal-card` / `--seal-card-fg` | polar-800 / polar-50 | `--card`, `--card-foreground` |
| `--seal-popover` / `--seal-popover-fg` | polar-900 / polar-50 | `--popover`, `--popover-foreground` |
| `--seal-border` / `--seal-input-border` / `--seal-ring` | polar-700 | `--border`, `--input`, `--ring` |
| `--seal-muted-bg` | polar-700 | `--muted` |
| `--seal-text-muted` | polar-500 | `--muted-foreground` (**уже было верно**) |
| `--seal-text-secondary` | polar-400 | Orbit `--orbit-text-subtle: hsl(233 2% 52%)` |
| `--seal-text-disabled` / `--seal-disabled-text` | `hsl(233 2% 32%)` | Orbit `--orbit-text-disabled` |
| `--seal-text-primary` | polar-50 | `--card-foreground` / `--popover-foreground` |
| `--seal-destructive` | red-500 | `--destructive` |
| `--seal-input-text` | polar-50 | по `--card-foreground` |

## Что исправлено в этом проходе (было → стало)

| Токен | Было | Стало | Доказательство |
|---|---|---|---|
| `--seal-radius-sm` | 4px | 5.6px | `globals.css @theme --radius-sm: calc(var(--radius) − 4px)` |
| `--seal-radius-md` | 6px | 7.6px | `--radius-md: calc(var(--radius) − 2px)` |
| `--seal-radius-lg` | 8px | 9.6px | `--radius-lg: var(--radius)` = 0.6rem |
| `--seal-background-primary` (light / dark) | white / polar-950 | gray-50 / polar-800 | `--background` |
| `--seal-text-primary` (light / dark) | #000 / #fff | gray-900 / polar-50 | `--card-foreground` |
| `--seal-text-secondary` (light) | gray-500 | `hsl(0 0% 60%)` | Orbit `--orbit-text-subtle` |
| `--seal-text-disabled` (light / dark) | gray-300 / polar-600 | `hsl(0 0% 32%)` / `hsl(233 2% 32%)` | Orbit `--orbit-text-disabled` |
| `--seal-disabled-text` | gray-300 / polar-600 | как `--seal-text-disabled` | то же |
| `--seal-popover-fg` (light) | gray-950 | `hsl(224 71.4% 4.1%)` | `--popover-foreground` |
| `--seal-secondary-fg` (light) | #000 | gray-900 | `--secondary-foreground` |
| `--seal-destructive` (dark) | red-600 | red-500 | `--destructive` |
| `--seal-card-fg` (dark) | #fff | polar-50 | `--card-foreground` |
| `--seal-font-sans` | + system-ui/-apple-system | `'PP Neue Montreal', 'Inter', sans-serif` | `--font-sans` |
| `--seal-input-text` (light) | gray-900 | gray-950 | `orbit/Input.tsx` |
| `--seal-select-popup-bg` (dark) | polar-800 | `var(--seal-popover)` | дедуп: панель пикеров = popover |

Добавлено из Polar: `--seal-radius`, `--seal-text-xxs`, `--seal-shadow-3xl`,
`--seal-font-display`, `--seal-font-mono`.
Удалён дубль `--seal-indigo-100` (объявлялся дважды подряд).

## Структурный фикс

`--seal-text-disabled` и `--seal-text-inverse` объявлялись **в конце файла**, внутри
чужой сгенерированной области (`:root {}` / `[data-theme='dark'] {}` после компонентов) —
это ломало единственный источник правды и порядок каскада. Перенесены в канонические
блоки `:root` и `[data-theme='dark']`.

## Токены без полярного донора (наши расширения)

| Токен | Почему оставлен |
|---|---|
| `--seal-text-tertiary` | у Polar третьей ступени текста нет; взята ступень Tailwind gray-400 (light) / polar-500 (dark) |
| `--seal-text-inverse`, `--seal-background-inverse` | инверсной поверхности в Polar нет |
| `--seal-surface-raised` | один токен вместо разных поверхностей Polar (Well = gray-100/polar-800, Alert = background-card); задокументированное отклонение ради контраста |
| `--seal-orbit-surface`, `--seal-orbit-elevated` | порт Orbit-токенов `--orbit-bg-surface/elevated` |
| `--seal-secondary-bg` (dark = polar-700) | служит `Button variant="secondary"`, где Polar пишет литерально `dark:bg-polar-700`; при этом shadcn-токен `--secondary` в тёмной = polar-900 — **конфликт двух полярных слоёв**, оставлено по литеральному классу кнопки |

## Уточнение по прошлым отчётам (проверено по исходнику)

* `--seal-text-muted` (dark = polar-500) — **корректен**, равен `--muted-foreground`
  (`globals.css :root.dark`). Утверждение «в тёмной должно быть polar-400» не подтверждается.
* Второй слой текста тёмной темы (`html.dark { @apply text-gray-200 }`) и Orbit
  `--orbit-text: #f0f0f0` не совпадают между собой ни в одном токене Polar; для
  «основного текста» выбран токен поверхности (`--card-foreground` = polar-50),
  как наиболее употребимый в компонентах.
