import type { ReactNode } from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;

export type SliderRootProps = Sealed<BaseSlider.Root.Props>;
/** Состояния и причины событий частей Base UI Slider 1.8 (для колбэков и render-функций). */
export type SliderRootState = BaseSlider.Root.State;
export type SliderRootChangeEventReason = BaseSlider.Root.ChangeEventReason;
export type SliderRootChangeEventDetails = BaseSlider.Root.ChangeEventDetails;
export type SliderRootCommitEventReason = BaseSlider.Root.CommitEventReason;
export type SliderRootCommitEventDetails = BaseSlider.Root.CommitEventDetails;
export type SliderLabelState = BaseSlider.Label.State;
export type SliderValueState = BaseSlider.Value.State;
export type SliderControlState = BaseSlider.Control.State;
export type SliderTrackState = BaseSlider.Track.State;
export type SliderIndicatorState = BaseSlider.Indicator.State;
export type SliderThumbState = BaseSlider.Thumb.State;
export type SliderLabelProps = Sealed<BaseSlider.Label.Props>;
export type SliderValueProps = Sealed<BaseSlider.Value.Props>;
export type SliderControlProps = Sealed<BaseSlider.Control.Props>;
export type SliderTrackProps = Sealed<BaseSlider.Track.Props>;
export type SliderIndicatorProps = Sealed<BaseSlider.Indicator.Props>;
export type SliderThumbProps = Sealed<BaseSlider.Thumb.Props>;

/** Корень слайдера; все части Base UI 1.8 доступны отдельно. */
export function SliderRoot({ children, ...props }: SliderRootProps) {
  return (
    <BaseSlider.Root className="seal-slider" {...props}>
      {children}
    </BaseSlider.Root>
  );
}

export function SliderLabel({ children, ...props }: SliderLabelProps) {
  return (
    <BaseSlider.Label className="seal-progress-label seal-slider-label" {...props}>
      {children}
    </BaseSlider.Label>
  );
}

export function SliderValue({ children, ...props }: SliderValueProps) {
  return (
    <BaseSlider.Value className="seal-progress-value seal-slider-value" {...props}>
      {children}
    </BaseSlider.Value>
  );
}

export function SliderControl({ children, ...props }: SliderControlProps) {
  return (
    <BaseSlider.Control className="seal-slider-control" {...props}>
      {children}
    </BaseSlider.Control>
  );
}

export function SliderTrack({ children, ...props }: SliderTrackProps) {
  return (
    <BaseSlider.Track className="seal-slider-track" {...props}>
      {children}
    </BaseSlider.Track>
  );
}

export function SliderIndicator(props: SliderIndicatorProps) {
  return <BaseSlider.Indicator className="seal-slider-indicator" {...props} />;
}

export function SliderThumb(props: SliderThumbProps) {
  return <BaseSlider.Thumb className="seal-slider-thumb" {...props} />;
}

export const SliderParts = {
  Root: SliderRoot,
  Label: SliderLabel,
  Value: SliderValue,
  Control: SliderControl,
  Track: SliderTrack,
  Indicator: SliderIndicator,
  Thumb: SliderThumb,
};

type SliderValueType = number | readonly number[];

export type SliderProps = Omit<
  SliderRootProps,
  'children' | 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommitted'
> & {
  /** Управляемое значение; массив — диапазон (ползунок на каждое значение). */
  value?: SliderValueType;
  defaultValue?: SliderValueType;
  onValueChange?: (value: SliderValueType, eventDetails: SliderRootChangeEventDetails) => void;
  onValueCommitted?: (value: SliderValueType, eventDetails: SliderRootCommitEventDetails) => void;
  /** Подпись над треком (Base UI Slider.Label). */
  label?: ReactNode;
  /** Текущее значение справа от подписи (Base UI Slider.Value). */
  showValue?: boolean;
  /** aria-label для ползунков (для диапазона — по индексу). */
  thumbLabels?: readonly string[];
  /** Деления вдоль трека (документированный паттерн Slider marks). */
  marks?: readonly number[];
  /** Подписи делений под треком. */
  markLabels?: readonly string[];
};

function valueToPercent(value: number, min: number, max: number) {
  if (max === min) {
    return 0;
  }
  return ((value - min) / (max - min)) * 100;
}

/**
 * Ползунок Base UI 1.8 в Polar-визуальном языке (Polar своего слайдера не имеет):
 * подпись и значение носят КАНОНИЧЕСКИЕ классы `seal-progress-*` (общий источник
 * с `Progress`/`Meter`), цвет трека/заливки — те же токены Polar
 * (`--seal-progress-track` / `--seal-progress-indicator`), ползунок — круг
 * с акцентной рамкой как у Radio.
 *
 * Почему у трека/индикатора остаются свои `seal-slider-*` классы (а не канон):
 * канонический `.seal-progress-track` содержит `overflow: hidden` — он обрезал бы
 * ползунок 16px, выходящий за границы трека; канонический
 * `.seal-progress-indicator` жёстко задаёт `height: 8px`, что ломает вертикальную
 * ориентацию (`data-orientation='vertical'`), где Base UI отдаёт высоту через
 * `height: inherit`. Это раскладка трека, а не его вид — тот же случай, что
 * модификаторы в `REUSE.md` §4.
 */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  label,
  showValue = false,
  thumbLabels,
  marks,
  markLabels,
  ...rootProps
}: SliderProps) {
  const values = value ?? defaultValue;
  const thumbCount = values === undefined || typeof values === 'number' ? 1 : values.length;
  const min = rootProps.min ?? 0;
  const max = rootProps.max ?? 100;
  const valueProps: BaseSlider.Root.Props = {
    value,
    defaultValue,
    onValueChange,
    onValueCommitted,
  };

  // Композиция — из СВОИХ частей выше (как в Select.tsx), а не из сырых `BaseSlider.*`:
  // строки классов и их значения живут в одном месте файла.
  return (
    <SliderRoot {...rootProps} {...valueProps}>
      {label !== undefined || showValue ? (
        <div className="seal-slider-header">
          {label !== undefined ? <SliderLabel>{label}</SliderLabel> : null}
          {showValue ? <SliderValue /> : null}
        </div>
      ) : null}
      <SliderControl>
        <SliderTrack>
          <SliderIndicator />
          {marks
            ? marks.map((mark) => (
                <div
                  key={mark}
                  aria-hidden
                  className="seal-slider-mark"
                  style={{ insetInlineStart: `${valueToPercent(mark, min, max)}%` }}
                />
              ))
            : null}
          {Array.from({ length: thumbCount }, (_, index) => (
            <SliderThumb
              key={index}
              index={thumbCount > 1 ? index : undefined}
              aria-label={thumbLabels?.[index]}
            />
          ))}
        </SliderTrack>
      </SliderControl>
      {marks && markLabels ? (
        <div className="seal-slider-mark-labels">
          {marks.map((mark, index) =>
            markLabels[index] === undefined ? null : (
              <span
                key={mark}
                aria-hidden
                className="seal-slider-mark-label"
                style={{ insetInlineStart: `${valueToPercent(mark, min, max)}%` }}
              >
                {markLabels[index]}
              </span>
            ),
          )}
        </div>
      ) : null}
    </SliderRoot>
  );
}
