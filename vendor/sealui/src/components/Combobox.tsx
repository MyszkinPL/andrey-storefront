import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';

const CHEVRON = <ChevronsUpDown size={16} aria-hidden />;

const CHECK = <Check size={16} strokeWidth={2} aria-hidden />;

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;

export type ComboboxRootProps<Value, Multiple extends boolean | undefined = false, Item = Value> = Omit<
  BaseCombobox.Root.Props<Value, Multiple, Item>,
  'className' | 'style' | 'render'
>;
export type ComboboxValueProps = BaseCombobox.Value.Props;
export type ComboboxCollectionProps = BaseCombobox.Collection.Props;

type ComboboxSourceItem<Item> = { id: string; label: string; record: Item };

export type ComboboxProps<Item> = Omit<
  BaseCombobox.Root.Props<string, false, ComboboxSourceItem<Item>>,
  | 'items'
  | 'children'
  | 'value'
  | 'onValueChange'
  | 'itemToStringLabel'
  | 'itemToStringValue'
  | 'multiple'
  | 'defaultInputValue'
  | 'inputValue'
  | 'onInputValueChange'
> & {
  items: Item[];
  value: string | null;
  selectedItem: Item | null;
  onChange: (value: string | null) => void;
  onQueryChange: (query: string) => void;
  getItemValue: (item: Item) => string;
  getItemLabel: (item: Item) => string;
  renderItem?: (item: Item) => ReactNode;
  isItemDisabled?: (item: Item) => boolean;
  isLoading?: boolean;
  error?: ReactNode;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  align?: BaseCombobox.Positioner.Props['align'];
};
export type ComboboxLabelProps = Sealed<BaseCombobox.Label.Props>;
export type ComboboxInputGroupProps = Sealed<BaseCombobox.InputGroup.Props>;
export type ComboboxInputProps = Sealed<BaseCombobox.Input.Props>;
export type ComboboxTriggerProps = Sealed<BaseCombobox.Trigger.Props>;
export type ComboboxIconProps = Sealed<BaseCombobox.Icon.Props>;
export type ComboboxClearProps = Sealed<BaseCombobox.Clear.Props>;
export type ComboboxPortalProps = Sealed<BaseCombobox.Portal.Props>;
export type ComboboxBackdropProps = Sealed<BaseCombobox.Backdrop.Props>;
export type ComboboxPositionerProps = Sealed<BaseCombobox.Positioner.Props>;
export type ComboboxPopupProps = Sealed<BaseCombobox.Popup.Props>;
export type ComboboxArrowProps = Sealed<BaseCombobox.Arrow.Props>;
export type ComboboxListProps = Sealed<BaseCombobox.List.Props>;
export type ComboboxStatusProps = Sealed<BaseCombobox.Status.Props>;
export type ComboboxEmptyProps = Sealed<BaseCombobox.Empty.Props>;
export type ComboboxItemProps = Sealed<BaseCombobox.Item.Props>;
export type ComboboxItemIndicatorProps = Sealed<BaseCombobox.ItemIndicator.Props>;
export type ComboboxGroupProps = Sealed<BaseCombobox.Group.Props>;
export type ComboboxGroupLabelProps = Sealed<BaseCombobox.GroupLabel.Props>;
export type ComboboxSeparatorProps = Sealed<BaseCombobox.Separator.Props>;
export type ComboboxRowProps = Sealed<BaseCombobox.Row.Props>;
export type ComboboxChipsProps = Sealed<BaseCombobox.Chips.Props>;
export type ComboboxChipProps = Sealed<BaseCombobox.Chip.Props>;
export type ComboboxChipRemoveProps = Sealed<BaseCombobox.ChipRemove.Props>;

export function ComboboxRoot<Value, Multiple extends boolean | undefined = false, Item = Value>({ children, ...props }: ComboboxRootProps<Value, Multiple, Item>) {
  return <BaseCombobox.Root {...props}>{children}</BaseCombobox.Root>;
}

export function ComboboxLabel({ children, ...props }: ComboboxLabelProps) {
  return <BaseCombobox.Label {...props} className="seal-combobox-label">{children}</BaseCombobox.Label>;
}

/** Строка поиска в панели — та же разметка/классы, что у Autocomplete. */
export function ComboboxInputGroup({ children, ...props }: ComboboxInputGroupProps) {
  return <BaseCombobox.InputGroup {...props} className="seal-input seal-field-shell">{children}</BaseCombobox.InputGroup>;
}

/** Поле вне панели — обычная оболочка ввода. */
export function ComboboxInput(props: ComboboxInputProps) {
  return <BaseCombobox.Input {...props} className="seal-field-shell-control" />;
}

/** Триггер-поле: та же оболочка .seal-input, что у Select-триггера. */
export function ComboboxTrigger({ children, ...props }: ComboboxTriggerProps) {
  return <BaseCombobox.Trigger {...props} className="seal-input seal-select-trigger">{children}</BaseCombobox.Trigger>;
}

export function ComboboxIcon({ children, ...props }: ComboboxIconProps) {
  return <BaseCombobox.Icon {...props} className="seal-combobox-icon">{children}</BaseCombobox.Icon>;
}

export function ComboboxClear({ children, ...props }: ComboboxClearProps) {
  return <BaseCombobox.Clear {...props} className="seal-combobox-clear">{children}</BaseCombobox.Clear>;
}

export function ComboboxPortal({ children, ...props }: ComboboxPortalProps) {
  return <BaseCombobox.Portal {...props} className="seal-combobox-portal">{children}</BaseCombobox.Portal>;
}

export function ComboboxBackdrop(props: ComboboxBackdropProps) {
  return <BaseCombobox.Backdrop {...props} className="seal-popup-backdrop" />;
}

export function ComboboxPositioner({ sideOffset = 4, align = 'start', children, ...props }: ComboboxPositionerProps) {
  return <BaseCombobox.Positioner {...props} sideOffset={sideOffset} align={align} className="seal-popup-positioner">{children}</BaseCombobox.Positioner>;
}

export function ComboboxPopup({ children, ...props }: ComboboxPopupProps) {
  return <BaseCombobox.Popup {...props} className="seal-popup seal-popup--pickers">{children}</BaseCombobox.Popup>;
}

export function ComboboxArrow({ children, ...props }: ComboboxArrowProps) {
  return <BaseCombobox.Arrow {...props} className="seal-popup-arrow">{children}</BaseCombobox.Arrow>;
}

export function ComboboxList({ children, ...props }: ComboboxListProps) {
  return <BaseCombobox.List {...props} className="seal-popup-list">{children}</BaseCombobox.List>;
}

export function ComboboxStatus({ children, ...props }: ComboboxStatusProps) {
  return <BaseCombobox.Status {...props} className="seal-popup-status">{children}</BaseCombobox.Status>;
}

export function ComboboxEmpty({ children, ...props }: ComboboxEmptyProps) {
  return <BaseCombobox.Empty {...props} className="seal-popup-empty">{children}</BaseCombobox.Empty>;
}

export function ComboboxItem({ children, ...props }: ComboboxItemProps) {
  return <BaseCombobox.Item {...props} className="seal-popup-item">{children}</BaseCombobox.Item>;
}

export function ComboboxItemIndicator({ children, ...props }: ComboboxItemIndicatorProps) {
  return <BaseCombobox.ItemIndicator {...props} className="seal-popup-item-indicator">{children}</BaseCombobox.ItemIndicator>;
}

export function ComboboxGroup({ children, ...props }: ComboboxGroupProps) {
  return <BaseCombobox.Group {...props} className="seal-popup-group">{children}</BaseCombobox.Group>;
}

export function ComboboxGroupLabel({ children, ...props }: ComboboxGroupLabelProps) {
  return <BaseCombobox.GroupLabel {...props} className="seal-popup-group-label">{children}</BaseCombobox.GroupLabel>;
}

export function ComboboxSeparator({ children, ...props }: ComboboxSeparatorProps) {
  return <BaseCombobox.Separator {...props} className="seal-popup-separator">{children}</BaseCombobox.Separator>;
}

export function ComboboxRow({ children, ...props }: ComboboxRowProps) {
  return <BaseCombobox.Row {...props} className="seal-combobox-row">{children}</BaseCombobox.Row>;
}

export function ComboboxChips({ children, ...props }: ComboboxChipsProps) {
  return <BaseCombobox.Chips {...props} className="seal-combobox-chips">{children}</BaseCombobox.Chips>;
}

export function ComboboxChip({ children, ...props }: ComboboxChipProps) {
  return <BaseCombobox.Chip {...props} className="seal-combobox-chip">{children}</BaseCombobox.Chip>;
}

export function ComboboxChipRemove({ children, ...props }: ComboboxChipRemoveProps) {
  return <BaseCombobox.ChipRemove {...props} className="seal-combobox-chip-remove">{children}</BaseCombobox.ChipRemove>;
}

export function ComboboxValue(props: BaseCombobox.Value.Props) {
  return <BaseCombobox.Value {...props} />;
}

export function ComboboxCollection(props: BaseCombobox.Collection.Props) {
  return <BaseCombobox.Collection {...props} />;
}
export const useComboboxFilter = BaseCombobox.useFilter;
export const useComboboxFilteredItems = BaseCombobox.useFilteredItems;
export const createComboboxItems = BaseCombobox.createItems;

export const ComboboxParts = {
  Root: ComboboxRoot,
  Label: ComboboxLabel,
  InputGroup: ComboboxInputGroup,
  Input: ComboboxInput,
  Trigger: ComboboxTrigger,
  Icon: ComboboxIcon,
  Clear: ComboboxClear,
  Value: ComboboxValue,
  Chips: ComboboxChips,
  Chip: ComboboxChip,
  ChipRemove: ComboboxChipRemove,
  Portal: ComboboxPortal,
  Backdrop: ComboboxBackdrop,
  Positioner: ComboboxPositioner,
  Popup: ComboboxPopup,
  Arrow: ComboboxArrow,
  Status: ComboboxStatus,
  Empty: ComboboxEmpty,
  List: ComboboxList,
  Row: ComboboxRow,
  Item: ComboboxItem,
  ItemIndicator: ComboboxItemIndicator,
  Group: ComboboxGroup,
  GroupLabel: ComboboxGroupLabel,
  Separator: ComboboxSeparator,
  Collection: ComboboxCollection,
  useFilter: useComboboxFilter,
  useFilteredItems: useComboboxFilteredItems,
  createItems: createComboboxItems,
};

export function Combobox<Item>({
  items,
  value,
  selectedItem,
  onChange,
  onQueryChange,
  getItemValue,
  getItemLabel,
  renderItem,
  isLoading = false,
  label,
  placeholder = 'Select a value',
  searchPlaceholder = 'Search…',
  emptyLabel = 'No results found',
  align = 'start',
  isItemDisabled,
  error,
  onOpenChange,
  ...rootProps
}: ComboboxProps<Item>) {
  const [query, setQuery] = useState('');
  const collection = useMemo(
    () => {
      const sourceItems = items.map((record) => ({
        id: getItemValue(record),
        label: getItemLabel(record),
        record,
      }));
      return BaseCombobox.createItems<ComboboxSourceItem<Item>, string>(sourceItems, {
        getValue: (item) => item.id,
        getLabel: (item) => item.label,
      });
    },
    [items, getItemValue, getItemLabel],
  );
  const selectedLabel = (selectedValue: string) =>
    selectedValue === value && selectedItem ? getItemLabel(selectedItem) : selectedValue;

  return (
    <BaseCombobox.Root
      {...rootProps}
      items={collection}
      value={value}
      onValueChange={(nextValue) => onChange(nextValue)}
      inputValue={query}
      onInputValueChange={(nextQuery) => {
        setQuery(nextQuery);
        onQueryChange(nextQuery);
      }}
      itemToStringLabel={selectedLabel}
      itemToStringValue={(selectedValue) => selectedValue}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen) {
          setQuery('');
          onQueryChange('');
        }
        onOpenChange?.(nextOpen, details);
      }}
    >
      {label ? <ComboboxLabel>{label}</ComboboxLabel> : null}
      <ComboboxTrigger aria-label={label ? undefined : placeholder}>
        <span className="seal-combobox-trigger-value">
          {selectedItem ? renderItem?.(selectedItem) ?? getItemLabel(selectedItem) : <span className="seal-combobox-placeholder">{placeholder}</span>}
        </span>
        <ComboboxIcon>{CHEVRON}</ComboboxIcon>
      </ComboboxTrigger>
      <ComboboxPortal>
        <ComboboxPositioner align={align}>
          <ComboboxPopup aria-busy={isLoading || undefined}>
            <ComboboxInputGroup>
              {/* Поле поиска внутри панели: оболочка .seal-input без рамки (Polar cmdk CommandInput). */}
              <BaseCombobox.Input className="seal-field-shell-control" placeholder={searchPlaceholder} aria-label={label ? `Search ${label}` : searchPlaceholder} />
            </ComboboxInputGroup>
            <ComboboxStatus>{isLoading ? 'Loading…' : error ?? null}</ComboboxStatus>
            <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
            <ComboboxList>
              {(source: ComboboxSourceItem<Item>) => (
                <ComboboxItem key={source.id} value={source.id} disabled={isItemDisabled?.(source.record)}>
                  <span className="seal-popup-item-content">{renderItem?.(source.record) ?? source.label}</span>
                  <ComboboxItemIndicator>{CHECK}</ComboboxItemIndicator>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </BaseCombobox.Root>
  );
}
