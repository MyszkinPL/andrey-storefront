import * as React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Button } from './Button';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/** Trigger/Close сохраняют `render`: это механизм композиции Base UI, а не оформление. */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;

export type DialogHandle<Payload = unknown> = BaseDialog.Handle<Payload>;
export type DialogRootState = BaseDialog.Root.State;
export type DialogRootActions = BaseDialog.Root.Actions;
export type DialogRootChangeEventReason = BaseDialog.Root.ChangeEventReason;
export type DialogRootChangeEventDetails = BaseDialog.Root.ChangeEventDetails;
export type DialogTriggerState = BaseDialog.Trigger.State;
export type DialogBackdropState = BaseDialog.Backdrop.State;
export type DialogPopupState = BaseDialog.Popup.State;
export type DialogViewportState = BaseDialog.Viewport.State;
export type DialogTitleState = BaseDialog.Title.State;
export type DialogDescriptionState = BaseDialog.Description.State;
export type DialogCloseState = BaseDialog.Close.State;

/** Handle для detached-триггеров (Base UI 1.8 `Dialog.createHandle`). */
export const createDialogHandle = BaseDialog.createHandle;

export type DialogRootProps<Payload = unknown> = Sealed<BaseDialog.Root.Props<Payload>>;

export function DialogRoot<Payload = unknown>(props: DialogRootProps<Payload>) {
  return <BaseDialog.Root {...props} />;
}

export type DialogTriggerProps<Payload = unknown> = SealedComposition<BaseDialog.Trigger.Props<Payload>> & {
  ref?: React.Ref<HTMLElement>;
};

export function DialogTrigger<Payload = unknown>({ children, ref, ...props }: DialogTriggerProps<Payload>) {
  return (
    <BaseDialog.Trigger {...props} ref={ref}>
      {children}
    </BaseDialog.Trigger>
  );
}

export function DialogPortal({ children }: { children: ReactNode }) {
  return <BaseDialog.Portal>{children}</BaseDialog.Portal>;
}

/**
 * Слой затемнения — каноническая роль `.seal-popup-backdrop` (REUSE.md §2) плюс
 * диалоговый `.seal-dialog-backdrop`: канон задаёт только `position/inset/z-index`,
 * а `background-color: var(--seal-backdrop)` живёт в диалоговом правиле (строка ~7298).
 * Без него модальное окно теряет затемнение — снять класс можно только после
 * переноса фона в канон (см. отчёт).
 */
export function DialogBackdrop(props: Sealed<BaseDialog.Backdrop.Props>) {
  return <BaseDialog.Backdrop {...props} className="seal-popup-backdrop seal-dialog-backdrop" />;
}

/**
 * Слой центрирования/скролла: каноническая роль `.seal-popup-viewport` +
 * диалоговый `.seal-dialog-viewport` (канон даёт только `position: relative`,
 * центрирование `grid place-items:center` — в правиле диалога, строка ~7305).
 */
export function DialogViewport({ children, ...props }: Sealed<BaseDialog.Viewport.Props>) {
  return (
    <BaseDialog.Viewport {...props} className="seal-popup-viewport seal-dialog-viewport">
      {children}
    </BaseDialog.Viewport>
  );
}

/**
 * Панель окна — канонические `.seal-popup .seal-popup--dialog` (REUSE.md §2/§4).
 * Диалоговый класс оставлен только ради сброса позиционирования внутри Viewport
 * (`.seal-dialog-viewport > .seal-dialog-popup { position: static }`), которого
 * канон не содержит: без него попап сохранит `position: fixed` и центрирование
 * перестанет работать. См. отчёт.
 */
export function DialogPopup({ children, ...props }: Sealed<BaseDialog.Popup.Props>) {
  return (
    <BaseDialog.Popup {...props} className="seal-popup seal-popup--dialog seal-dialog-popup">
      {children}
    </BaseDialog.Popup>
  );
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <BaseDialog.Title className="seal-dialog-title">{children}</BaseDialog.Title>;
}

/**
 * Шапка окна: Polar DialogHeader = `flex flex-col space-y-1.5 text-center sm:text-left`
 * (`ui/dialog.tsx`:58) — 6px между заголовком и описанием.
 */
export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="seal-dialog-header">{children}</div>;
}

/**
 * Подвал окна: Polar DialogFooter = `flex flex-col-reverse sm:flex-row
 * sm:justify-end sm:space-x-2` (`ui/dialog.tsx`:70).
 */
export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="seal-dialog-footer">{children}</div>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <BaseDialog.Description className="seal-dialog-description">{children}</BaseDialog.Description>;
}

export type DialogCloseProps = SealedComposition<BaseDialog.Close.Props> & { ref?: React.Ref<HTMLButtonElement> };

export function DialogClose({ children, ref, ...props }: DialogCloseProps) {
  return (
    <BaseDialog.Close {...props} ref={ref}>
      {children}
    </BaseDialog.Close>
  );
}

/** Все публичные части Base UI Dialog 1.8 с Polar-оформлением. */
export const DialogParts = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Viewport: DialogViewport,
  Popup: DialogPopup,
  Title: DialogTitle,
  Header: DialogHeader,
  Description: DialogDescription,
  Footer: DialogFooter,
  Close: DialogClose,
};

/**
 * Пропсы диалога = ВЕСЬ Root API Base UI 1.8 (`open`, `defaultOpen`, `modal`,
 * `onOpenChange`, `onOpenChangeComplete`, `disablePointerDismissal`, `actionsRef`,
 * `handle`, `triggerId`, `defaultTriggerId`) плюс удобные слоты sealui.
 */
export type DialogProps = Omit<DialogRootProps, 'children'> & {
  /** Триггер необязателен: для detached-триггеров используй DialogParts. */
  trigger?: ReactElement<any>;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Сворачивать встроенную кнопку закрытия (крестик). */
  hideCloseButton?: boolean;
};

export function Dialog({ trigger, title, description, children, hideCloseButton = false, ...rootProps }: DialogProps) {
  return (
    <BaseDialog.Root {...rootProps}>
      {trigger ? <BaseDialog.Trigger render={trigger} /> : null}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="seal-popup-backdrop seal-dialog-backdrop" />
        {/* Base UI anatomy: Portal > Backdrop + Viewport > Popup (dialog.md, Anatomy) */}
        <BaseDialog.Viewport className="seal-popup-viewport seal-dialog-viewport">
          <BaseDialog.Popup className="seal-popup seal-popup--dialog seal-dialog-popup">
            {hideCloseButton ? null : (
              /* Крестик — наш Button через документированный `render` Base UI (Button
                 мержит инжектируемые частью пропсы через mergeProps, иначе Close не работал бы). */
              <BaseDialog.Close
                render={
                  <Button size="icon" variant="ghost" aria-label="Close">
                    <X size={16} aria-hidden />
                  </Button>
                }
                className="seal-dialog-close"
              >
                {null}
              </BaseDialog.Close>
            )}
            <DialogHeader>
              <BaseDialog.Title className="seal-dialog-title">{title}</BaseDialog.Title>
              {description ? (
                <BaseDialog.Description className="seal-dialog-description">{description}</BaseDialog.Description>
              ) : null}
            </DialogHeader>
            {children}
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
