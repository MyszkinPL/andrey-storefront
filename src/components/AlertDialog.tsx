import * as React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger/Close сохраняют `render`: это механизм композиции Base UI, а не оформление. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;

export type AlertDialogHandle<Payload = unknown> = BaseAlertDialog.Handle<Payload>;
export type AlertDialogRootState = BaseAlertDialog.Root.State;
export type AlertDialogRootActions = BaseAlertDialog.Root.Actions;
export type AlertDialogRootChangeEventReason = BaseAlertDialog.Root.ChangeEventReason;
export type AlertDialogRootChangeEventDetails = BaseAlertDialog.Root.ChangeEventDetails;
export type AlertDialogTriggerState = BaseAlertDialog.Trigger.State;

/** Handle для detached-триггеров (Base UI 1.8 `AlertDialog.createHandle`). */
export const createAlertDialogHandle = BaseAlertDialog.createHandle;

export type AlertDialogRootProps<Payload = unknown> = Sealed<BaseAlertDialog.Root.Props<Payload>>;

export function AlertDialogRoot<Payload = unknown>(props: AlertDialogRootProps<Payload>) {
  return <BaseAlertDialog.Root {...props} />;
}

/** Base UI не объявляет ref у этой части — композиция через `render`. */
export type AlertDialogTriggerProps<Payload = unknown> = SealedComposition<BaseAlertDialog.Trigger.Props<Payload>>;

export function AlertDialogTrigger<Payload = unknown>({ children, ...props }: AlertDialogTriggerProps<Payload>) {
  return <BaseAlertDialog.Trigger {...props}>{children}</BaseAlertDialog.Trigger>;
}

export function AlertDialogPortal({ children }: { children: ReactNode }) {
  return <BaseAlertDialog.Portal>{children}</BaseAlertDialog.Portal>;
}

/** Канон `.seal-popup-backdrop` (REUSE.md §2) + диалоговое затемнение (см. Dialog/DialogBackdrop). */
export function AlertDialogBackdrop(props: Sealed<BaseAlertDialog.Backdrop.Props>) {
  return <BaseAlertDialog.Backdrop {...props} className="seal-popup-backdrop seal-dialog-backdrop" />;
}

export function AlertDialogViewport({ children, ...props }: Sealed<BaseAlertDialog.Viewport.Props>) {
  return (
    <BaseAlertDialog.Viewport {...props} className="seal-popup-viewport seal-dialog-viewport">
      {children}
    </BaseAlertDialog.Viewport>
  );
}

/** Канонические `.seal-popup .seal-popup--dialog` (REUSE.md §2); `seal-dialog-popup` — сброс позиционирования в Viewport. */
export function AlertDialogPopup({ children, ...props }: Sealed<BaseAlertDialog.Popup.Props>) {
  return (
    <BaseAlertDialog.Popup {...props} className="seal-popup seal-popup--dialog seal-dialog-popup">
      {children}
    </BaseAlertDialog.Popup>
  );
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <BaseAlertDialog.Title className="seal-dialog-title seal-alert-dialog-title">{children}</BaseAlertDialog.Title>;
}

/**
 * Шапка подтверждения: Polar AlertDialogHeader = `flex flex-col space-y-2
 * text-center sm:text-left` (`ui/alert-dialog.tsx`:56) — 8px, а не 6px как у Dialog.
 */
export type AlertDialogHeaderProps = { children: ReactNode };

export function AlertDialogHeader({ children }: AlertDialogHeaderProps) {
  return <div className="seal-dialog-header seal-alert-dialog-header">{children}</div>;
}

/**
 * Подвал подтверждения: Polar AlertDialogFooter = `flex flex-col-reverse
 * sm:flex-row sm:justify-end sm:space-x-2` (`ui/alert-dialog.tsx`:70).
 */
export type AlertDialogFooterProps = { children: ReactNode };

export function AlertDialogFooter({ children }: AlertDialogFooterProps) {
  return <div className="seal-dialog-footer seal-alert-dialog-footer">{children}</div>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <BaseAlertDialog.Description className="seal-dialog-description">{children}</BaseAlertDialog.Description>;
}

export type AlertDialogCloseProps = SealedComposition<BaseAlertDialog.Close.Props> & { ref?: React.Ref<HTMLButtonElement> };

/** Кнопка закрытия для композиций на AlertDialogParts. */
export function AlertDialogClose({ children, ref, ...props }: AlertDialogCloseProps) {
  return (
    <BaseAlertDialog.Close {...props} ref={ref}>
      {children}
    </BaseAlertDialog.Close>
  );
}

/** Все публичные части Base UI AlertDialog 1.8 с Polar-оформлением. */
export const AlertDialogParts = {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Portal: AlertDialogPortal,
  Backdrop: AlertDialogBackdrop,
  Viewport: AlertDialogViewport,
  Popup: AlertDialogPopup,
  Title: AlertDialogTitle,
  Header: AlertDialogHeader,
  Description: AlertDialogDescription,
  Footer: AlertDialogFooter,
  Close: AlertDialogClose,
};

/**
 * Пропсы = весь Root API Base UI 1.8 (у AlertDialog нет `modal` и
 * `disablePointerDismissal`: он всегда модальный — `AlertDialogRoot.d.ts`).
 */
export type AlertDialogProps = Omit<AlertDialogRootProps, 'children'> & {
  /** Триггер необязателен: для detached-триггеров используй AlertDialogParts. */
  trigger?: ReactElement<any>;
  title: ReactNode;
  description?: ReactNode;
  /** Действия (кнопки) внизу окна — Polar AlertDialogFooter. */
  children?: ReactNode;
};

export function AlertDialog({ trigger, title, description, children, ...rootProps }: AlertDialogProps) {
  return (
    <BaseAlertDialog.Root {...rootProps}>
      {trigger ? <BaseAlertDialog.Trigger render={trigger} /> : null}
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="seal-popup-backdrop seal-dialog-backdrop" />
        {/* Base UI anatomy: Portal > Backdrop + Viewport > Popup (alert-dialog.md, Anatomy) */}
        <BaseAlertDialog.Viewport className="seal-popup-viewport seal-dialog-viewport">
          <BaseAlertDialog.Popup className="seal-popup seal-popup--dialog seal-dialog-popup">
            <AlertDialogHeader>
              <BaseAlertDialog.Title className="seal-dialog-title seal-alert-dialog-title">
                {title}
              </BaseAlertDialog.Title>
              {description ? (
                <BaseAlertDialog.Description className="seal-dialog-description">
                  {description}
                </BaseAlertDialog.Description>
              ) : null}
            </AlertDialogHeader>
            {children ? <AlertDialogFooter>{children}</AlertDialogFooter> : null}
          </BaseAlertDialog.Popup>
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
}
