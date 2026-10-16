import { useId, type ReactElement, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;

/**
 * Autocomplete — пункт списка. Форма `{ value, label }` распознаётся Base UI сама
 * (`autocomplete.md`, `Root.itemToStringValue`: «If the shape of the object is
 * `{ value, label }`, the label will be used automatically»).
 */
export type AutocompleteOption = { value: string; label: string };

/**
 * Группа пунктов — ровно та форма, что описана в `autocomplete.md` («Grouped»):
 * массив объектов с `items`, а заголовок секции — из `value`.
 * Поля-заголовок объявлены через `type` (а не `interface`), чтобы тип был
 * присваиваем `Group<Item>` из Base UI (у него строковая index signature).
 */
export type AutocompleteGroupEntry = {
  /** Заголовок группы — имя из доки Base UI (`{ value: 'Fruits', items: [...] }`). */
  value?: string;
  /** Синоним заголовка для читаемости: `label` приоритетнее `value`. */
  label?: string;
  /** Пункты этой группы. */
  items: readonly AutocompleteOption[];
};

/** Данные списка: плоский массив пунктов или массив групп (дока «Grouped»). */
export type AutocompleteItemsInput =
  | readonly AutocompleteOption[]
  | readonly AutocompleteGroupEntry[];

export type AutocompleteRootProps<ItemValue = AutocompleteOption> = Sealed<
  BaseAutocomplete.Root.Props<ItemValue>
>;
export type AutocompleteValueProps = Sealed<BaseAutocomplete.Value.Props>;
export type AutocompleteTriggerProps = Sealed<BaseAutocomplete.Trigger.Props>;
export type AutocompleteInputProps = Sealed<BaseAutocomplete.Input.Props>;
export type AutocompleteInputGroupProps = Sealed<BaseAutocomplete.InputGroup.Props>;
export type AutocompleteIconProps = Sealed<BaseAutocomplete.Icon.Props>;
export type AutocompleteClearProps = Sealed<BaseAutocomplete.Clear.Props>;
export type AutocompleteListProps = Sealed<BaseAutocomplete.List.Props>;
export type AutocompleteStatusProps = Sealed<BaseAutocomplete.Status.Props>;
export type AutocompletePortalProps = Sealed<BaseAutocomplete.Portal.Props>;
export type AutocompleteBackdropProps = Sealed<BaseAutocomplete.Backdrop.Props>;
export type AutocompletePositionerProps = Sealed<BaseAutocomplete.Positioner.Props>;
export type AutocompletePopupProps = Sealed<BaseAutocomplete.Popup.Props>;
export type AutocompleteArrowProps = Sealed<BaseAutocomplete.Arrow.Props>;
export type AutocompleteGroupProps = Sealed<BaseAutocomplete.Group.Props>;
export type AutocompleteGroupLabelProps = Sealed<BaseAutocomplete.GroupLabel.Props>;
export type AutocompleteItemProps = Sealed<BaseAutocomplete.Item.Props>;
export type AutocompleteRowProps = Sealed<BaseAutocomplete.Row.Props>;
export type AutocompleteCollectionProps = Sealed<BaseAutocomplete.Collection.Props>;
export type AutocompleteEmptyProps = Sealed<BaseAutocomplete.Empty.Props>;
export type AutocompleteSeparatorProps = Sealed<BaseAutocomplete.Separator.Props>;

/** Root.ChangeEventDetails — как в доке Base UI 1.8 (второй аргумент `onValueChange`). */
export type AutocompleteChangeEventDetails = BaseAutocomplete.Root.ChangeEventDetails;
export type AutocompleteRootState = BaseAutocomplete.Root.State;
export type AutocompleteRootActions = BaseAutocomplete.Root.Actions;
export type AutocompleteHighlightEventDetails = BaseAutocomplete.Root.HighlightEventDetails;

export function AutocompleteRoot<ItemValue = AutocompleteOption>(
  props: AutocompleteRootProps<ItemValue>,
) {
  // BaseAutocomplete.Root — перегруженный генерик-компонент: спред `props` теряет
  // выведенный ItemValue и не проходит ни одну из перегрузок. Наружный тип
  // (AutocompleteRootProps) при этом остаётся полным Sealed-типом частей Base UI.
  const Root = BaseAutocomplete.Root as unknown as (
    props: AutocompleteRootProps<ItemValue>,
  ) => ReactElement;
  return <Root {...props} />;
}

/**
 * Оболочка поля с иконкой и кнопками — канонические `.seal-input .seal-field-shell`
 * (Polar orbit/Input: h-10, rounded-xl, focus — через семантические
 * `--seal-input-focus`/`--seal-input-focus-ring`). Раньше здесь был
 * отдельный дубль `.seal-autocomplete-input-group`.
 */
export function AutocompleteInputGroup({ children, ...props }: AutocompleteInputGroupProps) {
  return (
    <BaseAutocomplete.InputGroup className="seal-input seal-field-shell" {...props}>
      {children}
    </BaseAutocomplete.InputGroup>
  );
}

/** Контрол внутри группы: рамку/фон/тень рисует `.seal-input` на группе. */
export function AutocompleteInput(props: AutocompleteInputProps) {
  return <BaseAutocomplete.Input className="seal-field-shell-control" {...props} />;
}

/** Кнопка-иконка внутри поля (та же роль, что у Clear): канонический `.seal-field-shell-button`. */
export function AutocompleteTrigger({ children, ...props }: AutocompleteTriggerProps) {
  return (
    <BaseAutocomplete.Trigger className="seal-field-shell-button" {...props}>
      {children}
    </BaseAutocomplete.Trigger>
  );
}

export function AutocompleteIcon({ children, ...props }: AutocompleteIconProps) {
  return (
    <BaseAutocomplete.Icon className="seal-combobox-search-icon" {...props}>
      {children}
    </BaseAutocomplete.Icon>
  );
}

export function AutocompleteClear({ children, ...props }: AutocompleteClearProps) {
  return (
    <BaseAutocomplete.Clear className="seal-field-shell-button" {...props}>
      {children}
    </BaseAutocomplete.Clear>
  );
}

/**
 * Текущее значение поля (Base UI `Value`). По `.d.ts` принимает и узел, и
 * функцию `(value: string) => ReactNode`; собственного HTML-элемента не рендерит,
 * поэтому его можно ставить внутрь `Empty` (`<Autocomplete.Value />`).
 */
export function AutocompleteValue(props: AutocompleteValueProps) {
  return <BaseAutocomplete.Value {...props} />;
}

export function AutocompletePortal({ children, ...props }: AutocompletePortalProps) {
  return (
    <BaseAutocomplete.Portal {...props}>
      {children}
    </BaseAutocomplete.Portal>
  );
}

export function AutocompleteBackdrop(props: AutocompleteBackdropProps) {
  return <BaseAutocomplete.Backdrop className="seal-popup-backdrop" {...props} />;
}

export function AutocompletePositioner({ children, ...props }: AutocompletePositionerProps) {
  return (
    <BaseAutocomplete.Positioner className="seal-popup-positioner" {...props}>
      {children}
    </BaseAutocomplete.Positioner>
  );
}

export function AutocompletePopup({ children, ...props }: AutocompletePopupProps) {
  return (
    <BaseAutocomplete.Popup className="seal-popup seal-popup--pickers" {...props}>
      {children}
    </BaseAutocomplete.Popup>
  );
}

export function AutocompleteArrow(props: AutocompleteArrowProps) {
  return <BaseAutocomplete.Arrow className="seal-popup-arrow" {...props} />;
}

export function AutocompleteStatus({ children, ...props }: AutocompleteStatusProps) {
  return (
    <BaseAutocomplete.Status className="seal-popup-status" {...props}>
      {children}
    </BaseAutocomplete.Status>
  );
}

/** Рендерит детей только при пустом списке; корень должен оставаться смонтированным. */
export function AutocompleteEmpty({ children, ...props }: AutocompleteEmptyProps) {
  return (
    <BaseAutocomplete.Empty className="seal-popup-empty" {...props}>
      {children}
    </BaseAutocomplete.Empty>
  );
}

/** Функциональный ребёнок `(item, index) => ReactNode` — документированный способ для плоского списка. */
export function AutocompleteList({ children, ...props }: AutocompleteListProps) {
  return (
    <BaseAutocomplete.List className="seal-popup-list" {...props}>
      {children}
    </BaseAutocomplete.List>
  );
}

export function AutocompleteRow({ children, ...props }: AutocompleteRowProps) {
  return (
    <BaseAutocomplete.Row className="seal-combobox-row" {...props}>
      {children}
    </BaseAutocomplete.Row>
  );
}

export function AutocompleteItem({ children, ...props }: AutocompleteItemProps) {
  return (
    <BaseAutocomplete.Item className="seal-popup-item" {...props}>
      {children}
    </BaseAutocomplete.Item>
  );
}

/** Группа: `items` передаются сюда, а `Collection` внутри читает их (дока «Grouped»). */
export function AutocompleteGroup({ children, ...props }: AutocompleteGroupProps) {
  return (
    <BaseAutocomplete.Group className="seal-popup-group" {...props}>
      {children}
    </BaseAutocomplete.Group>
  );
}

export function AutocompleteGroupLabel({ children, ...props }: AutocompleteGroupLabelProps) {
  return (
    <BaseAutocomplete.GroupLabel className="seal-popup-group-label" {...props}>
      {children}
    </BaseAutocomplete.GroupLabel>
  );
}

export function AutocompleteSeparator(props: AutocompleteSeparatorProps) {
  return <BaseAutocomplete.Separator className="seal-popup-separator" {...props} />;
}

/** Обязательный функциональный ребёнок: рендерит отфильтрованные пункты группы. */
export function AutocompleteCollection(props: AutocompleteCollectionProps) {
  return <BaseAutocomplete.Collection {...props} />;
}

export const useAutocompleteFilter = BaseAutocomplete.useFilter;
export const useAutocompleteFilteredItems = BaseAutocomplete.useFilteredItems;

export const AutocompleteParts = {
  Root: AutocompleteRoot,
  InputGroup: AutocompleteInputGroup,
  Input: AutocompleteInput,
  Trigger: AutocompleteTrigger,
  Icon: AutocompleteIcon,
  Clear: AutocompleteClear,
  Value: AutocompleteValue,
  Portal: AutocompletePortal,
  Backdrop: AutocompleteBackdrop,
  Positioner: AutocompletePositioner,
  Popup: AutocompletePopup,
  Arrow: AutocompleteArrow,
  Status: AutocompleteStatus,
  Empty: AutocompleteEmpty,
  List: AutocompleteList,
  Row: AutocompleteRow,
  Item: AutocompleteItem,
  Group: AutocompleteGroup,
  GroupLabel: AutocompleteGroupLabel,
  Separator: AutocompleteSeparator,
  Collection: AutocompleteCollection,
  useFilter: useAutocompleteFilter,
  useFilteredItems: useAutocompleteFilteredItems,
};

export type AutocompleteProps = Omit<
  AutocompleteRootProps,
  'items' | 'filteredItems' | 'value' | 'defaultValue' | 'onValueChange' | 'itemToStringValue' | 'children'
> & {
  /**
   * Полный список подсказок: плоский массив пунктов (`{ value, label }`)
   * или массив групп `{ value, items }` — дока `autocomplete.md`, «Grouped».
   */
  items: AutocompleteItemsInput;
  /**
   * Внешне отфильтрованный список (асинхронный поиск). Дока `autocomplete.md`,
   * `Root.filteredItems`: «the list uses these items instead of filtering the
   * `items` prop internally» — поэтому вместе с ним `filter` отключается.
   * Структура (плоская или групповая) должна повторять `items`.
   */
  filteredItems?: AutocompleteItemsInput;
  /** Текст в поле — он же поисковый запрос. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, eventDetails: AutocompleteChangeEventDetails) => void;
  /** Видимая подпись над полем (своего Label-парта у Autocomplete нет). */
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  /** Показывает `Status` в состоянии загрузки. */
  isLoading?: boolean;
  /** Показывает `Status` с ошибкой (асинхронный режим). */
  error?: ReactNode;
  renderItem?: (item: AutocompleteOption) => ReactNode;
  isItemDisabled?: (item: AutocompleteOption) => boolean;
  align?: BaseAutocomplete.Positioner.Props['align'];
  /** Отступ панели от поля. */
  sideOffset?: number;
  /**
   * Список рендерится в потоке без поповера (дока `autocomplete.md`,
   * `Root.inline`: «Specify `open` unconditionally in conjunction with this prop»).
   */
  inline?: boolean;
};

/**
 * Автокомплит Base UI 1.8 в Polar-стиле: поле с поисковой иконкой и кнопкой очистки,
 * панель подсказок — та же Polar-поверхность, что у Combobox/Select
 * (канон `.seal-popup--pickers` + `.seal-popup-list`/`.seal-popup-item`, один источник правды).
 *
 * Покрытые режимы (все — пропсы `BaseAutocomplete.Root`, дока `autocomplete.md`/`.d.ts`):
 * плоский и сгруппированный `items`, `filteredItems` (async + `filter={null}`),
 * `mode` (`list`/`both`/`inline`/`none` — inline-подстановка), `inline` (список в потоке),
 * `autoHighlight`, `keepHighlight`, `highlightItemOnHover`, `openOnInputClick`,
 * `submitOnItemClick`, `onItemHighlighted`, `grid` (навигация по сетке + `Parts.Row`),
 * `virtualized`, `disabled`/`readOnly`/`required`/`name`/`form`/`id`, `open`/`defaultOpen`/`onOpenChange`.
 *
 * Мультивыбора у Autocomplete нет: `selectionMode`, `selectedValue` и
 * `onSelectedValueChange` исключены из `Root.Props` его собственной документацией
 * (мультивыбор — задача `Combobox`); при необходимости используйте `AutocompleteParts`.
 */
export function Autocomplete({
  items,
  filteredItems,
  value,
  defaultValue,
  onChange,
  label,
  placeholder = 'Search…',
  emptyLabel = 'No results found',
  isLoading = false,
  error,
  renderItem,
  isItemDisabled,
  align = 'start',
  sideOffset = 4,
  inline = false,
  mode,
  filter,
  open,
  autoHighlight,
  keepHighlight,
  highlightItemOnHover,
  openOnInputClick,
  submitOnItemClick,
  onItemHighlighted,
  ...rootProps
}: AutocompleteProps) {
  const inputId = useId();
  const isAsync = filteredItems !== undefined;

  const renderOption = (item: AutocompleteOption) => (
    <AutocompleteItem key={item.value} value={item} disabled={isItemDisabled?.(item)}>
      <span className="seal-popup-item-content">{renderItem?.(item) ?? item.label}</span>
    </AutocompleteItem>
  );

  /**
   * Ребёнок `List` — функция, как в доке. Для плоского списка Base UI отдаёт пункт,
   * для сгруппированного — группу (дока «Grouped»): тогда её `items` уходят в
   * `Group`, а рендерит их вложенный `Collection`.
   */
  const renderEntry = (entry: AutocompleteOption | AutocompleteGroupEntry, index: number) => {
    if (Array.isArray((entry as AutocompleteGroupEntry).items)) {
      const group = entry as AutocompleteGroupEntry;
      const heading = group.label ?? group.value;
      return (
        <AutocompleteGroup key={`${heading ?? 'group'}-${index}`} items={group.items}>
          {heading ? <AutocompleteGroupLabel>{heading}</AutocompleteGroupLabel> : null}
          <AutocompleteCollection>{(item: AutocompleteOption) => renderOption(item)}</AutocompleteCollection>
        </AutocompleteGroup>
      );
    }

    return renderOption(entry as AutocompleteOption);
  };

  const listContent = (
    <>
      <AutocompleteStatus>{isLoading ? 'Loading…' : (error ?? null)}</AutocompleteStatus>
      {/* Паттерн доки Base UI (Empty): «No results …» + текущий запрос из парта Value. */}
      <AutocompleteEmpty>
        {emptyLabel} &laquo;<AutocompleteValue />&raquo;
      </AutocompleteEmpty>
      <AutocompleteList>{renderEntry}</AutocompleteList>
    </>
  );

  return (
    <AutocompleteRoot
      {...rootProps}
      items={items}
      filteredItems={filteredItems}
      filter={isAsync ? null : filter}
      mode={mode}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange ? (nextValue, eventDetails) => onChange(nextValue, eventDetails) : undefined}
      autoHighlight={autoHighlight}
      keepHighlight={keepHighlight}
      highlightItemOnHover={highlightItemOnHover}
      openOnInputClick={openOnInputClick}
      submitOnItemClick={submitOnItemClick}
      onItemHighlighted={onItemHighlighted}
      inline={inline || undefined}
      open={inline ? true : open}
    >
      {label ? (
        <label className="seal-combobox-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <AutocompleteInputGroup>
        <AutocompleteIcon>
          <Search size={16} aria-hidden />
        </AutocompleteIcon>
        <AutocompleteInput
          id={inputId}
          placeholder={placeholder}
          aria-label={label ? undefined : placeholder}
        />
        <AutocompleteClear aria-label="Clear search">
          <X size={14} aria-hidden />
        </AutocompleteClear>
      </AutocompleteInputGroup>
      {inline ? (
        // Inline-режим: дока `autocomplete.md`, `Root.inline` — список в потоке,
        // без Portal/Positioner/Popup.
        <div className="seal-popup seal-popup--pickers">{listContent}</div>
      ) : (
        <AutocompletePortal>
          <AutocompletePositioner align={align} sideOffset={sideOffset}>
            <AutocompletePopup aria-busy={isLoading || undefined}>{listContent}</AutocompletePopup>
          </AutocompletePositioner>
        </AutocompletePortal>
      )}
    </AutocompleteRoot>
  );
}
