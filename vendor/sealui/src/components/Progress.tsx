import type { ComponentProps, ReactNode, Ref } from 'react';
import { Progress as BaseProgress } from '@base-ui/react/progress';

// Как в Select.tsx: стилевые escape hatch’и (className/style/render) запечатаны.
type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Sealed<Props> & { ref?: Ref<Element> };

export type ProgressProps = {
  /** Base UI: `value` — текущее значение, `null` = indeterminate. */
  value?: number | null;
  /** Base UI `Progress.Root.min` (по умолчанию 0). */
  min?: number;
  /** Base UI `Progress.Root.max` (по умолчанию 100). */
  max?: number;
  /** Base UI `Progress.Root.format` — опции Intl.NumberFormat для Progress.Value. */
  format?: Intl.NumberFormatOptions;
  /** Base UI `Progress.Root.locale` — локаль форматирования значения. */
  locale?: Intl.LocalesArgument;
  /** Base UI `Progress.Root.getAriaValueText` — текст для скринридера. */
  getAriaValueText?: (formattedValue: string, value: number | null) => string;
  /** Base UI `Progress.Root.aria-valuetext`. */
  'aria-valuetext'?: string;
  /** Подпись над треком (Base UI Progress.Label). */
  label?: ReactNode;
  /** Показывать процент справа от трека. */
  showValue?: boolean;
  'aria-label'?: string;
};

/**
 * Polar прогресс (FileUploadProgress): трек h-2 gray-200/polar-700, полоса
 * blue-400, скругление sm. Indeterminate — без value.
 */
export function Progress({
  value = null,
  min = 0,
  max = 100,
  format,
  locale,
  getAriaValueText,
  'aria-valuetext': ariaValueText,
  label,
  showValue = false,
  'aria-label': ariaLabel,
}: ProgressProps) {
  // Композиция собирается из СВОИХ частей (как в Select.tsx), а не из сырых
  // `BaseProgress.*` с повторёнными строками классов: одни и те же классы
  // (`seal-progress-*`) объявлены ровно в одном месте файла — в частях ниже.
  return (
    <ProgressRoot
      value={value}
      min={min}
      max={max}
      format={format}
      locale={locale}
      getAriaValueText={getAriaValueText}
      aria-valuetext={ariaValueText}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
    >
      {label ? <ProgressLabel>{label}</ProgressLabel> : null}
      <div className="seal-progress-row">
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
        {showValue ? <ProgressValue /> : null}
      </div>
    </ProgressRoot>
  );
}

export type ProgressRootProps = WithRef<ComponentProps<typeof BaseProgress.Root>, HTMLDivElement>;
export type ProgressTrackProps = WithRef<ComponentProps<typeof BaseProgress.Track>, HTMLDivElement>;
export type ProgressIndicatorProps = WithRef<ComponentProps<typeof BaseProgress.Indicator>, HTMLDivElement>;
export type ProgressValueProps = WithRef<ComponentProps<typeof BaseProgress.Value>, HTMLSpanElement>;
export type ProgressLabelProps = WithRef<ComponentProps<typeof BaseProgress.Label>, HTMLSpanElement>;

export function ProgressRoot({ children, ref, ...props }: ProgressRootProps) {
  return (
    <BaseProgress.Root {...props} ref={ref} className="seal-progress">
      {children}
    </BaseProgress.Root>
  );
}

export function ProgressTrack({ children, ref, ...props }: ProgressTrackProps) {
  return (
    <BaseProgress.Track {...props} ref={ref} className="seal-progress-track">
      {children}
    </BaseProgress.Track>
  );
}

export function ProgressIndicator({ ref, ...props }: ProgressIndicatorProps) {
  return <BaseProgress.Indicator {...props} ref={ref} className="seal-progress-indicator" />;
}

export function ProgressValue({ ref, ...props }: ProgressValueProps) {
  return <BaseProgress.Value {...props} ref={ref} className="seal-progress-value" />;
}

export function ProgressLabel({ children, ref, ...props }: ProgressLabelProps) {
  return (
    <BaseProgress.Label {...props} ref={ref} className="seal-progress-label">
      {children}
    </BaseProgress.Label>
  );
}

/**
 * Все части Base UI Progress 1.8 (Root, Track, Indicator, Value, Label) в
 * Polar-стиле — для нестандартной разметки. Простой путь — компонент `Progress`.
 */
export const ProgressParts = {
  Root: ProgressRoot,
  Track: ProgressTrack,
  Indicator: ProgressIndicator,
  Value: ProgressValue,
  Label: ProgressLabel,
};
