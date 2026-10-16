# Переиспользование: единый канон панелей (SEAL POPUP)

Претензия пользователя: «у селекта классно сделан выпад (панель), а везде, где он есть, — разнобой; почему не переиспользуем?». Факт подтверждён: в `tokens.css` одна и та же панель была нарисована **9 раз** — `seal-select-*`, `seal-combobox-*`, `seal-menu-*`, `seal-popover-*`, `seal-preview-card-*`, `seal-navigation-menu-*`, `seal-context-menu-*`, `seal-dialog-*`, `seal-drawer-*`.

Решение: один контракт классов (секция **SEAL POPUP** в конце `src/tokens.css`, воркер w50). Старые правила пока **не удалены** — миграция ещё не прошла; их список в §5.

---

## 1. Канон (единственный источник правды)

| Класс | Роль | Откуда значения |
|---|---|---|
| `.seal-popup` | поверхность панели: `z-index 50`, рамка `1px --seal-border`, `--seal-radius-md` (7.6px), фон `--seal-popover`, цвет `--seal-popover-fg`, тень `--seal-dialog-shadow` | совпадает у `.seal-menu-popup` + `.seal-popover-popup` + `.seal-combobox-popup` |
| `.seal-popup--menu` | мин. ширина 128px, `p-1`, скролл | Polar `ui/dropdown-menu.tsx` |
| `.seal-popup--popover` | `min-width 288px`, `max-width 420px`, `p-4` | Polar `ui/popover.tsx` (`w-72 rounded-md border p-4`) |
| `.seal-popup--pickers` | панель по ширине триггера, `--seal-radius-xl`, `p-0`, анимация | Polar `ui/select.tsx`, `atoms/Combobox.tsx` (`rounded-xl p-0`) |
| `.seal-popup--tooltip` | `z-index 60`, `padding 6px 12px`, фон/цвет/тень тултипа | Polar `orbit/Tooltip.tsx` (`rounded-md border px-3 py-1.5 text-sm shadow-md`) |
| `.seal-popup--dialog` | `grid gap-16px`, `width min(512px, 100vw-32px)`, `p-6`, `--seal-radius-lg`, фон `--seal-card` | Polar `ui/dialog.tsx` (`bg-background rounded-lg border p-6 max-w-lg`) |
| `.seal-popup-positioner` / `--above` | слой позиционера (50, у тултипа 60) | `.seal-menu-positioner`, `.seal-tooltip-positioner` |
| `.seal-popup-backdrop` | `fixed inset 0`, `z-index 40` | `.seal-popover-backdrop`/`.seal-menu-backdrop` |
| `.seal-popup-arrow` (`--tooltip`) | 12×6, ромб через `::before`, `[data-side]`; фон — из `--seal-popup-arrow-bg` | общая геометрия popover/tooltip/menu/combobox |
| `.seal-popup-list` | `p-1`, скролл `--available-height` (320px) | `.seal-combobox-list` |
| `.seal-popup-item` | строка пункта: `min-height 32`, `padding 6px 8px`, `gap 8`, `radius-md`, `14px`, transition 75ms | `.seal-menu-item` + `.seal-combobox-item` + `.seal-select-item` |
| `.seal-popup-item[data-highlighted]` / `:hover` / `[data-disabled]` / `[data-destructive]` | состояния на семантических токенах (`--seal-select-highlight-bg/-text`, `--seal-text-danger`, `--seal-destructive`, `--seal-on-danger`) | `.seal-menu-item`, `.seal-combobox-item` |
| `.seal-popup-item-content` | слот текста с ellipsis | `.seal-combobox-item-content`, `.seal-select-item-text` |
| `.seal-popup-item-indicator` (`--start`) + `.seal-popup-item--indicator-start` | галочка/кружок; по умолчанию **справа** (`ml-auto`), вариант слева — для Select | Polar Combobox (`Check className="ml-auto"`), Polar select item |
| `.seal-popup-group`, `.seal-popup-group-label`, `.seal-popup-separator`, `.seal-popup-empty`, `.seal-popup-status`, `.seal-popup-scroll-arrow` | группы, подписи, разделители, пустой список, статус, стрелки скролла | `.seal-menu-*`, `.seal-combobox-*` |
| `.seal-field-shell` / `-control` / `-button` | оболочка поля с кнопками внутри (носится **вместе** с `.seal-input`, который даёт рамку/фон/радиус/тень); фокус — через `--seal-input-focus`/`--seal-input-focus-ring` | `.seal-input-group*` + `.seal-combobox-search-group*` |

`--seal-input-focus`/`--seal-input-focus-ring` уже исправлены на blue-300/blue-100 (dark: blue-600 / blue-700-40) — канон использует **семантические** токены, без примитивов.

## 2. Таблица миграции (старое → канон)

### Поверхности
| Старое | Куда | Файлы |
|---|---|---|
| `.seal-menu-popup` | `.seal-popup .seal-popup--menu` | `Menu.tsx`, `Menubar.tsx`, `ContextMenu.tsx` |
| `.seal-popover-popup` | `.seal-popup .seal-popup--popover` | `Popover.tsx` (и всё, что на нём: `FilterPopover`, `DateTimePicker`) |
| `.seal-preview-card-popup` | `.seal-popup .seal-popup--popover` | `PreviewCard.tsx` |
| `.seal-combobox-popup` | `.seal-popup .seal-popup--pickers` | `Select.tsx`, `Combobox.tsx`, `Autocomplete.tsx` |
| `.seal-combobox-inline-panel` | `.seal-popup .seal-popup--pickers` | `Autocomplete.tsx` |
| `.seal-navigation-menu-popup` | `.seal-popup` | `NavigationMenu.tsx` |
| `.seal-tooltip-popup` | `.seal-popup .seal-popup--tooltip` | `Tooltip.tsx` |
| `.seal-dialog-popup` | `.seal-popup .seal-popup--dialog` | `Dialog.tsx`, `AlertDialog.tsx` |
| `.seal-drawer-popup` | `.seal-popup` | `Drawer.tsx` |
| `.seal-select-popup` | мёртвый (уже не используется) | — |

### Слои и стрелки
| Старое | Куда |
|---|---|
| `.seal-menu-positioner`, `.seal-popover-positioner`, `.seal-combobox-positioner`, `.seal-preview-card-positioner` | `.seal-popup-positioner` |
| `.seal-tooltip-positioner` | `.seal-popup-positioner .seal-popup-positioner--above` |
| `.seal-navigation-menu-positioner` | `.seal-popup-positioner` (свои размеры и hover-bridge остаются отдельным модификатором) |
| `.seal-menu-backdrop`, `.seal-popover-backdrop`, `.seal-combobox-backdrop`, `.seal-preview-card-backdrop`, `.seal-navigation-menu-backdrop` | `.seal-popup-backdrop` |
| `.seal-popover-arrow`, `.seal-menu-arrow`, `.seal-combobox-arrow`, `.seal-preview-card-arrow`, `.seal-navigation-menu-arrow` | `.seal-popup-arrow` |
| `.seal-tooltip-arrow` | `.seal-popup-arrow .seal-popup-arrow--tooltip` |

### Пункты и служебные строки
| Старое | Куда | Примечание |
|---|---|---|
| `.seal-menu-item` | `.seal-popup-item` | см. §4 (радиус) |
| `.seal-combobox-item` | `.seal-popup-item` | — |
| `.seal-select-item` | `.seal-popup-item .seal-popup-item--indicator-start` | индикатор слева |
| `.seal-filter-item` | `.seal-popup-item` | сверить высоты с `Shared/FilterPopover` |
| `.seal-menu-item-check`, `.seal-combobox-item-indicator`, `.seal-filter-item-check` | `.seal-popup-item-indicator` | — |
| `.seal-select-item-indicator` | `.seal-popup-item-indicator .seal-popup-item-indicator--start` | — |
| `.seal-combobox-item-content`, `.seal-select-item-text` | `.seal-popup-item-content` | — |
| `.seal-menu-group`, `.seal-combobox-group` | `.seal-popup-group` | — |
| `.seal-menu-group-label`, `.seal-combobox-group-label` | `.seal-popup-group-label` | — |
| `.seal-menu-separator`, `.seal-combobox-separator`, `.seal-filter-separator` | `.seal-popup-separator` | — |
| `.seal-combobox-empty`, `.seal-filter-empty` | `.seal-popup-empty` | — |
| `.seal-combobox-status` | `.seal-popup-status` | — |
| `.seal-combobox-list` | `.seal-popup-list` | — |
| `.seal-select-scroll-arrow` | `.seal-popup-scroll-arrow` | — |

### Оболочки поля
| Старое | Куда |
|---|---|
| `.seal-input-group` | `.seal-input .seal-field-shell` |
| `.seal-input-group-field` | `.seal-field-shell-control` |
| `.seal-input-group-button` | `.seal-field-shell-button` |
| `.seal-combobox-search-group` | `.seal-input .seal-field-shell` (строка поиска внутри панели — сверить `border-bottom`) |
| `.seal-combobox-trigger` | `.seal-input` + `.seal-select-trigger`-стиль оболочки (общий с Select) |

## 3. Инструкция для мигрантов

1. В своём `.tsx` заменить строки `className="seal-X"` на канонические из §2 (несколько классов через пробел).
2. Ничего не добавлять в `tokens.css`: канон уже полный. Если для компонента чего-то не хватает — **написать это в отчёте**, а не вводить новый класс.
3. `data-*` атрибуты (`data-highlighted`, `data-disabled`, `data-destructive`, `data-side`, `data-popup-open`) оставить как есть — канон читает именно их.
4. Композицию собирать из частей, а не рукописной разметкой: панель — часть Base UI с `.seal-popup`, пункт — с `.seal-popup-item`, кнопки внутри — `.seal-field-shell-button`; кнопки вне поля — наш `Button`.
5. После миграции компонент не должен носить ни одного старого класса из §2.

## 4. Что сливать НЕЛЬЗЯ (и почему)

| Исключение | Причина |
|---|---|
| Диалог/подтверждение (`--dialog`) | свой фон (`--seal-card`, не popover), радиус `radius-lg`, сетка `gap-16`, ширина 512 — канон задаёт только поверхность |
| Drawer | собственные стороны/размеры/свайп; берёт только `.seal-popup` как поверхность |
| Тултип | своя поверхность, тень и `z-index 60` → модификатор `--tooltip`, а не наследование popover |
| PreviewCard | `max-width: 320px` вместо 420 — нужен свой модификатор (в каноне только 420) |
| NavigationMenu | `--positioner-width/height`, hover-bridge `::before`, слайд по `data-activation-direction` — остаётся отдельным набором поверх канона |
| Индикатор слева (Select) | `ml-auto` в каноне не подходит → модификаторы `--start` |
| Toast | не панель: своя стопка, `--toast-*` переменные Base UI |
| Слоты поля (`MoneyInput`, `NumberField`) | `.seal-input-wrap`/`-slot` — это слоты вокруг контрола, другая роль, чем группа-с-кнопкой |
| **Радиус пункта** | канон ставит Polar `rounded-md` (7.6px), а в меню исторически `radius-xs` (2px) → **видимое изменение, нужна приёмка** |

## 5. Кандидаты на удаление (после миграции; проверять grep по имени класса)

Номера строк устаревают — удалять по имени, а не по номеру. Старые правила лежат раньше канона, поэтому после миграции они мёртвые.

- `seal-combobox-*` — popup/positioner/list/item/item-content/item-indicator/group/row/empty/status/separator/arrow/backdrop/inline-panel.
- `seal-select-*` — `-item`, `-item-indicator`, `-item-text`, `-scroll-arrow`, а также уже мёртвые `-popup`, `-positioner`, `-list`, `-backdrop`, `-arrow`, `-group`, `-group-label`, `-separator`.
- `seal-menu-*` — `-popup`, `-item`, `-item-check`, `-separator`, `-group`, `-group-label`, `-positioner`, `-backdrop`, `-arrow`, `-submenu-arrow`, `-submenu-chevron` (chevron — оставить, это иконка подменю, не панель).
- `seal-popover-*` — `-popup`, `-positioner`, `-backdrop`, `-arrow`, `-viewport`; `seal-preview-card-*` — `-popup`, `-positioner`, `-backdrop`, `-arrow`.
- `seal-tooltip-*` — `-popup`, `-positioner`, `-arrow`, `-viewport`, `-trigger`.
- `seal-navigation-menu-*` — `-popup`, `-positioner`, `-backdrop`, `-arrow`, `-viewport`.
- `seal-dialog-*` — `-popup`, `-backdrop`, `-viewport`, `-close`, `-title`, `-description`, `-header`, `-footer`, `-actions` (последние — из ранних проходов; перед удалением сверить использование).
- `seal-drawer-*` — `-popup`, `-backdrop`, `-title`, `-description`, `-close`, `-content`, `-header`, `-footer`.
- `seal-input-group*`, `seal-combobox-search-group*`, `seal-combobox-search*`.
- Дубли одного селектора с разными значениями (найдены скептиками волны 5, ещё не сняты): `.seal-avatar-image`, `.seal-checkbox[data-indeterminate]`, `.seal-filter-item` / `.seal-filter-search` / `.seal-filter-header-label`.

## 6. План миграции

1. Один воркер на семейство: `Menu/ContextMenu/Menubar`, `Popover/Tooltip/PreviewCard`, `Dialog/AlertDialog/Drawer`, `Select/Combobox/Autocomplete`, `FilterPopover/DateTimePicker`, `MoneyInput/NumberField`.
2. Каждый правит **только свои `.tsx`** и не трогает `tokens.css` (единственный владелец канона — общий проход).
3. После всех: `tsc --noEmit` + `vite build` + визуальная проверка в браузере (панели открываются, стрелки видны, обе темы).
4. Финальный проход по §5 удаляет мёртвое и снимает дубли.
