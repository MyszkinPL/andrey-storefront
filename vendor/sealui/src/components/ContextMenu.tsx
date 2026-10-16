import * as React from 'react';
import type { ReactNode } from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import {
  MenuArrow,
  MenuBackdrop,
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuLinkItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuSeparator,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
} from './Menu';
import type {
  MenuArrowProps,
  MenuBackdropProps,
  MenuCheckboxItemIndicatorProps,
  MenuCheckboxItemProps,
  MenuGroupLabelProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuPopupProps,
  MenuPortalProps,
  MenuRadioGroupProps,
  MenuRadioItemIndicatorProps,
  MenuRadioItemProps,
  MenuSeparatorProps,
  MenuSubmenuRootProps,
  MenuSubmenuTriggerProps,
} from './Menu';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger сохраняет `render` — это механизм композиции Base UI, не оформление. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
type Styled<Props, Element> = Props & { ref?: React.Ref<Element> };

/**
 * Base UI 1.8 ContextMenu — меню по правому клику / долгому нажатию.
 *
 * Переиспользование вместо копий (доказательство — `@base-ui/react/context-menu/index.parts.d.ts`):
 * ContextMenu отдаёт `Backdrop`, `Portal`, `Popup`, `Arrow`, `Group`, `GroupLabel`, `Item`,
 * `LinkItem`, `CheckboxItem`, `CheckboxItemIndicator`, `RadioGroup`, `RadioItem`,
 * `RadioItemIndicator`, `Separator`, `SubmenuRoot`, `SubmenuTrigger` **теми же объектами**,
 * что и Menu (все они импортируются из `../menu/*`), а `context-menu/index.d.ts` реэкспортирует
 * и их типы пропсов (`export type { MenuItemProps as ContextMenuItemProps … }`).
 * Свои у ContextMenu только `Root`, `Trigger` и `Positioner` — они ниже.
 * Поэтому пункты/панель/индикаторы берём из `Menu`: у дропдауна и контекстного меню
 * один источник правды и по разметке, и по каноническому `seal-popup*`-оформлению (`REUSE.md`).
 * `Viewport` у ContextMenu не существует (в `index.parts.d.ts` его нет) — не экспортируем.
 */

export type ContextMenuSide = NonNullable<BaseContextMenu.Positioner.Props['side']>;
export type ContextMenuAlign = NonNullable<BaseContextMenu.Positioner.Props['align']>;

export type ContextMenuRootProps = Sealed<BaseContextMenu.Root.Props>;
export type ContextMenuTriggerProps = Styled<SealedComposition<BaseContextMenu.Trigger.Props>, HTMLDivElement>;
export type ContextMenuPositionerProps = Styled<BaseContextMenu.Positioner.Props, HTMLDivElement>;

export function ContextMenuRoot(props: ContextMenuRootProps) {
  return <BaseContextMenu.Root {...props} />;
}

export function ContextMenuTrigger({ children, ref, ...props }: ContextMenuTriggerProps) {
  return (
    <BaseContextMenu.Trigger {...props} ref={ref} className="seal-context-menu-trigger">
      {children}
    </BaseContextMenu.Trigger>
  );
}

export function ContextMenuPositioner({ children, ref, sideOffset = 4, ...props }: ContextMenuPositionerProps) {
  return (
    <BaseContextMenu.Positioner {...props} ref={ref} sideOffset={sideOffset} className="seal-popup-positioner">
      {children}
    </BaseContextMenu.Positioner>
  );
}

/* Остальные части — ровно те же компоненты Base UI, что у Menu.
   Это локальные константы, а не `export { MenuX as ContextMenuX }`:
   форма реэкспорта не создаёт локального имени, и композиции ниже
   (`ContextMenu`, `ContextMenuSubmenu`, `ContextMenuParts`) не видели бы части. */

export const ContextMenuArrow = MenuArrow;
export const ContextMenuBackdrop = MenuBackdrop;
export const ContextMenuCheckboxItem = MenuCheckboxItem;
export const ContextMenuCheckboxItemIndicator = MenuCheckboxItemIndicator;
export const ContextMenuGroup = MenuGroup;
export const ContextMenuGroupLabel = MenuGroupLabel;
export const ContextMenuItem = MenuItem;
export const ContextMenuLinkItem = MenuLinkItem;
export const ContextMenuPopup = MenuPopup;
export const ContextMenuPortal = MenuPortal;
export const ContextMenuRadioGroup = MenuRadioGroup;
export const ContextMenuRadioItem = MenuRadioItem;
export const ContextMenuRadioItemIndicator = MenuRadioItemIndicator;
export const ContextMenuSeparator = MenuSeparator;
export const ContextMenuSubmenuRoot = MenuSubmenuRoot;
export const ContextMenuSubmenuTrigger = MenuSubmenuTrigger;

export type ContextMenuArrowProps = MenuArrowProps;
export type ContextMenuBackdropProps = MenuBackdropProps;
export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps;
export type ContextMenuCheckboxItemIndicatorProps = MenuCheckboxItemIndicatorProps;
export type ContextMenuGroupProps = MenuGroupProps;
export type ContextMenuGroupLabelProps = MenuGroupLabelProps;
export type ContextMenuItemProps = MenuItemProps;
export type ContextMenuLinkItemProps = MenuLinkItemProps;
export type ContextMenuPopupProps = MenuPopupProps;
export type ContextMenuPortalProps = MenuPortalProps;
export type ContextMenuRadioGroupProps = MenuRadioGroupProps;
export type ContextMenuRadioItemProps = MenuRadioItemProps;
export type ContextMenuRadioItemIndicatorProps = MenuRadioItemIndicatorProps;
export type ContextMenuSeparatorProps = MenuSeparatorProps;
export type ContextMenuSubmenuRootProps = MenuSubmenuRootProps;
export type ContextMenuSubmenuTriggerProps = MenuSubmenuTriggerProps;

/** Красный пункт сеalui (Polar `destructive`) — тот же пункт с флагом. */
export function ContextMenuDestructiveItem(props: ContextMenuItemProps) {
  return <MenuItem {...props} destructive />;
}

export type ContextMenuProps = ContextMenuRootProps & {
  /** Содержимое области, на которой срабатывает правый клик. */
  trigger: ReactNode;
  /** Пункты меню (обычно ContextMenuGroup / ContextMenuItem / …). */
  children: ReactNode;
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
  arrow?: boolean;
};

/** Готовое меню: область правого клика + позиционированная панель. */
export function ContextMenu({
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 4,
  arrow,
  ...rootProps
}: ContextMenuProps) {
  return (
    <ContextMenuRoot {...rootProps}>
      <ContextMenuTrigger>{trigger}</ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuPositioner side={side} align={align} sideOffset={sideOffset}>
          <ContextMenuPopup>
            {arrow ? <ContextMenuArrow /> : null}
            {children}
          </ContextMenuPopup>
        </ContextMenuPositioner>
      </ContextMenuPortal>
    </ContextMenuRoot>
  );
}

export type ContextMenuSubmenuProps = {
  label: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  openOnHover?: boolean;
  delay?: number;
  closeDelay?: number;
};

/** Вложенное меню: пункт-родитель + собственная панель (части Menu). */
export function ContextMenuSubmenu({ label, children, disabled, openOnHover, delay, closeDelay }: ContextMenuSubmenuProps) {
  return (
    <ContextMenuSubmenuRoot>
      <ContextMenuSubmenuTrigger disabled={disabled} openOnHover={openOnHover} delay={delay} closeDelay={closeDelay}>
        {label}
      </ContextMenuSubmenuTrigger>
      <ContextMenuPortal>
        <MenuPositioner alignOffset={-4} sideOffset={-4}>
          <ContextMenuPopup>{children}</ContextMenuPopup>
        </MenuPositioner>
      </ContextMenuPortal>
    </ContextMenuSubmenuRoot>
  );
}

/** Все публичные части Base UI ContextMenu 1.8 в Polar-стиле (общие с Menu). */
export const ContextMenuParts = {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Positioner: ContextMenuPositioner,
  Portal: ContextMenuPortal,
  Backdrop: ContextMenuBackdrop,
  Popup: ContextMenuPopup,
  Arrow: ContextMenuArrow,
  Group: ContextMenuGroup,
  GroupLabel: ContextMenuGroupLabel,
  Item: ContextMenuItem,
  DestructiveItem: ContextMenuDestructiveItem,
  LinkItem: ContextMenuLinkItem,
  CheckboxItem: ContextMenuCheckboxItem,
  CheckboxItemIndicator: ContextMenuCheckboxItemIndicator,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  RadioItemIndicator: ContextMenuRadioItemIndicator,
  Separator: ContextMenuSeparator,
  SubmenuRoot: ContextMenuSubmenuRoot,
  SubmenuTrigger: ContextMenuSubmenuTrigger,
  Submenu: ContextMenuSubmenu,
};
