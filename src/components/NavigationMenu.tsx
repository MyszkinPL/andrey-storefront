import * as React from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { NavigationMenu as BaseNavigationMenu } from '@base-ui/react/navigation-menu';
import { Text } from './Text';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/**
 * Item/Trigger/Content/Link сохраняют `render`: в Base UI это штатная
 * композиция (пункт-ссылка `<a>`, кастомный элемент) — `NavigationMenu.Trigger
 * render={<a href="…" />}` документирован в navigation-menu.md.
 */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;

/**
 * Base UI 1.8 NavigationMenu — полоса навигации со всплывающими панелями.
 * Polar-референс `orbit/Subnav`: text-secondary → hover/active text-primary.
 * Панель — каноническая поверхность `seal-popup` + `seal-popup-positioner` (`REUSE.md`);
 * собственные размеры позиционера, hover-bridge и слайд по `data-activation-direction`
 * остаются дельтами `seal-navigation-menu-positioner/-popup` (канон их не покрывает).
 */
export type NavigationMenuRootProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Root>>;
export type NavigationMenuListProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.List>>;
export type NavigationMenuItemProps = SealedComposition<React.ComponentProps<typeof BaseNavigationMenu.Item>>;
export type NavigationMenuTriggerProps = SealedComposition<React.ComponentProps<typeof BaseNavigationMenu.Trigger>>;
export type NavigationMenuIconProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Icon>>;
export type NavigationMenuContentProps = SealedComposition<React.ComponentProps<typeof BaseNavigationMenu.Content>>;
export type NavigationMenuLinkProps = SealedComposition<React.ComponentProps<typeof BaseNavigationMenu.Link>>;
export type NavigationMenuPortalProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Portal>>;
export type NavigationMenuBackdropProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Backdrop>>;
export type NavigationMenuPositionerProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Positioner>>;
export type NavigationMenuPopupProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Popup>>;
export type NavigationMenuArrowProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Arrow>>;
export type NavigationMenuViewportProps = Sealed<React.ComponentProps<typeof BaseNavigationMenu.Viewport>>;

export function NavigationMenuRoot({ children, orientation = 'horizontal', ...props }: NavigationMenuRootProps) {
  return (
    <BaseNavigationMenu.Root {...props} orientation={orientation} className="seal-navigation-menu">
      {children}
    </BaseNavigationMenu.Root>
  );
}

export function NavigationMenuList({ children, ...props }: NavigationMenuListProps) {
  return (
    <BaseNavigationMenu.List {...props} className="seal-navigation-menu-list">
      {children}
    </BaseNavigationMenu.List>
  );
}

export function NavigationMenuItem({ children, ...props }: NavigationMenuItemProps) {
  return (
    <BaseNavigationMenu.Item {...props} className="seal-navigation-menu-item">
      {children}
    </BaseNavigationMenu.Item>
  );
}

export function NavigationMenuTrigger({ children, ...props }: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger {...props} className="seal-navigation-menu-trigger">
      {children}
    </BaseNavigationMenu.Trigger>
  );
}

export function NavigationMenuIcon({ children, ...props }: NavigationMenuIconProps) {
  return (
    <BaseNavigationMenu.Icon className="seal-navigation-menu-icon" {...props}>
      {children ?? <ChevronDown size={16} aria-hidden />}
    </BaseNavigationMenu.Icon>
  );
}

export function NavigationMenuContent({ children, ...props }: NavigationMenuContentProps) {
  return (
    <BaseNavigationMenu.Content {...props} className="seal-navigation-menu-content">
      {children}
    </BaseNavigationMenu.Content>
  );
}

export function NavigationMenuLink({ children, ...props }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link {...props} className="seal-navigation-menu-link">
      {children}
    </BaseNavigationMenu.Link>
  );
}

export function NavigationMenuPortal({ children, ...props }: NavigationMenuPortalProps) {
  return <BaseNavigationMenu.Portal {...props}>{children}</BaseNavigationMenu.Portal>;
}

export function NavigationMenuBackdrop(props: NavigationMenuBackdropProps) {
  return <BaseNavigationMenu.Backdrop {...props} className="seal-popup-backdrop" />;
}

export function NavigationMenuPositioner({ children, sideOffset = 10, ...props }: NavigationMenuPositionerProps) {
  return (
    <BaseNavigationMenu.Positioner {...props} sideOffset={sideOffset} className="seal-popup-positioner seal-navigation-menu-positioner">
      {children}
    </BaseNavigationMenu.Positioner>
  );
}

export function NavigationMenuPopup({ children, ...props }: NavigationMenuPopupProps) {
  return (
    <BaseNavigationMenu.Popup {...props} className="seal-popup seal-navigation-menu-popup">
      {children}
    </BaseNavigationMenu.Popup>
  );
}

export function NavigationMenuArrow(props: NavigationMenuArrowProps) {
  // Стрелка — общая реализация меню-семейства (`Menu`), а не вторая копия геометрии.
  return <BaseNavigationMenu.Arrow {...props} className="seal-popup-arrow" />;
}

export function NavigationMenuViewport(props: NavigationMenuViewportProps) {
  return <BaseNavigationMenu.Viewport {...props} className="seal-popup-viewport seal-navigation-menu-viewport" />;
}

/** Список карточек-ссылок внутри панели. */
export function NavigationMenuLinkList({ children, layout = 'grid' }: { children: ReactNode; layout?: 'grid' | 'column' }) {
  return (
    <ul className="seal-navigation-menu-link-list" data-layout={layout}>
      {children}
    </ul>
  );
}

export function NavigationMenuLinkItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

/** Заголовок карточки-ссылки: типографика sealui `Text` (Polar createText). */
export function NavigationMenuLinkTitle({ children }: { children: ReactNode }) {
  return (
    <Text as="h3" size="sm">
      {children}
    </Text>
  );
}

/** Описание карточки-ссылки: тон secondary из sealui `Text` (Polar text-secondary). */
export function NavigationMenuLinkDescription({ children }: { children: ReactNode }) {
  return (
    <Text as="p" size="sm" tone="secondary">
      {children}
    </Text>
  );
}

export type NavigationMenuLinkCard = {
  href: string;
  title: string;
  description?: string;
  active?: boolean;
};

export type NavigationMenuSection = {
  label: string;
  value?: string;
  links: NavigationMenuLinkCard[];
};

export type NavigationMenuBarProps = {
  /** Разделы-меню полосы. */
  sections: NavigationMenuSection[];
  /** Готовые ссылки-пункты (без панели) в конце полосы; оборачиваются в `NavigationMenu.Item`. */
  actions?: ReactNode;
  'aria-label'?: string;
};

/** Готовая полоса навигации: разделы с карточками ссылок + панель. */
export function NavigationMenuBar({ sections, actions, 'aria-label': ariaLabel = 'Main' }: NavigationMenuBarProps) {
  return (
    <NavigationMenuRoot aria-label={ariaLabel}>
      <NavigationMenuList>
        {sections.map((section) => (
          <NavigationMenuItem key={section.label} value={section.value}>
            <NavigationMenuTrigger>
              {section.label}
              <NavigationMenuIcon />
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLinkList layout="grid">
                {section.links.map((link) => (
                  <NavigationMenuLinkItem key={link.href}>
                    <NavigationMenuLink href={link.href} active={link.active}>
                      <NavigationMenuLinkTitle>{link.title}</NavigationMenuLinkTitle>
                      {link.description ? (
                        <NavigationMenuLinkDescription>{link.description}</NavigationMenuLinkDescription>
                      ) : null}
                    </NavigationMenuLink>
                  </NavigationMenuLinkItem>
                ))}
              </NavigationMenuLinkList>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ))}
        {actions ? <NavigationMenuItem>{actions}</NavigationMenuItem> : null}
      </NavigationMenuList>
      <NavigationMenuPortal>
        <NavigationMenuBackdrop />
        <NavigationMenuPositioner>
          <NavigationMenuPopup>
            <NavigationMenuArrow />
            <NavigationMenuViewport />
          </NavigationMenuPopup>
        </NavigationMenuPositioner>
      </NavigationMenuPortal>
    </NavigationMenuRoot>
  );
}

/** Все публичные части Base UI NavigationMenu 1.8 в Polar-стиле. */
export const NavigationMenuParts = {
  Root: NavigationMenuRoot,
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Icon: NavigationMenuIcon,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Portal: NavigationMenuPortal,
  Backdrop: NavigationMenuBackdrop,
  Positioner: NavigationMenuPositioner,
  Popup: NavigationMenuPopup,
  Arrow: NavigationMenuArrow,
  Viewport: NavigationMenuViewport,
};
