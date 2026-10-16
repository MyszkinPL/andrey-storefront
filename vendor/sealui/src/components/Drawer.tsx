import type { ComponentProps, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { Button } from './Button';

/**
 * Drawer — полный Base UI 1.8 Drawer (все части, snapPoints, swipe-жесты)
 * в Polar-визуале: панель ui/sheet (p-6, gap, border, shadow-lg, overlay
 * black/80) + BottomSheet (radius 24 сверху, ручка-индикатор).
 */

export type DrawerSide = 'top' | 'right' | 'bottom' | 'left';
export type DrawerSwipeDirection = 'up' | 'down' | 'left' | 'right';

/** Внутренний тип: наружу className/style не отдаём (закрытый API). */
type SealPart<T> = Omit<T, 'className' | 'style'>;

export type DrawerProviderProps = SealPart<ComponentProps<typeof BaseDrawer.Provider>>;
export type DrawerRootProps = SealPart<ComponentProps<typeof BaseDrawer.Root>>;
export type DrawerTriggerProps = SealPart<ComponentProps<typeof BaseDrawer.Trigger>>;
export type DrawerPortalProps = SealPart<ComponentProps<typeof BaseDrawer.Portal>>;
export type DrawerBackdropProps = SealPart<ComponentProps<typeof BaseDrawer.Backdrop>>;
export type DrawerPopupProps = SealPart<ComponentProps<typeof BaseDrawer.Popup>>;
export type DrawerContentProps = SealPart<ComponentProps<typeof BaseDrawer.Content>>;
export type DrawerTitleProps = SealPart<ComponentProps<typeof BaseDrawer.Title>>;
export type DrawerDescriptionProps = SealPart<ComponentProps<typeof BaseDrawer.Description>>;
export type DrawerCloseProps = SealPart<ComponentProps<typeof BaseDrawer.Close>>;
export type DrawerSwipeAreaProps = SealPart<ComponentProps<typeof BaseDrawer.SwipeArea>>;
export type DrawerIndentProps = SealPart<ComponentProps<typeof BaseDrawer.Indent>>;
export type DrawerIndentBackgroundProps = SealPart<ComponentProps<typeof BaseDrawer.IndentBackground>>;
export type DrawerVirtualKeyboardProviderProps = SealPart<ComponentProps<typeof BaseDrawer.VirtualKeyboardProvider>>;

/** Управляемое открытие извне панели (detached triggers). */
export type DrawerHandle<Payload = unknown> = NonNullable<DrawerRootProps['handle']>;

export const createDrawerHandle = BaseDrawer.createHandle;

/**
 * Шапка панели: Polar SheetHeader = `flex flex-col space-y-2 text-center
 * sm:text-left` (`ui/sheet.tsx`:76) — 8px между заголовком и описанием.
 */
export type DrawerHeaderProps = { children: ReactNode };

export function DrawerHeader({ children }: DrawerHeaderProps) {
  return <div className="seal-dialog-header seal-sheet-header">{children}</div>;
}

/**
 * Подвал панели: Polar SheetFooter = `flex flex-col-reverse sm:flex-row
 * sm:justify-end sm:space-x-2` (`ui/sheet.tsx`:88).
 */
export type DrawerFooterProps = { children: ReactNode };

export function DrawerFooter({ children }: DrawerFooterProps) {
  return <div className="seal-dialog-footer seal-sheet-footer">{children}</div>;
}

/**
 * Все публичные части Base UI Drawer 1.8. Отдаём ЗАКРЫТЫЕ обёртки с Polar-классами,
 * а не сырые части пакета: иначе потребитель мог бы протащить свой className
 * и обойти стиль (та же конвенция, что в DialogParts/AlertDialogParts).
 */
export const DrawerParts = {
  Provider: DrawerProvider,
  IndentBackground: DrawerIndentBackground,
  Indent: DrawerIndent,
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  SwipeArea: DrawerSwipeArea,
  Portal: DrawerPortal,
  Backdrop: DrawerBackdrop,
  Viewport: DrawerViewport,
  Popup: DrawerPopup,
  Content: DrawerContent,
  Title: DrawerTitle,
  Header: DrawerHeader,
  Description: DrawerDescription,
  Footer: DrawerFooter,
  Close: DrawerClose,
  VirtualKeyboardProvider: DrawerVirtualKeyboardProvider,
};

export function DrawerProvider(props: DrawerProviderProps) {
  return <BaseDrawer.Provider {...props} />;
}

export function DrawerIndentBackground(props: DrawerIndentBackgroundProps) {
  return <BaseDrawer.IndentBackground className="seal-drawer-indent-background" {...props} />;
}

export function DrawerIndent(props: DrawerIndentProps) {
  return <BaseDrawer.Indent className="seal-drawer-indent" {...props} />;
}

export function DrawerRoot(props: DrawerRootProps) {
  return <BaseDrawer.Root {...props} />;
}

export function DrawerTrigger(props: DrawerTriggerProps) {
  return <BaseDrawer.Trigger className="seal-drawer-trigger" {...props} />;
}

export function DrawerSwipeArea(props: DrawerSwipeAreaProps) {
  return <BaseDrawer.SwipeArea className="seal-drawer-swipe-area" {...props} />;
}

export function DrawerPortal(props: DrawerPortalProps) {
  return <BaseDrawer.Portal {...props} />;
}

/**
 * Каноническая роль затемнения `.seal-popup-backdrop` (REUSE.md §2) плюс
 * drawer-класс с фоном `--seal-backdrop` и `[data-swiping]`-прозрачностью
 * (канон фона не задаёт — см. отчёт).
 */
export function DrawerBackdrop(props: DrawerBackdropProps) {
  return <BaseDrawer.Backdrop className="seal-popup-backdrop seal-drawer-backdrop" {...props} />;
}

export type DrawerViewportOwnProps = {
  /** Сторона, с которой выезжает панель (управляет геометрией). */
  side?: DrawerSide;
};

export type DrawerViewportProps = SealPart<ComponentProps<typeof BaseDrawer.Viewport>> & DrawerViewportOwnProps;

export function DrawerViewport({ side = 'right', ...props }: DrawerViewportProps) {
  return <BaseDrawer.Viewport className="seal-drawer-viewport" data-side={side} {...props} />;
}

/**
 * Панель — каноническая поверхность `.seal-popup` (REUSE.md §2), свои стороны,
 * размеры и свайп-трансформы остаются в `seal-drawer-popup` (§4 — исключение).
 */
export function DrawerPopup(props: DrawerPopupProps) {
  return <BaseDrawer.Popup className="seal-popup seal-drawer-popup" {...props} />;
}

export function DrawerContent(props: DrawerContentProps) {
  return <BaseDrawer.Content className="seal-drawer-content" {...props} />;
}

export function DrawerTitle(props: DrawerTitleProps) {
  return <BaseDrawer.Title className="seal-drawer-title" {...props} />;
}

export function DrawerDescription(props: DrawerDescriptionProps) {
  return <BaseDrawer.Description className="seal-drawer-description" {...props} />;
}

export function DrawerClose(props: DrawerCloseProps) {
  return <BaseDrawer.Close className="seal-drawer-close" {...props} />;
}

export function DrawerVirtualKeyboardProvider(props: DrawerVirtualKeyboardProviderProps) {
  return <BaseDrawer.VirtualKeyboardProvider {...props} />;
}

const SIDE_SWIPE: Record<DrawerSide, DrawerSwipeDirection> = {
  top: 'up',
  right: 'right',
  bottom: 'down',
  left: 'left',
};

export type DrawerProps = {
  trigger: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Сторона выезда (Polar ui/sheet: right по умолчанию). */
  side?: DrawerSide;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Base UI modal: true | false | 'trap-focus'. */
  modal?: boolean | 'trap-focus';
  /** Направление свайпа-закрытия; по умолчанию противоположно стороне. */
  swipeDirection?: DrawerSwipeDirection;
  /** Область свайпа от края экрана, открывающая панель. */
  swipeArea?: boolean;
  /** Точки фиксации панели (Base UI snapPoints). */
  snapPoints?: DrawerRootProps['snapPoints'];
  /** Перескакивать по скорости, а не по расстоянию (Base UI snapToSequentialPoints). */
  snapToSequentialPoints?: boolean;
  /** Закрывать по клику вне панели (Base UI disablePointerDismissal). */
  dismissOnOutsidePress?: boolean;
  /** Крестик в углу панели (как в Polar ui/sheet). */
  showClose?: boolean;
  /** Ручка-индикатор (Polar BottomSheet). По умолчанию только для bottom. */
  showHandle?: boolean;
  'aria-label'?: string;
};

/**
 * Drawer «из коробки»: Root + Trigger + Portal + Backdrop + Viewport + Popup
 * + Content + Title/Description + Close. Для нестандартной разметки используй
 * `DrawerParts`.
 */
export function Drawer({
  trigger,
  title,
  description,
  children,
  side = 'right',
  open,
  defaultOpen,
  onOpenChange,
  modal,
  swipeDirection,
  swipeArea = false,
  snapPoints,
  snapToSequentialPoints,
  dismissOnOutsidePress = true,
  showClose = true,
  showHandle,
  'aria-label': ariaLabel,
}: DrawerProps) {
  const withHandle = showHandle ?? side === 'bottom';

  return (
    <BaseDrawer.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (value) => onOpenChange(value) : undefined}
      modal={modal}
      snapPoints={snapPoints}
      snapToSequentialPoints={snapToSequentialPoints}
      swipeDirection={swipeDirection ?? SIDE_SWIPE[side]}
      disablePointerDismissal={dismissOnOutsidePress ? undefined : true}
    >
      <BaseDrawer.Trigger className="seal-drawer-trigger" aria-label={ariaLabel} render={trigger as never}>
        {null}
      </BaseDrawer.Trigger>
      {swipeArea ? <BaseDrawer.SwipeArea className="seal-drawer-swipe-area" /> : null}
      <BaseDrawer.Portal>
        <BaseDrawer.Backdrop className="seal-popup-backdrop seal-drawer-backdrop" />
        <BaseDrawer.Viewport className="seal-drawer-viewport" data-side={side}>
          <BaseDrawer.Popup className="seal-popup seal-drawer-popup">
            {withHandle ? <div className="seal-drawer-handle" aria-hidden /> : null}
            {showClose ? (
              /* Крестик — наш Button через документированный `render` Base UI. */
              <BaseDrawer.Close
                render={
                  <Button size="icon" variant="ghost" aria-label="Close">
                    <X size={16} aria-hidden />
                  </Button>
                }
                className="seal-drawer-close"
              >
                {null}
              </BaseDrawer.Close>
            ) : null}
            <BaseDrawer.Content className="seal-drawer-content">
              {title || description ? (
                <DrawerHeader>
                  {title ? <BaseDrawer.Title className="seal-drawer-title">{title}</BaseDrawer.Title> : null}
                  {description ? (
                    <BaseDrawer.Description className="seal-drawer-description">{description}</BaseDrawer.Description>
                  ) : null}
                </DrawerHeader>
              ) : null}
              {children}
            </BaseDrawer.Content>
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}
