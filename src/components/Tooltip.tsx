import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger сохраняет `render`: это механизм композиции Base UI, а не оформление. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
type WithRef<Props, Element> = Props & { ref?: React.Ref<Element> };

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
export type TooltipAlign = 'start' | 'center' | 'end';
export type TooltipHandle<Payload = unknown> = BaseTooltip.Handle<Payload>;
export type TooltipRootState = BaseTooltip.Root.State;
export type TooltipRootActions = BaseTooltip.Root.Actions;
export type TooltipRootChangeEventReason = BaseTooltip.Root.ChangeEventReason;
export type TooltipRootChangeEventDetails = BaseTooltip.Root.ChangeEventDetails;
export type TooltipTriggerState = BaseTooltip.Trigger.State;
export type TooltipPopupState = BaseTooltip.Popup.State;
export type TooltipPositionerState = BaseTooltip.Positioner.State;
export type TooltipArrowState = BaseTooltip.Arrow.State;
export type TooltipProviderState = BaseTooltip.Provider.State;
export type TooltipViewportState = BaseTooltip.Viewport.State;

/** Handle для detached-триггеров (Base UI 1.8 `Tooltip.createHandle`). */
export const createTooltipHandle = BaseTooltip.createHandle;

/**
 * Общая задержка для группы тултипов: как только один тултип показан,
 * соседние открываются мгновенно (Polar показывает подсказки без задержки).
 */
export type TooltipProviderProps = Sealed<BaseTooltip.Provider.Props> & { children?: React.ReactNode };

export function TooltipProvider({ children, ...props }: TooltipProviderProps) {
  return <BaseTooltip.Provider {...props}>{children}</BaseTooltip.Provider>;
}

export type TooltipRootProps<Payload = unknown> = Sealed<BaseTooltip.Root.Props<Payload>>;

export function TooltipRoot<Payload = unknown>(props: TooltipRootProps<Payload>) {
  return <BaseTooltip.Root {...props} />;
}

export type TooltipTriggerProps<Payload = unknown> = WithRef<
  SealedComposition<BaseTooltip.Trigger.Props<Payload>>,
  HTMLElement
>;

export function TooltipTrigger<Payload = unknown>({ children, ref, ...props }: TooltipTriggerProps<Payload>) {
  return (
    <BaseTooltip.Trigger {...props} ref={ref} className="seal-tooltip-trigger">
      {children}
    </BaseTooltip.Trigger>
  );
}

export type TooltipPortalProps = WithRef<Sealed<BaseTooltip.Portal.Props>, HTMLDivElement>;

export function TooltipPortal({ children, ref, ...props }: TooltipPortalProps) {
  return (
    <BaseTooltip.Portal {...props} ref={ref} className="seal-tooltip-portal">
      {children}
    </BaseTooltip.Portal>
  );
}

export type TooltipPositionerProps = WithRef<Sealed<BaseTooltip.Positioner.Props>, HTMLDivElement>;

export function TooltipPositioner({ children, ref, sideOffset = 4, ...props }: TooltipPositionerProps) {
  return (
    <BaseTooltip.Positioner {...props} ref={ref} sideOffset={sideOffset} className="seal-popup-positioner seal-popup-positioner--above">
      {children}
    </BaseTooltip.Positioner>
  );
}

export type TooltipPopupProps = WithRef<Sealed<BaseTooltip.Popup.Props>, HTMLDivElement>;

export function TooltipPopup({ children, ref, ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup {...props} ref={ref} className="seal-popup seal-popup--tooltip">
      {children}
    </BaseTooltip.Popup>
  );
}

export type TooltipArrowProps = WithRef<Sealed<BaseTooltip.Arrow.Props>, HTMLDivElement>;

export function TooltipArrow({ ref, ...props }: TooltipArrowProps) {
  return <BaseTooltip.Arrow {...props} ref={ref} className="seal-popup-arrow seal-popup-arrow--tooltip" />;
}

export type TooltipViewportProps = WithRef<Sealed<BaseTooltip.Viewport.Props>, HTMLDivElement>;

export function TooltipViewport({ children, ref, ...props }: TooltipViewportProps) {
  return (
    <BaseTooltip.Viewport {...props} ref={ref} className="seal-popup-viewport">
      {children}
    </BaseTooltip.Viewport>
  );
}

/** Все публичные части Base UI Tooltip 1.8 с Polar-оформлением. */
export const TooltipParts = {
  Provider: TooltipProvider,
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Positioner: TooltipPositioner,
  Popup: TooltipPopup,
  Arrow: TooltipArrow,
  Viewport: TooltipViewport,
};

export type TooltipProps = {
  /** Содержимое подсказки. */
  content: React.ReactNode;
  children: React.ReactElement<any>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, eventDetails: TooltipRootChangeEventDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  /** Задержка открытия в мс (Base UI default 600). */
  delay?: number;
  /** Задержка закрытия в мс (Base UI default 0). */
  closeDelay?: number;
  /** Не показывать подсказку, не отключая сам триггер. */
  disabled?: boolean;
  /** Закрывать подсказку по клику на триггер (Base UI default true). */
  closeOnClick?: boolean;
  /** Тултип можно навести курсором, не закрывая его. */
  disableHoverablePopup?: boolean;
  /** Ось, по которой подсказка следует за курсором. */
  trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
  side?: TooltipSide;
  align?: TooltipAlign;
  /** Отступ от триггера в px. */
  sideOffset?: number;
  /** Стрелка у подсказки. */
  arrow?: boolean;
  /** Императивные действия Base UI (`Root.actionsRef`): `close` / `unmount`. */
  actionsRef?: TooltipRootProps['actionsRef'];
  /** Handle для detached-триггеров (`Root.handle`). */
  handle?: TooltipRootProps['handle'];
  /** id триггера, с которым связана подсказка (`Root.triggerId`). */
  triggerId?: TooltipRootProps['triggerId'];
  /** id триггера для изначально открытой подсказки (`Root.defaultTriggerId`). */
  defaultTriggerId?: TooltipRootProps['defaultTriggerId'];
  'aria-label'?: string;
};

/**
 * Подсказка Base UI 1.8 в Polar-стиле: панель — общий канон
 * `seal-popup seal-popup--tooltip` (своя поверхность, `z-index 60`,
 * `px-3 py-1.5 text-sm`), закрывается по Esc и потере фокуса.
 *
 * Провайдер здесь не рендерится: для мгновенного показа соседних подсказок
 * оберни группу в `TooltipProvider`.
 */
export function Tooltip({
  content,
  children,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  delay,
  closeDelay,
  disabled,
  closeOnClick,
  disableHoverablePopup,
  trackCursorAxis,
  side = 'top',
  align = 'center',
  // Polar orbit/Tooltip: sideOffset 4 (наш прежний дефолт 6 — не по донору).
  sideOffset = 4,
  arrow = false,
  actionsRef,
  handle,
  triggerId,
  defaultTriggerId,
  'aria-label': ariaLabel,
}: TooltipProps) {
  // Собирается из своих же частей (`TooltipParts`): классы триггера, панели
  // и стрелки описаны один раз — и для частей, и для конвиниенса.
  return (
    <TooltipRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (value, eventDetails) => onOpenChange(value, eventDetails) : undefined}
      onOpenChangeComplete={onOpenChangeComplete}
      disabled={disabled}
      disableHoverablePopup={disableHoverablePopup}
      trackCursorAxis={trackCursorAxis}
      actionsRef={actionsRef}
      handle={handle}
      triggerId={triggerId}
      defaultTriggerId={defaultTriggerId}
    >
      <TooltipTrigger
        aria-label={ariaLabel}
        delay={delay}
        closeDelay={closeDelay}
        closeOnClick={closeOnClick}
        render={children as never}
      >
        {null}
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner side={side} align={align} sideOffset={sideOffset}>
          <TooltipPopup>
            {arrow ? <TooltipArrow /> : null}
            {content}
          </TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </TooltipRoot>
  );
}
