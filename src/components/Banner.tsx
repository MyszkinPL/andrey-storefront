import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from 'lucide-react';
import type { MouseEventHandler, ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { Text, type TextTone } from './Text';

export type BannerVariant = 'info' | 'warning' | 'danger' | 'success';

export type BannerAction = {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  /** Иконка слева, как у Button (Polar ButtonGroupActions передают ButtonProps целиком). */
  icon?: ReactNode;
  /** Спиннер вместо текста, кнопка при этом заблокирована. */
  loading?: boolean;
  disabled?: boolean;
};

export type BannerProps = {
  /**
   * Выбирает иконку, цвет акцента и заголовка в один шаг — как orbit Alert.
   * info → нейтральный, warning/danger/success → свои текстовые токены.
   */
  variant?: BannerVariant;
  /** Заголовок баннера, окрашивается в цвет варианта. */
  title: string;
  /** Пояснение под заголовком, приглушённый тон. */
  description?: ReactNode;
  /** Меняет иконку варианта на спиннер, тон и раскладка не меняются. */
  loading?: boolean;
  /** Задан → рендерится кнопка-крестик; не задан → баннер постоянный. */
  onDismiss?: () => void;
  /** До двух действий: первое primary, остальные ghost (ButtonGroup orbit). */
  actions?: BannerAction[];
};

const variantIcons = {
  info: Info,
  warning: TriangleAlert,
  danger: CircleAlert,
  success: CircleCheck,
} as const;

// orbit Alert: variant → accentColor заголовка/иконки; info — базовый тон текста.
const variantTones: Record<BannerVariant, TextTone> = {
  info: 'default',
  warning: 'warning',
  danger: 'danger',
  success: 'success',
};

export function Banner({
  variant = 'info',
  title,
  description,
  loading = false,
  onDismiss,
  actions,
}: BannerProps) {
  const Icon = loading ? LoaderCircle : variantIcons[variant];
  return (
    <div className="seal-banner" data-variant={variant} data-dismissable={onDismiss ? '' : undefined}>
      <span className="seal-banner-icon" data-spin={loading ? '' : undefined}>
        <Icon size={16} aria-hidden />
      </span>
      <span className="seal-banner-title">
        {/* orbit Alert.tsx: <Text color={accentColor} variant="title" wrap="pretty"> */}
        <Text as="span" tone={variantTones[variant]} wrap="pretty">
          {title}
        </Text>
      </span>
      {onDismiss ? (
        <button type="button" className="seal-banner-dismiss" onClick={onDismiss} aria-label="Dismiss">
          <span className="seal-banner-dismiss-x" aria-hidden>
            <X size={16} />
          </span>
        </button>
      ) : null}
      {description ? (
        <span className="seal-banner-description">
          <Text as="span" tone="muted">
            {description}
          </Text>
        </span>
      ) : null}
      {actions && actions.length > 0 ? (
        <span className="seal-banner-actions">
          {actions.map((action, index) => (
            <Button
              key={`${action.label}-${index}`}
              size="sm"
              variant={action.variant ?? (index === 0 ? 'primary' : 'ghost')}
              icon={action.icon}
              loading={action.loading}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </span>
      ) : null}
    </div>
  );
}
