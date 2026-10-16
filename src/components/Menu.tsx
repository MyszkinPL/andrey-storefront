import * as React from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { Menu as BaseMenu } from '@base-ui/react/menu';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger сохраняет `render`: это механизм композиции Base UI, а не оформление. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
type WithRef<Props, Element> = Props & { ref?: React.Ref<Element> };

/**
 * Единая галочка индикатора меню (Polar dropdown-menu: lucide `size-4`,
 * размер в DOM дополнительно закреплён правилом канонического пункта
 * (`.seal-popup-item svg`, см. `REUSE.md`).
 * Экспортируется, чтобы ContextMenu не повторял разметку и не расходился по виду.
 */
export function MenuIndicatorIcon() {
  return <Check size={16} aria-hidden />;
}

/** Единая стрелка вложенного меню — один вид для Menu, ContextMenu и Menubar. */
export function MenuSubmenuChevronIcon() {
  return <ChevronRight size={16} aria-hidden className="seal-menu-submenu-chevron" />;
}

export type MenuSide = 'top' | 'right' | 'bottom' | 'left';
export type MenuAlign = 'start' | 'center' | 'end';
export type MenuHandle<Payload = unknown> = BaseMenu.Handle<Payload>;
export type MenuRootState = BaseMenu.Root.State;
export type MenuRootActions = BaseMenu.Root.Actions;
export type MenuRootChangeEventReason = BaseMenu.Root.ChangeEventReason;
export type MenuRootChangeEventDetails = BaseMenu.Root.ChangeEventDetails;
export type MenuRootOrientation = BaseMenu.Root.Orientation;
export type MenuTriggerState = BaseMenu.Trigger.State;
export type MenuItemState = BaseMenu.Item.State;
export type MenuCheckboxItemState = BaseMenu.CheckboxItem.State;
export type MenuRadioItemState = BaseMenu.RadioItem.State;
export type MenuRadioGroupState = BaseMenu.RadioGroup.State;
export type MenuPositionerState = BaseMenu.Positioner.State;
export type MenuPopupState = BaseMenu.Popup.State;
export type MenuArrowState = BaseMenu.Arrow.State;
export type MenuSubmenuTriggerState = BaseMenu.SubmenuTrigger.State;

/** Handle для detached-триггеров (Base UI 1.8 `Menu.createHandle`). */
export const createMenuHandle = BaseMenu.createHandle;

export type MenuRootProps<Payload = unknown> = Sealed<BaseMenu.Root.Props<Payload>>;

export function MenuRoot<Payload = unknown>(props: MenuRootProps<Payload>) {
  return <BaseMenu.Root {...props} />;
}

export type MenuTriggerProps<Payload = unknown> = WithRef<
  SealedComposition<BaseMenu.Trigger.Props<Payload>>,
  HTMLElement
>;

export function MenuTrigger<Payload = unknown>({ children, ref, ...props }: MenuTriggerProps<Payload>) {
  return (
    <BaseMenu.Trigger {...props} ref={ref} className="seal-menu-trigger">
      {children}
    </BaseMenu.Trigger>
  );
}

export type MenuPortalProps = WithRef<Sealed<BaseMenu.Portal.Props>, HTMLDivElement>;

export function MenuPortal({ children, ref, ...props }: MenuPortalProps) {
  return (
    <BaseMenu.Portal {...props} ref={ref} className="seal-menu-portal">
      {children}
    </BaseMenu.Portal>
  );
}

export type MenuBackdropProps = WithRef<Sealed<BaseMenu.Backdrop.Props>, HTMLDivElement>;

export function MenuBackdrop({ ref, ...props }: MenuBackdropProps) {
  return <BaseMenu.Backdrop {...props} ref={ref} className="seal-popup-backdrop" />;
}

export type MenuPositionerProps = WithRef<Sealed<BaseMenu.Positioner.Props>, HTMLDivElement>;

export function MenuPositioner({ children, ref, sideOffset = 4, ...props }: MenuPositionerProps) {
  return (
    <BaseMenu.Positioner {...props} ref={ref} sideOffset={sideOffset} className="seal-popup-positioner">
      {children}
    </BaseMenu.Positioner>
  );
}

export type MenuPopupProps = WithRef<Sealed<BaseMenu.Popup.Props>, HTMLDivElement>;

export function MenuPopup({ children, ref, ...props }: MenuPopupProps) {
  return (
    <BaseMenu.Popup {...props} ref={ref} className="seal-popup seal-popup--menu">
      {children}
    </BaseMenu.Popup>
  );
}

export type MenuArrowProps = WithRef<Sealed<BaseMenu.Arrow.Props>, HTMLDivElement>;

export function MenuArrow({ ref, ...props }: MenuArrowProps) {
  return <BaseMenu.Arrow {...props} ref={ref} className="seal-popup-arrow" />;
}

export type MenuViewportProps = WithRef<Sealed<BaseMenu.Viewport.Props>, HTMLDivElement>;

export function MenuViewport({ children, ref, ...props }: MenuViewportProps) {
  return (
    <BaseMenu.Viewport {...props} ref={ref} className="seal-menu-viewport">
      {children}
    </BaseMenu.Viewport>
  );
}

/**
 * Пункт меню: полный набор пропсов Base UI 1.8 `Menu.Item` (label, closeOnClick,
 * onClick, disabled, id, …) плюс Polar-флаг `destructive` (красный пункт в ui/dropdown-menu).
 */
export type MenuItemProps = Sealed<BaseMenu.Item.Props> & { destructive?: boolean };

export function MenuItem({ children, destructive, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item className="seal-popup-item" data-destructive={destructive ? '' : undefined} {...props}>
      {children}
    </BaseMenu.Item>
  );
}

export type MenuLinkItemProps = WithRef<Sealed<BaseMenu.LinkItem.Props>, Element> & {
  href: string;
  'aria-label'?: string;
};

export function MenuLinkItem({ href, children, ref, ...props }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem {...props} ref={ref} href={href} className="seal-popup-item">
      {children}
    </BaseMenu.LinkItem>
  );
}

/** Пункт-флажок: полный набор пропсов Base UI 1.8 `Menu.CheckboxItem`. */
export type MenuCheckboxItemProps = Sealed<BaseMenu.CheckboxItem.Props>;

export function MenuCheckboxItem({ children, closeOnClick = false, ...props }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem className="seal-popup-item" closeOnClick={closeOnClick} {...props}>
      {children}
      <BaseMenu.CheckboxItemIndicator className="seal-popup-item-indicator">
        <MenuIndicatorIcon />
      </BaseMenu.CheckboxItemIndicator>
    </BaseMenu.CheckboxItem>
  );
}

/** Радио-группа меню: полный набор пропсов Base UI 1.8 `Menu.RadioGroup`. */
export type MenuRadioGroupProps = Sealed<BaseMenu.RadioGroup.Props>;

export function MenuRadioGroup({ children, ...props }: MenuRadioGroupProps) {
  return (
    <BaseMenu.RadioGroup className="seal-menu-radio-group" {...props}>
      {children}
    </BaseMenu.RadioGroup>
  );
}

/** Радио-пункт меню: полный набор пропсов Base UI 1.8 `Menu.RadioItem`. */
export type MenuRadioItemProps = Sealed<BaseMenu.RadioItem.Props>;

export function MenuRadioItem({ children, closeOnClick = false, ...props }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem className="seal-popup-item" closeOnClick={closeOnClick} {...props}>
      {children}
      <BaseMenu.RadioItemIndicator className="seal-popup-item-indicator">
        <MenuIndicatorIcon />
      </BaseMenu.RadioItemIndicator>
    </BaseMenu.RadioItem>
  );
}

export type MenuSeparatorProps = WithRef<Sealed<BaseMenu.Separator.Props>, HTMLDivElement>;

export function MenuSeparator({ ref, ...props }: MenuSeparatorProps) {
  return <BaseMenu.Separator {...props} ref={ref} className="seal-popup-separator" />;
}

/** Группа пунктов Base UI `Menu.Group`; `label` рендерится как `GroupLabel` поверх детей. */
export type MenuGroupProps = Sealed<BaseMenu.Group.Props> & { label?: ReactNode };

export function MenuGroup({ label, children, ...props }: MenuGroupProps) {
  return (
    <BaseMenu.Group className="seal-popup-group" {...props}>
      {label ? <MenuGroupLabel>{label}</MenuGroupLabel> : null}
      {children}
    </BaseMenu.Group>
  );
}

export type MenuGroupLabelProps = WithRef<Sealed<BaseMenu.GroupLabel.Props>, HTMLDivElement>;

export function MenuGroupLabel({ children, ref, ...props }: MenuGroupLabelProps) {
  return (
    <BaseMenu.GroupLabel {...props} ref={ref} className="seal-popup-group-label">
      {children}
    </BaseMenu.GroupLabel>
  );
}

export type MenuCheckboxItemIndicatorProps = WithRef<Sealed<BaseMenu.CheckboxItemIndicator.Props>, HTMLSpanElement>;

export function MenuCheckboxItemIndicator({ children = <MenuIndicatorIcon />, ref, ...props }: MenuCheckboxItemIndicatorProps) {
  return (
    <BaseMenu.CheckboxItemIndicator {...props} ref={ref} className="seal-menu-item-check">
      {children}
    </BaseMenu.CheckboxItemIndicator>
  );
}

export type MenuRadioItemIndicatorProps = WithRef<Sealed<BaseMenu.RadioItemIndicator.Props>, HTMLSpanElement>;

export function MenuRadioItemIndicator({ children = <MenuIndicatorIcon />, ref, ...props }: MenuRadioItemIndicatorProps) {
  return (
    <BaseMenu.RadioItemIndicator {...props} ref={ref} className="seal-menu-item-check">
      {children}
    </BaseMenu.RadioItemIndicator>
  );
}

/** `SubmenuRoot` в Base UI 1.8 объявлен без generics. */
export type MenuSubmenuRootProps = Sealed<BaseMenu.SubmenuRoot.Props>;

export function MenuSubmenuRoot(props: MenuSubmenuRootProps) {
  return <BaseMenu.SubmenuRoot {...props} />;
}

export type MenuSubmenuTriggerProps = WithRef<SealedComposition<BaseMenu.SubmenuTrigger.Props>, HTMLElement>;

export function MenuSubmenuTrigger({ children, ref, ...props }: MenuSubmenuTriggerProps) {
  return (
    <BaseMenu.SubmenuTrigger {...props} ref={ref} className="seal-popup-item seal-menu-submenu-trigger">
      {children}
      <MenuSubmenuChevronIcon />
    </BaseMenu.SubmenuTrigger>
  );
}

export type MenuSubmenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
};

/** Готовое подменю: пункт со стрелкой + вложенная Polar-панель. */
export function MenuSubmenu({ trigger, children, disabled, 'aria-label': ariaLabel }: MenuSubmenuProps) {
  return (
    <BaseMenu.SubmenuRoot>
      <MenuSubmenuTrigger disabled={disabled} aria-label={ariaLabel}>
        {trigger}
      </MenuSubmenuTrigger>
      <MenuPortal>
        <MenuPositioner align="start">
          <MenuPopup>{children}</MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </BaseMenu.SubmenuRoot>
  );
}

/** Все публичные части Base UI Menu 1.8 с Polar-оформлением. */
export const MenuParts = {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Portal: MenuPortal,
  Backdrop: MenuBackdrop,
  Positioner: MenuPositioner,
  Popup: MenuPopup,
  Arrow: MenuArrow,
  Viewport: MenuViewport,
  Item: MenuItem,
  LinkItem: MenuLinkItem,
  Separator: MenuSeparator,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  CheckboxItem: MenuCheckboxItem,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  RadioItemIndicator: MenuRadioItemIndicator,
  SubmenuRoot: MenuSubmenuRoot,
  SubmenuTrigger: MenuSubmenuTrigger,
  Submenu: MenuSubmenu,
};

export type MenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails: MenuRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  /** Модальность Base UI: блокирует прокрутку и клики вне меню (default true). */
  modal?: boolean;
  /** Открывать меню по наведению на триггер. */
  openOnHover?: boolean;
  /** Задержка открытия по наведению, мс (Base UI default 100). */
  delay?: number;
  /** Задержка закрытия меню, открытого по наведению, мс. */
  closeDelay?: number;
  /** Горизонтальное меню по стрелкам влево/вправо. */
  orientation?: MenuRootOrientation;
  /** Зацикливать клавиатурную навигацию (Base UI default true). */
  loopFocus?: boolean;
  /** Подсвечивать пункты при наведении курсора (Base UI default true). */
  highlightItemOnHover?: boolean;
  /** В подменю: Esc закрывает всё меню, а не только текущий уровень (Base UI default false). */
  closeParentOnEsc?: boolean;
  /** Императивные действия меню: `unmount`, `close` (Base UI `Menu.Root.actionsRef`). */
  actionsRef?: React.RefObject<MenuRootActions | null>;
  /** id триггера для связки с контролируемым меню (Base UI `Menu.Root.triggerId`). */
  triggerId?: string | null;
  /** id триггера для изначально открытого меню (Base UI `Menu.Root.defaultTriggerId`). */
  defaultTriggerId?: string | null;
  /** Handle внешнего (detached) триггера (`createMenuHandle`). */
  handle?: MenuHandle;
  disabled?: boolean;
  side?: MenuSide;
  align?: MenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  'aria-label'?: string;
};

/**
 * Меню-дропдаун (Base UI Menu) в Polar-стиле ui/dropdown-menu: панель
 * popover-поверхности, radius-md, p-1, тень md, item px-2 py-1.5.
 *
 * Оформление — канонические классы `seal-popup`, `seal-popup--menu`, `seal-popup-item`
 * (единый контракт панелей, см. `REUSE.md`), а не собственное семейство `seal-menu-*`.
 * Своими остаются только триггер/портал/viewport/radio-group и дельта подменю-пункта:
 * канон их не покрывает.
 */
export function Menu({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  modal,
  openOnHover,
  delay,
  closeDelay,
  orientation,
  loopFocus,
  highlightItemOnHover,
  closeParentOnEsc,
  actionsRef,
  triggerId,
  defaultTriggerId,
  handle,
  disabled,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  alignOffset,
  'aria-label': ariaLabel,
}: MenuProps) {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (value, eventDetails) => onOpenChange(value, eventDetails) : undefined}
      onOpenChangeComplete={onOpenChangeComplete}
      modal={modal}
      orientation={orientation}
      loopFocus={loopFocus}
      highlightItemOnHover={highlightItemOnHover}
      closeParentOnEsc={closeParentOnEsc}
      actionsRef={actionsRef}
      triggerId={triggerId}
      defaultTriggerId={defaultTriggerId}
      handle={handle}
      disabled={disabled}
    >
      <BaseMenu.Trigger
        className="seal-menu-trigger"
        aria-label={ariaLabel}
        openOnHover={openOnHover}
        delay={delay}
        closeDelay={closeDelay}
        render={trigger as never}
      >
        {null}
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset}>
          <BaseMenu.Popup className="seal-popup seal-popup--menu">{children}</BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
