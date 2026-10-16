import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/**
 * Trigger/Close сохраняют `render`: в Base UI это механизм композиции
 * (замена элемента), а не внешнее оформление, поэтому он не запечатан.
 */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
type WithRef<Props, Element> = Props & { ref?: React.Ref<Element> };

export type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type PopoverAlign = 'start' | 'center' | 'end';
export type PopoverHandle<Payload = unknown> = BasePopover.Handle<Payload>;
export type PopoverRootState = BasePopover.Root.State;
export type PopoverRootActions = BasePopover.Root.Actions;
export type PopoverRootChangeEventReason = BasePopover.Root.ChangeEventReason;
export type PopoverRootChangeEventDetails = BasePopover.Root.ChangeEventDetails;
export type PopoverTriggerState = BasePopover.Trigger.State;
export type PopoverBackdropState = BasePopover.Backdrop.State;
export type PopoverPositionerState = BasePopover.Positioner.State;
export type PopoverPopupState = BasePopover.Popup.State;
export type PopoverArrowState = BasePopover.Arrow.State;
export type PopoverTitleState = BasePopover.Title.State;
export type PopoverDescriptionState = BasePopover.Description.State;
export type PopoverCloseState = BasePopover.Close.State;
export type PopoverViewportState = BasePopover.Viewport.State;

/** Handle для detached-триггеров (Base UI 1.8 `Popover.createHandle`). */
export const createPopoverHandle = BasePopover.createHandle;

export type PopoverRootProps<Payload = unknown> = Sealed<BasePopover.Root.Props<Payload>>;

export function PopoverRoot<Payload = unknown>(props: PopoverRootProps<Payload>) {
  return <BasePopover.Root {...props} />;
}

export type PopoverTriggerProps<Payload = unknown> = WithRef<
  SealedComposition<BasePopover.Trigger.Props<Payload>>,
  HTMLElement
>;

export function PopoverTrigger<Payload = unknown>({ children, ref, ...props }: PopoverTriggerProps<Payload>) {
  return (
    <BasePopover.Trigger {...props} ref={ref} className="seal-popover-trigger">
      {children}
    </BasePopover.Trigger>
  );
}

export type PopoverPortalProps = WithRef<Sealed<BasePopover.Portal.Props>, HTMLDivElement>;

export function PopoverPortal({ children, ref, ...props }: PopoverPortalProps) {
  return (
    <BasePopover.Portal {...props} ref={ref} className="seal-popover-portal">
      {children}
    </BasePopover.Portal>
  );
}

export type PopoverBackdropProps = WithRef<Sealed<BasePopover.Backdrop.Props>, HTMLDivElement>;

export function PopoverBackdrop({ ref, ...props }: PopoverBackdropProps) {
  return <BasePopover.Backdrop {...props} ref={ref} className="seal-popup-backdrop" />;
}

export type PopoverPositionerProps = WithRef<Sealed<BasePopover.Positioner.Props>, HTMLDivElement>;

export function PopoverPositioner({ children, ref, sideOffset = 4, ...props }: PopoverPositionerProps) {
  return (
    <BasePopover.Positioner {...props} ref={ref} sideOffset={sideOffset} className="seal-popup-positioner">
      {children}
    </BasePopover.Positioner>
  );
}

export type PopoverPopupProps = WithRef<Sealed<BasePopover.Popup.Props>, HTMLDivElement>;

export function PopoverPopup({ children, ref, ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup {...props} ref={ref} className="seal-popup seal-popup--popover">
      {children}
    </BasePopover.Popup>
  );
}

export type PopoverArrowProps = WithRef<Sealed<BasePopover.Arrow.Props>, HTMLDivElement>;

export function PopoverArrow({ ref, ...props }: PopoverArrowProps) {
  return <BasePopover.Arrow {...props} ref={ref} className="seal-popup-arrow" />;
}

export type PopoverViewportProps = WithRef<Sealed<BasePopover.Viewport.Props>, HTMLDivElement>;

export function PopoverViewport({ children, ref, ...props }: PopoverViewportProps) {
  return (
    <BasePopover.Viewport {...props} ref={ref} className="seal-popup-viewport">
      {children}
    </BasePopover.Viewport>
  );
}

/**
 * Подпись панели. Тип выведен из компонента базовой части (`ComponentProps`),
 * чтобы не терять пропсы, если в пакете переименуют тип-пространство.
 */
export type PopoverTitleProps = Omit<React.ComponentProps<typeof BasePopover.Title>, 'className' | 'style' | 'render'>;

export function PopoverTitle({ children, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title {...props} className="seal-popover-title">
      {children}
    </BasePopover.Title>
  );
}

export type PopoverDescriptionProps = Omit<
  React.ComponentProps<typeof BasePopover.Description>,
  'className' | 'style' | 'render'
>;

export function PopoverDescription({ children, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description {...props} className="seal-popover-description">
      {children}
    </BasePopover.Description>
  );
}

/** Кнопка закрытия: `render` сохранён — это композиционная часть Base UI. */
export type PopoverCloseProps = WithRef<
  Omit<React.ComponentProps<typeof BasePopover.Close>, 'className' | 'style'>,
  HTMLButtonElement
> & { children: React.ReactNode };

export function PopoverClose({ children, ref, ...props }: PopoverCloseProps) {
  return (
    <BasePopover.Close {...props} ref={ref} className="seal-popover-close" render={children as never}>
      {null}
    </BasePopover.Close>
  );
}

export type PopoverPartsProps = {
  Root: typeof PopoverRoot;
  Trigger: typeof PopoverTrigger;
  Portal: typeof PopoverPortal;
  Backdrop: typeof PopoverBackdrop;
  Positioner: typeof PopoverPositioner;
  Popup: typeof PopoverPopup;
  Arrow: typeof PopoverArrow;
  Viewport: typeof PopoverViewport;
  Title: typeof PopoverTitle;
  Description: typeof PopoverDescription;
  Close: typeof PopoverClose;
};

/** Все публичные части Base UI Popover 1.8 с Polar-оформлением. */
export const PopoverParts: PopoverPartsProps = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Backdrop: PopoverBackdrop,
  Positioner: PopoverPositioner,
  Popup: PopoverPopup,
  Arrow: PopoverArrow,
  Viewport: PopoverViewport,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
};

export type PopoverProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** Управляемое состояние открытия. */
  open?: boolean;
  onOpenChange?: (open: boolean, eventDetails: PopoverRootChangeEventDetails) => void;
  defaultOpen?: boolean;
  onOpenChangeComplete?: (open: boolean) => void;
  /** Модальность Base UI: true | false | 'trap-focus'. */
  modal?: boolean | 'trap-focus';
  /** Дополнительно открывать поповер по наведению на триггер. */
  openOnHover?: boolean;
  /** Задержка открытия по наведению, мс (Base UI default 300). */
  delay?: number;
  /** Задержка закрытия поповера, открытого по наведению, мс. */
  closeDelay?: number;
  side?: PopoverSide;
  align?: PopoverAlign;
  /** Отступ от триггера в px. */
  sideOffset?: number;
  alignOffset?: number;
  /** Стрелка у поповера, как у Tooltip. */
  arrow?: boolean;
  /** Императивные действия Base UI (`Root.actionsRef`): `close` / `unmount`. */
  actionsRef?: PopoverRootProps['actionsRef'];
  /** Handle для detached-триггеров (`Root.handle`). */
  handle?: PopoverRootProps['handle'];
  /** id триггера, с которым связан поповер (`Root.triggerId`). */
  triggerId?: PopoverRootProps['triggerId'];
  /** id триггера для изначально открытого поповера (`Root.defaultTriggerId`). */
  defaultTriggerId?: PopoverRootProps['defaultTriggerId'];
  'aria-label'?: string;
};

/**
 * Поповер Base UI в Polar-стиле (`ui/popover.tsx`). Панель — общий канон
 * `seal-popup seal-popup--popover` (288px, `p-4` = 16px, `rounded-md` = 7.6px =
 * Polar `calc(0.6rem - 2px)`, `shadow-md`); align center, sideOffset 4.
 * Контент закрывается по Esc/клику вне.
 *
 * Конвиниенс собирается из своих же частей (`PopoverParts`) — разметка и классы
 * панели/позиционера/стрелки описаны в одном месте.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  defaultOpen,
  onOpenChangeComplete,
  modal,
  openOnHover,
  delay,
  closeDelay,
  side = 'bottom',
  // Polar ui/popover.tsx: align по умолчанию center, sideOffset 4.
  align = 'center',
  sideOffset = 4,
  alignOffset,
  arrow = false,
  actionsRef,
  handle,
  triggerId,
  defaultTriggerId,
  'aria-label': ariaLabel,
}: PopoverProps) {
  return (
    <PopoverRoot
      open={open}
      onOpenChange={onOpenChange ? (value, eventDetails) => onOpenChange(value, eventDetails) : undefined}
      defaultOpen={defaultOpen}
      onOpenChangeComplete={onOpenChangeComplete}
      modal={modal}
      actionsRef={actionsRef}
      handle={handle}
      triggerId={triggerId}
      defaultTriggerId={defaultTriggerId}
    >
      <PopoverTrigger
        aria-label={ariaLabel}
        openOnHover={openOnHover}
        delay={delay}
        closeDelay={closeDelay}
        render={trigger as never}
      >
        {null}
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset}>
          <PopoverPopup>
            {arrow ? <PopoverArrow /> : null}
            {children}
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </PopoverRoot>
  );
}
