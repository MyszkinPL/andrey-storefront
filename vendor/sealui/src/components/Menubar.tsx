import * as React from 'react';
import type { ReactNode } from 'react';
import { Menubar as BaseMenubar } from '@base-ui/react/menubar';
import { Menu as BaseMenu } from '@base-ui/react/menu';
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
  MenuRoot,
  MenuSeparator,
  MenuSubmenu,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuViewport,
} from './Menu';
import type {
  MenuBackdropProps,
  MenuCheckboxItemIndicatorProps,
  MenuCheckboxItemProps,
  MenuGroupLabelProps,
  MenuGroupProps,
  MenuItemProps,
  MenuLinkItemProps,
  MenuRadioGroupProps,
  MenuRadioItemIndicatorProps,
  MenuSeparatorProps,
  MenuSubmenuProps,
  MenuViewportProps,
} from './Menu';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger сохраняет `render`: в Base UI это механизм композиции. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
/** Запечатанные пропсы части + ref на её элемент. */
type Styled<Props, Element> = Sealed<Props> & { ref?: React.Ref<Element> };

/**
 * Base UI 1.8 Menubar — контейнер для нескольких меню (как в desktop-приложении).
 * Polar-референса нет, поэтому панель оформлена в Polar-языке: surface-raised,
 * radius-lg, триггеры — ghost-кнопки 32px как `Toolbar`.
 *
 * Панель, позиционер и стрелка берутся из `Menu`, поэтому у дропдауна, контекстного
 * меню и менюбара один и тот же popup/arrow — без второй копии этих частей.
 */
export type MenubarProps = Styled<BaseMenubar.Props, HTMLDivElement>;
export type MenubarMenuProps = Sealed<BaseMenu.Root.Props>;
export type MenubarTriggerProps = Styled<SealedComposition<BaseMenu.Trigger.Props>, HTMLButtonElement>;
export type MenubarPortalProps = Styled<BaseMenu.Portal.Props, HTMLDivElement>;
export type MenubarPositionerProps = Styled<BaseMenu.Positioner.Props, HTMLDivElement>;
export type MenubarPopupProps = Styled<BaseMenu.Popup.Props, HTMLDivElement>;
export type MenubarArrowProps = Styled<BaseMenu.Arrow.Props, HTMLDivElement>;
export type MenubarBackdropProps = MenuBackdropProps;
export type MenubarSeparatorProps = MenuSeparatorProps;

export function Menubar({ children, ref, orientation = 'horizontal', ...props }: MenubarProps) {
  return (
    <BaseMenubar {...props} ref={ref} orientation={orientation} className="seal-menubar">
      {children}
    </BaseMenubar>
  );
}

/** Одно меню внутри полосы: ровно `Menu.Root` — одна реализация на всё семейство. */
export function MenubarMenu(props: MenubarMenuProps) {
  return <MenuRoot {...props} />;
}

export function MenubarTrigger({ children, ...props }: MenubarTriggerProps) {
  return (
    <BaseMenu.Trigger {...props} className="seal-menubar-trigger">
      {children}
    </BaseMenu.Trigger>
  );
}

/** Портал — та же часть `Menu`, без второй копии обёртки. */
export function MenubarPortal({ children, ref, ...props }: MenubarPortalProps) {
  return (
    <MenuPortal {...props} ref={ref}>
      {children}
    </MenuPortal>
  );
}

/** Панель меню менюбара — та же Polar-панель, что у `Menu`. */
export function MenubarPositioner({ children, ref, ...props }: MenubarPositionerProps) {
  return (
    <MenuPositioner {...props} ref={ref}>
      {children}
    </MenuPositioner>
  );
}

/** Панель меню менюбара — та же Polar-панель, что у `Menu`. */
export function MenubarPopup({ children, ref, ...props }: MenubarPopupProps) {
  return (
    <MenuPopup {...props} ref={ref}>
      {children}
    </MenuPopup>
  );
}

/** Стрелка панели — одна реализация на всё меню-семейство (`Menu`). */
export function MenubarArrow({ ref, ...props }: MenubarArrowProps) {
  return <MenuArrow {...props} ref={ref} />;
}

/** Бэкдроп меню (Base UI anatomy: `Menu.Portal` → `Menu.Backdrop`) — та же часть `Menu`. */
export function MenubarBackdrop({ ref, ...props }: MenubarBackdropProps) {
  return <MenuBackdrop {...props} ref={ref} />;
}

export function MenubarSeparator(props: MenubarSeparatorProps) {
  return <MenuSeparator {...props} />;
}

export type MenubarMenuButtonProps = {
  label: ReactNode;
  children: ReactNode;
  disabled?: boolean;
};

/**
 * Готовое меню полосы: триггер + портал + панель.
 * `disabled` уходит в `Menu.Root` — ровно так документирует `menubar.md`
 * (`<Menu.Root disabled>…</Menu.Root>` отключает меню целиком).
 */
export function MenubarMenuButton({ label, children, disabled }: MenubarMenuButtonProps) {
  return (
    <MenubarMenu disabled={disabled}>
      <MenubarTrigger>{label}</MenubarTrigger>
      <MenubarPortal>
        <MenubarPositioner>
          <MenubarPopup>{children}</MenubarPopup>
        </MenubarPositioner>
      </MenubarPortal>
    </MenubarMenu>
  );
}

/* Пункты менюбара — ровно части `Menu`: одна разметка, один вид, ноль копий. */
export {
  MenuItem as MenubarItem,
  MenuLinkItem as MenubarLinkItem,
  MenuCheckboxItem as MenubarCheckboxItem,
  MenuCheckboxItemIndicator as MenubarCheckboxItemIndicator,
  MenuRadioGroup as MenubarRadioGroup,
  MenuRadioItem as MenubarRadioItem,
  MenuRadioItemIndicator as MenubarRadioItemIndicator,
  MenuGroup as MenubarGroup,
  MenuGroupLabel as MenubarGroupLabel,
  MenuSubmenu as MenubarSubmenu,
  MenuSubmenuRoot as MenubarSubmenuRoot,
  MenuSubmenuTrigger as MenubarSubmenuTrigger,
  MenuViewport as MenubarViewport,
};
export type {
  MenuItemProps as MenubarItemProps,
  MenuLinkItemProps as MenubarLinkItemProps,
  MenuCheckboxItemProps as MenubarCheckboxItemProps,
  MenuCheckboxItemIndicatorProps as MenubarCheckboxItemIndicatorProps,
  MenuRadioGroupProps as MenubarRadioGroupProps,
  MenuRadioItemIndicatorProps as MenubarRadioItemIndicatorProps,
  MenuGroupProps as MenubarGroupProps,
  MenuGroupLabelProps as MenubarGroupLabelProps,
  MenuSubmenuProps as MenubarSubmenuProps,
  MenuViewportProps as MenubarViewportProps,
};

/** Все публичные части Base UI Menubar + Menu 1.8 в Polar-стиле. */
export const MenubarParts = {
  Root: Menubar,
  Menu: MenubarMenu,
  Trigger: MenubarTrigger,
  Portal: MenubarPortal,
  Positioner: MenubarPositioner,
  Popup: MenubarPopup,
  Arrow: MenubarArrow,
  Backdrop: MenubarBackdrop,
  Viewport: MenuViewport,
  Item: MenuItem,
  LinkItem: MenuLinkItem,
  CheckboxItem: MenuCheckboxItem,
  CheckboxItemIndicator: MenuCheckboxItemIndicator,
  RadioGroup: MenuRadioGroup,
  RadioItem: MenuRadioItem,
  RadioItemIndicator: MenuRadioItemIndicator,
  Group: MenuGroup,
  GroupLabel: MenuGroupLabel,
  Separator: MenuSeparator,
  Submenu: MenuSubmenu,
  SubmenuRoot: MenuSubmenuRoot,
  SubmenuTrigger: MenuSubmenuTrigger,
};
