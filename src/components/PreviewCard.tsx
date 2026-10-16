import type { ComponentProps, ReactNode } from 'react';
import { PreviewCard as BasePreviewCard } from '@base-ui/react/preview-card';

/**
 * PreviewCard — полный Base UI 1.8 PreviewCard (Root/Trigger/Portal/Positioner/
 * Popup/Arrow/Backdrop/Viewport + createHandle) в Polar-визуале: та же
 * поверхность канона, что и у Popover (`seal-popup seal-popup--popover`:
 * `rounded-md` 7.6px, `p-4` 16px, `border`, `shadow-md`), плюс задержки hover
 * (Base UI 600/300 мс) и стрелка.
 *
 * Разметка одна на части и на конвиниенс: `PreviewCard` собирается из
 * `PreviewCardParts`, своих копий панели/позиционера/стрелки в файле нет.
 */

export type PreviewCardSide = 'top' | 'right' | 'bottom' | 'left';
export type PreviewCardAlign = 'start' | 'center' | 'end';

/** Внешнее оформление закрыто; `render` остаётся только у композиционных частей. */
type SealPart<T> = Omit<T, 'className' | 'style'>;
type SealPrimitive<T> = Omit<T, 'className' | 'style' | 'render'>;

export type PreviewCardRootProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Root>>;
export type PreviewCardTriggerProps = SealPart<ComponentProps<typeof BasePreviewCard.Trigger>>;
export type PreviewCardPortalProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Portal>>;
export type PreviewCardPositionerProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Positioner>>;
export type PreviewCardPopupProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Popup>>;
export type PreviewCardArrowProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Arrow>>;
export type PreviewCardBackdropProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Backdrop>>;
export type PreviewCardViewportProps = SealPrimitive<ComponentProps<typeof BasePreviewCard.Viewport>>;

/** Внешний триггер/управление карточкой (detached triggers). */
export type PreviewCardHandle<Payload = unknown> = NonNullable<PreviewCardRootProps['handle']>;

/** Детали события открытия/закрытия (Base UI `Root.ChangeEventDetails`). */
export type PreviewCardRootChangeEventDetails = Parameters<
  NonNullable<PreviewCardRootProps['onOpenChange']>
>[1];

export const createPreviewCardHandle = BasePreviewCard.createHandle;

export function PreviewCardRoot(props: PreviewCardRootProps) {
  return <BasePreviewCard.Root {...props} />;
}

export function PreviewCardTrigger({ children, ...props }: PreviewCardTriggerProps) {
  return (
    <BasePreviewCard.Trigger {...props} className="seal-preview-card-trigger">
      {children}
    </BasePreviewCard.Trigger>
  );
}

export function PreviewCardPortal({ children, ...props }: PreviewCardPortalProps) {
  return <BasePreviewCard.Portal {...props}>{children}</BasePreviewCard.Portal>;
}

export function PreviewCardPositioner({ children, ...props }: PreviewCardPositionerProps) {
  return (
    <BasePreviewCard.Positioner {...props} className="seal-popup-positioner">
      {children}
    </BasePreviewCard.Positioner>
  );
}

export function PreviewCardPopup({ children, ...props }: PreviewCardPopupProps) {
  return (
    <BasePreviewCard.Popup {...props} className="seal-popup seal-popup--popover">
      {children}
    </BasePreviewCard.Popup>
  );
}

export function PreviewCardArrow(props: PreviewCardArrowProps) {
  return <BasePreviewCard.Arrow {...props} className="seal-popup-arrow" />;
}

export function PreviewCardBackdrop(props: PreviewCardBackdropProps) {
  return <BasePreviewCard.Backdrop {...props} className="seal-popup-backdrop" />;
}

export function PreviewCardViewport({ children, ...props }: PreviewCardViewportProps) {
  return (
    <BasePreviewCard.Viewport {...props} className="seal-popup-viewport">
      {children}
    </BasePreviewCard.Viewport>
  );
}

/** Все публичные части Base UI 1.8 PreviewCard — стилизованные, как и Popover. */
export const PreviewCardParts = {
  Root: PreviewCardRoot,
  Trigger: PreviewCardTrigger,
  Portal: PreviewCardPortal,
  Positioner: PreviewCardPositioner,
  Popup: PreviewCardPopup,
  Arrow: PreviewCardArrow,
  Backdrop: PreviewCardBackdrop,
  Viewport: PreviewCardViewport,
};

export type PreviewCardProps = {
  /** Элемент-ссылка, к которой привязана карточка (Base UI рендерит `<a>`). */
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  /** Как у Popover/Tooltip в Base UI 1.8: колбэк получает и `eventDetails`. */
  onOpenChange?: (open: boolean, eventDetails: PreviewCardRootChangeEventDetails) => void;
  /** Вызывается после завершения анимаций открытия/закрытия. */
  onOpenChangeComplete?: (open: boolean) => void;
  side?: PreviewCardSide;
  align?: PreviewCardAlign;
  sideOffset?: number;
  alignOffset?: number;
  /** Стрелка у панели, как у Popover. */
  arrow?: boolean;
  /** Задержка открытия по hover, мс (Base UI default 600). */
  delay?: number;
  /** Задержка закрытия после ухода курсора, мс (Base UI default 300). */
  closeDelay?: number;
  /** Императивные действия Base UI (`Root.actionsRef`): `close` / `unmount`. */
  actionsRef?: PreviewCardRootProps['actionsRef'];
  /** Handle для detached-триггеров (`Root.handle`). */
  handle?: PreviewCardRootProps['handle'];
  /** id триггера, с которым связана карточка (`Root.triggerId`). */
  triggerId?: PreviewCardRootProps['triggerId'];
  /** id триггера для изначально открытой карточки (`Root.defaultTriggerId`). */
  defaultTriggerId?: PreviewCardRootProps['defaultTriggerId'];
  'aria-label'?: string;
};

/**
 * PreviewCard «из коробки»: собирается из своих же частей.
 * Открывается по наведению и фокусу с задержками Base UI.
 */
export function PreviewCard({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  side = 'bottom',
  align = 'center',
  // Прямого Polar-донора у PreviewCard нет: 4 — семейное значение двух
  // существующих доноров (ui/popover.tsx и orbit/Tooltip.tsx, sideOffset 4).
  sideOffset = 4,
  alignOffset = 0,
  arrow = false,
  delay,
  closeDelay,
  actionsRef,
  handle,
  triggerId,
  defaultTriggerId,
  'aria-label': ariaLabel,
}: PreviewCardProps) {
  return (
    <PreviewCardRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (value, eventDetails) => onOpenChange(value, eventDetails) : undefined}
      onOpenChangeComplete={onOpenChangeComplete}
      actionsRef={actionsRef}
      handle={handle}
      triggerId={triggerId}
      defaultTriggerId={defaultTriggerId}
    >
      <PreviewCardTrigger
        aria-label={ariaLabel}
        delay={delay}
        closeDelay={closeDelay}
        render={trigger as never}
      >
        {null}
      </PreviewCardTrigger>
      <PreviewCardPortal>
        <PreviewCardPositioner side={side} align={align} sideOffset={sideOffset} alignOffset={alignOffset}>
          <PreviewCardPopup>
            {arrow ? <PreviewCardArrow /> : null}
            {children}
          </PreviewCardPopup>
        </PreviewCardPositioner>
      </PreviewCardPortal>
    </PreviewCardRoot>
  );
}
