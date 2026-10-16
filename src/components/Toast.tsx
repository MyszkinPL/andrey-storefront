import type { ComponentProps, ReactNode } from 'react';
import { CircleAlert, CircleCheck, CircleX, Info, X } from 'lucide-react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { Button } from './Button';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Направление свайпа для досрочного закрытия (Base UI Toast.Root.swipeDirection). */
export type ToastSwipeDirection = Sealed<BaseToast.Root.Props>['swipeDirection'];

const TOAST_ICONS: Record<ToastVariant, ReactNode> = {
  info: <Info size={16} aria-hidden />,
  success: <CircleCheck size={16} aria-hidden />,
  warning: <CircleAlert size={16} aria-hidden />,
  danger: <CircleX size={16} aria-hidden />,
};

function normalizeVariant(type: string | undefined): ToastVariant {
  // Base UI отдаёт `error`; в нашей палитре это danger-вариант с тем же кругом-крестом.
  if (type === 'error') {
    return 'danger';
  }
  return type === 'success' || type === 'warning' || type === 'danger' ? type : 'info';
}

export type ToastRootProps = Sealed<BaseToast.Root.Props>;
export type ToastContentProps = Sealed<BaseToast.Content.Props>;
export type ToastTitleProps = Sealed<BaseToast.Title.Props>;
export type ToastDescriptionProps = Sealed<BaseToast.Description.Props>;
export type ToastActionProps = Sealed<BaseToast.Action.Props>;
export type ToastCloseProps = Sealed<BaseToast.Close.Props>;
export type ToastPortalProps = Sealed<BaseToast.Portal.Props>;
export type ToastViewportProps = Sealed<BaseToast.Viewport.Props>;
export type ToastPositionerProps = Sealed<BaseToast.Positioner.Props>;
export type ToastArrowProps = Sealed<BaseToast.Arrow.Props>;

/** Провайдер стопки тостов (Base UI Toast.Provider): таймаут, лимит, внешний менеджер. */
export type ToastProviderProps = ComponentProps<typeof BaseToast.Provider>;

export function ToastProvider({ children, ...props }: ToastProviderProps) {
  return <BaseToast.Provider {...props}>{children}</BaseToast.Provider>;
}

export function ToastRoot({ children, ...props }: ToastRootProps) {
  return (
    <BaseToast.Root className="seal-toast" {...props}>
      {children}
    </BaseToast.Root>
  );
}

export function ToastContent({ children, ...props }: ToastContentProps) {
  return (
    <BaseToast.Content className="seal-toast-content" {...props}>
      {children}
    </BaseToast.Content>
  );
}

export function ToastTitle({ children, ...props }: ToastTitleProps) {
  return (
    <BaseToast.Title className="seal-toast-title" {...props}>
      {children}
    </BaseToast.Title>
  );
}

export function ToastDescription({ children, ...props }: ToastDescriptionProps) {
  return (
    <BaseToast.Description className="seal-toast-description" {...props}>
      {children}
    </BaseToast.Description>
  );
}

/**
 * Действие тоста — наш Button (Base UI Toast.Action сохраняет поведение и
 * пробрасывает ARIA/фокус), поэтому отдельного CSS для кнопки тоста нет.
 */
export function ToastAction({ children, ...props }: ToastActionProps) {
  return (
    <BaseToast.Action
      {...props}
      render={<Button size="sm" variant="secondary">{children}</Button>}
    >
      {null}
    </BaseToast.Action>
  );
}

/** Закрытие тоста — наш Button: тот же фокус-ринг и hover, что у остальных кнопок. */
export function ToastClose({ children, ...props }: ToastCloseProps) {
  return (
    <BaseToast.Close
      {...props}
      aria-label="Dismiss notification"
      render={
        <Button size="sm" variant="ghost" aria-label="Dismiss notification">
          {children ?? <X size={16} aria-hidden />}
        </Button>
      }
    >
      {null}
    </BaseToast.Close>
  );
}

export function ToastPortal({ children, ...props }: ToastPortalProps) {
  return <BaseToast.Portal {...props}>{children}</BaseToast.Portal>;
}

export function ToastViewport({ children, ...props }: ToastViewportProps) {
  return (
    <BaseToast.Viewport className="seal-toast-viewport" {...props}>
      {children}
    </BaseToast.Viewport>
  );
}

export function ToastPositioner({ children, ...props }: ToastPositionerProps) {
  return (
    <BaseToast.Positioner className="seal-toast-positioner" {...props}>
      {children}
    </BaseToast.Positioner>
  );
}

export function ToastArrow(props: ToastArrowProps) {
  return <BaseToast.Arrow className="seal-toast-arrow" {...props} />;
}

export const ToastParts = {
  Provider: ToastProvider,
  Portal: ToastPortal,
  Viewport: ToastViewport,
  Root: ToastRoot,
  Content: ToastContent,
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose,
  Positioner: ToastPositioner,
  Arrow: ToastArrow,
};

export type ToasterProps = {
  /** К какому краю вьюпорта прижимать стопку (Base UI Toasts можно позиционировать сами). */
  position?: ToastPosition;
  /** Показывать кнопку закрытия на каждом тосте. */
  dismissible?: boolean;
  /** Показывать кнопку действия, если у тоста передан `actionProps`. */
  showAction?: boolean;
  /** Направление свайпа для закрытия (Base UI Root.swipeDirection): 'down' по умолчанию. */
  swipeDirection?: ToastSwipeDirection;
};

/**
 * Рендерер стопки тостов: Polar-язык (поверхность popover, radius 12, тень lg,
 * иконка варианта статусным цветом, подпись 14/500 + описание muted).
 * Ставится один раз внутри `ToastProvider`.
 *
 * Собирается только из СВОИХ частей (`ToastPortal`/`ToastViewport`/`ToastRoot`/
 * `ToastContent`/`ToastTitle`/`ToastDescription`/`ToastAction`/`ToastClose`) —
 * одно место правды по классам и разметке; сырых `BaseToast.*` здесь нет.
 */
export function Toaster({
  position = 'bottom-right',
  dismissible = true,
  showAction = true,
  swipeDirection,
}: ToasterProps) {
  const { toasts } = useToast();
  return (
    <ToastPortal>
      <ToastViewport data-position={position}>
        {toasts.map((toast) => {
          const variant = normalizeVariant(toast.type);
          return (
            <ToastRoot
              key={toast.id}
              toast={toast}
              swipeDirection={swipeDirection}
              data-variant={variant}
            >
              <ToastContent>
                <span className="seal-toast-icon" data-variant={variant}>
                  {TOAST_ICONS[variant]}
                </span>
                <span className="seal-toast-text">
                  <ToastTitle />
                  <ToastDescription />
                </span>
                {showAction && toast.actionProps ? <ToastAction /> : null}
                {dismissible ? <ToastClose /> : null}
              </ToastContent>
            </ToastRoot>
          );
        })}
      </ToastViewport>
    </ToastPortal>
  );
}

/** Менеджер тостов Base UI: `{ toasts, add, close, update, promise }`. */
export const useToast = BaseToast.useToastManager;

/** Глобальный менеджер тостов Base UI — можно звать вне React-дерева. */
export const createToastManager = BaseToast.createToastManager;
