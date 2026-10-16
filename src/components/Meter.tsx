import type { ComponentProps } from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';

/** Закрытый API: className/style снаружи недоступны. */
type Closed<T> = Omit<T, 'className' | 'style'>;

/**
 * Base UI Meter (Root / Label / Value / Track / Indicator). Polar-компонента
 * нет, поэтому оформлен в Polar-языке прогресса: трек/заливка/подпись/значение
 * носят те же канонические классы, что `Progress` (`seal-progress-*`),
 * а `seal-meter-*` остаются только дельтами раскладки (grid-строка трека,
 * выравнивание значения). Вид элемента просмотра — один источник правды.
 * Семантика другая: Meter — значение измерения в диапазоне, не загрузка.
 */
export type MeterRootProps = Closed<ComponentProps<typeof BaseMeter.Root>>;
export type MeterLabelProps = Closed<ComponentProps<typeof BaseMeter.Label>>;
export type MeterValueProps = Closed<ComponentProps<typeof BaseMeter.Value>>;
export type MeterTrackProps = Closed<ComponentProps<typeof BaseMeter.Track>>;
export type MeterIndicatorProps = Closed<ComponentProps<typeof BaseMeter.Indicator>>;

export function MeterRoot({ children, ...props }: MeterRootProps) {
  return (
    <BaseMeter.Root {...props} className="seal-meter">
      {children}
    </BaseMeter.Root>
  );
}

export function MeterLabel({ children, ...props }: MeterLabelProps) {
  return (
    <BaseMeter.Label {...props} className="seal-progress-label seal-meter-label">
      {children}
    </BaseMeter.Label>
  );
}

export function MeterValue({ children, ...props }: MeterValueProps) {
  return (
    <BaseMeter.Value {...props} className="seal-progress-value seal-meter-value">
      {children}
    </BaseMeter.Value>
  );
}

export function MeterTrack({ children, ...props }: MeterTrackProps) {
  return (
    <BaseMeter.Track {...props} className="seal-progress-track seal-meter-track">
      {children}
    </BaseMeter.Track>
  );
}

export function MeterIndicator(props: MeterIndicatorProps) {
  return <BaseMeter.Indicator {...props} className="seal-progress-indicator seal-meter-indicator" />;
}

/** Все части Base UI Meter с Polar-классами. */
export const MeterParts = {
  Root: MeterRoot,
  Label: MeterLabel,
  Value: MeterValue,
  Track: MeterTrack,
  Indicator: MeterIndicator,
};

export type MeterProps = MeterRootProps & {
  /** Подпись слева от значения. */
  label?: string;
  /** Показывать значение (Meter.Value) справа от подписи. */
  showValue?: boolean;
};

/**
 * Готовый измеритель: подпись, значение справа, трек во всю ширину.
 * Любая другая раскладка собирается из `MeterParts`.
 */
export function Meter({ label, showValue = true, 'aria-label': ariaLabel, ...props }: MeterProps) {
  // Композиция — из СВОИХ частей выше, а не из сырых `BaseMeter.*`:
  // строки классов и значения живут ровно в одном месте.
  return (
    <MeterRoot {...props} aria-label={ariaLabel ?? label}>
      {label ? <MeterLabel>{label}</MeterLabel> : null}
      {showValue ? <MeterValue /> : null}
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </MeterRoot>
  );
}
