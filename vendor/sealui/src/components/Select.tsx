import * as React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Sealed<Props> & { ref?: React.Ref<Element> };

/**
 * Панель/список/пункты/разделители Select, Combobox и Autocomplete — единый
 * канон SEAL POPUP (`.seal-popup*`): одна панель пикеров на три компонента,
 * см. `REUSE.md`. Свои классы остаются только у частей с другой семантикой:
 * `seal-select-trigger`, `seal-select-value`, `seal-select-icon`,
 * `seal-select-label`; индикатор слева — модификаторы
 * `seal-popup-item--indicator-start` / `seal-popup-item-indicator--start`.
 */

/** Root behavior props are Base UI 1.8's complete API; styling escape hatches stay sealed. */
export type SelectRootProps<Value, Multiple extends boolean | undefined = false> = Sealed<
  BaseSelect.Root.Props<Value, Multiple>
>;
export type SelectLabelProps = WithRef<BaseSelect.Label.Props, HTMLDivElement>;
export type SelectTriggerProps = WithRef<BaseSelect.Trigger.Props, HTMLButtonElement>;
export type SelectValueProps = WithRef<BaseSelect.Value.Props, HTMLSpanElement>;
export type SelectIconProps = WithRef<BaseSelect.Icon.Props, HTMLSpanElement>;
export type SelectPortalProps = WithRef<BaseSelect.Portal.Props, HTMLDivElement>;
export type SelectBackdropProps = WithRef<BaseSelect.Backdrop.Props, HTMLDivElement>;
export type SelectPositionerProps = WithRef<BaseSelect.Positioner.Props, HTMLDivElement>;
export type SelectPopupProps = WithRef<BaseSelect.Popup.Props, HTMLDivElement>;
export type SelectListProps = WithRef<BaseSelect.List.Props, HTMLDivElement>;
export type SelectItemProps = WithRef<BaseSelect.Item.Props, HTMLElement>;
export type SelectItemIndicatorProps = WithRef<BaseSelect.ItemIndicator.Props, HTMLSpanElement>;
export type SelectItemTextProps = WithRef<BaseSelect.ItemText.Props, HTMLDivElement>;
export type SelectArrowProps = WithRef<BaseSelect.Arrow.Props, HTMLDivElement>;
export type SelectScrollUpArrowProps = WithRef<BaseSelect.ScrollUpArrow.Props, HTMLDivElement>;
export type SelectScrollDownArrowProps = WithRef<BaseSelect.ScrollDownArrow.Props, HTMLDivElement>;
export type SelectGroupProps = WithRef<BaseSelect.Group.Props, HTMLDivElement>;
export type SelectGroupLabelProps = WithRef<BaseSelect.GroupLabel.Props, HTMLDivElement>;
export type SelectSeparatorProps = WithRef<BaseSelect.Separator.Props, HTMLDivElement>;

export function SelectRoot<Value, Multiple extends boolean | undefined = false>(props: SelectRootProps<Value, Multiple>) {
  return <BaseSelect.Root {...props} />;
}

export function SelectLabel({ children, ref, ...props }: SelectLabelProps) {
  return <BaseSelect.Label {...props} ref={ref} className="seal-select-label">{children}</BaseSelect.Label>;
}
export function SelectTrigger({ children, ref, ...props }: SelectTriggerProps) {
  return <BaseSelect.Trigger {...props} ref={ref} className="seal-input seal-select-trigger">{children}</BaseSelect.Trigger>;
}
export function SelectValue({ ref, ...props }: SelectValueProps) {
  return <BaseSelect.Value {...props} ref={ref} className="seal-select-value" />;
}
export function SelectIcon({ children, ref, ...props }: SelectIconProps) {
  return <BaseSelect.Icon {...props} ref={ref} className="seal-select-icon">{children ?? <ChevronDown size={16} aria-hidden="true" />}</BaseSelect.Icon>;
}
export function SelectPortal({ children, ref, ...props }: SelectPortalProps) {
  return <BaseSelect.Portal {...props} ref={ref} className="seal-combobox-portal">{children}</BaseSelect.Portal>;
}
export function SelectBackdrop({ ref, ...props }: SelectBackdropProps) {
  return <BaseSelect.Backdrop {...props} ref={ref} className="seal-popup-backdrop" />;
}
/** Polar-style dropdown: popup opens below the trigger. Base UI's default
 * `alignItemWithTrigger` overlays the popup onto the trigger, so sealui turns it
 * off unless a caller explicitly opts back into Base UI behavior. */
export function SelectPositioner({ children, ref, sideOffset = 4, alignItemWithTrigger = false, ...props }: SelectPositionerProps) {
  return <BaseSelect.Positioner {...props} ref={ref} sideOffset={sideOffset} alignItemWithTrigger={alignItemWithTrigger} className="seal-popup-positioner">{children}</BaseSelect.Positioner>;
}
export function SelectPopup({ children, ref, ...props }: SelectPopupProps) {
  return <BaseSelect.Popup {...props} ref={ref} className="seal-popup seal-popup--pickers">{children}</BaseSelect.Popup>;
}
export function SelectList({ children, ref, ...props }: SelectListProps) {
  return <BaseSelect.List {...props} ref={ref} className="seal-popup-list">{children}</BaseSelect.List>;
}
export function SelectItem({ children, ref, ...props }: SelectItemProps) {
  return <BaseSelect.Item {...props} ref={ref} className="seal-popup-item seal-popup-item--indicator-start">{children}</BaseSelect.Item>;
}
export function SelectItemIndicator({children = <Check size={16} aria-hidden="true" />, ref, ...props}: SelectItemIndicatorProps) {
  return <BaseSelect.ItemIndicator {...props} ref={ref} className="seal-popup-item-indicator seal-popup-item-indicator--start">{children}</BaseSelect.ItemIndicator>;
}
export function SelectItemText({ children, ref, ...props }: SelectItemTextProps) {
  return <BaseSelect.ItemText {...props} ref={ref} className="seal-popup-item-content">{children}</BaseSelect.ItemText>;
}
export function SelectArrow({ children, ref, ...props }: SelectArrowProps) {
  return <BaseSelect.Arrow {...props} ref={ref} className="seal-popup-arrow">{children}</BaseSelect.Arrow>;
}
export function SelectScrollUpArrow({children = <ChevronUp size={16} aria-hidden="true" />, ref, ...props}: SelectScrollUpArrowProps) {
  return <BaseSelect.ScrollUpArrow {...props} ref={ref} className="seal-popup-scroll-arrow">{children}</BaseSelect.ScrollUpArrow>;
}
export function SelectScrollDownArrow({children = <ChevronDown size={16} aria-hidden="true" />, ref, ...props}: SelectScrollDownArrowProps) {
  return <BaseSelect.ScrollDownArrow {...props} ref={ref} className="seal-popup-scroll-arrow">{children}</BaseSelect.ScrollDownArrow>;
}
export function SelectGroup({ children, ref, ...props }: SelectGroupProps) {
  return <BaseSelect.Group {...props} ref={ref} className="seal-popup-group">{children}</BaseSelect.Group>;
}
export function SelectGroupLabel({ children, ref, ...props }: SelectGroupLabelProps) {
  return <BaseSelect.GroupLabel {...props} ref={ref} className="seal-popup-group-label">{children}</BaseSelect.GroupLabel>;
}
export function SelectSeparator({ ref, ...props }: SelectSeparatorProps) {
  return <BaseSelect.Separator {...props} ref={ref} className="seal-popup-separator" />;
}

/** All public Base UI Select parts, with Polar styling and no className/style/render escape hatch. */
export const SelectParts = {
  Root: SelectRoot,
  Label: SelectLabel,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Icon: SelectIcon,
  Portal: SelectPortal,
  Backdrop: SelectBackdrop,
  Positioner: SelectPositioner,
  Popup: SelectPopup,
  List: SelectList,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  ItemText: SelectItemText,
  Arrow: SelectArrow,
  ScrollUpArrow: SelectScrollUpArrow,
  ScrollDownArrow: SelectScrollDownArrow,
  Group: SelectGroup,
  GroupLabel: SelectGroupLabel,
  Separator: SelectSeparator,
};

export type SelectOption = { value: string; label: React.ReactNode; disabled?: boolean };
export type SelectProps = Omit<SelectRootProps<string, false>, 'children' | 'items' | 'multiple'> & {
  options: ReadonlyArray<SelectOption>;
  placeholder?: React.ReactNode;
};

/** Ready-made single-select composition; use SelectParts for grouped and multiple selections. */
export function Select({ options, placeholder = 'Select…', ...rootProps }: SelectProps) {
  return (
    <SelectRoot items={options} {...rootProps}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
        <SelectIcon />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectScrollUpArrow />
            <SelectList>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                  <SelectItemIndicator />
                  <SelectItemText>{option.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectList>
            <SelectScrollDownArrow />
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </SelectRoot>
  );
}

export type SelectChangeEventDetails = BaseSelect.Root.ChangeEventDetails;
export type SelectChangeEventReason = BaseSelect.Root.ChangeEventReason;
export type SelectItemState = BaseSelect.Item.State;
export type SelectTriggerState = BaseSelect.Trigger.State;
export type SelectValueState = BaseSelect.Value.State;
export type SelectPositionerState = BaseSelect.Positioner.State;
export type SelectPopupState = BaseSelect.Popup.State;
export type SelectRootState = BaseSelect.Root.State;
export type SelectRootActions = BaseSelect.Root.Actions;
export type SelectIconState = BaseSelect.Icon.State;
export type SelectPortalState = BaseSelect.Portal.State;
export type SelectBackdropState = BaseSelect.Backdrop.State;
export type SelectListState = BaseSelect.List.State;
export type SelectItemIndicatorState = BaseSelect.ItemIndicator.State;
export type SelectItemTextState = BaseSelect.ItemText.State;
export type SelectArrowState = BaseSelect.Arrow.State;
export type SelectScrollUpArrowState = BaseSelect.ScrollUpArrow.State;
export type SelectScrollDownArrowState = BaseSelect.ScrollDownArrow.State;
export type SelectGroupState = BaseSelect.Group.State;
export type SelectGroupLabelState = BaseSelect.GroupLabel.State;
export type SelectSeparatorState = BaseSelect.Separator.State;
