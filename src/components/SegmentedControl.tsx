import { ToggleGroup as BaseToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle as BaseToggle } from '@base-ui/react/toggle';

export type SegmentedSize = 'sm' | 'md' | 'lg';
export type SegmentedVariant = 'default' | 'tabs';
export type SegmentedOrientation = 'horizontal' | 'vertical';
/** Полное событие Base UI `ToggleGroup` (reason/details) — без потерь наружу. */
export type SegmentedChangeEventDetails = BaseToggleGroup.ChangeEventDetails;

export type SegmentedOption = {
  value: string;
  label: string;
};

/** Общая часть API — одинакова в обоих режимах Base UI ToggleGroup. */
type SegmentedControlBaseProps = {
  options: SegmentedOption[];
  size?: SegmentedSize;
  /** default: капсулы; tabs: во всю ширину (Polar-вариант). */
  variant?: SegmentedVariant;
  /** Base UI `ToggleGroup.orientation` (Polar: горизонтальная капсула). */
  orientation?: SegmentedOrientation;
  /** Base UI `ToggleGroup.loopFocus` — фокус зацикливается на концах группы. */
  loopFocus?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
};

/**
 * Single-режим — то, что есть в Polar: выбран ровно один сегмент
 * (Base UI `ToggleGroup multiple={false}`).
 */
export type SegmentedControlSingleProps = SegmentedControlBaseProps & {
  multiple?: false;
  /** Выбранный сегмент — контролируемый режим. */
  value?: string;
  /** Base UI `ToggleGroup.defaultValue` — неконтролируемый режим. */
  defaultValue?: string;
  onValueChange: (value: string, eventDetails: SegmentedChangeEventDetails) => void;
};

/**
 * Multiple-режим — Base UI `ToggleGroup multiple` (в Polar такого контрола нет,
 * поэтому вид остаётся Polar-капсулой, а семантику задаёт сам Base UI).
 */
export type SegmentedControlMultipleProps = SegmentedControlBaseProps & {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange: (value: string[], eventDetails: SegmentedChangeEventDetails) => void;
};

export type SegmentedControlProps = SegmentedControlSingleProps | SegmentedControlMultipleProps;

/**
 * Polar SegmentedControl: капсула (p-1, gap-1, rounded-full), активный пункт
 * bg-white / в тёмной polar-700 (вариант tabs — polar-800) c tенью shadow-lg.
 *
 * Поведение целиком на Base UI ToggleGroup: single-режим (`multiple={false}`),
 * roving focus стрелками, `loopFocus`, `aria-pressed` на пунктах — нажатое
 * состояние в CSS читается из одного источника (aria-pressed самой части),
 * поэтому собственный `data-active` больше не нужен.
 */
export function SegmentedControl(props: SegmentedControlProps) {
  const {
    options,
    size = 'md',
    variant = 'default',
    orientation = 'horizontal',
    loopFocus = true,
    disabled = false,
    'aria-label': ariaLabel,
  } = props;

  const multiple = props.multiple === true;
  // Base UI ToggleGroup всегда работает с массивом значений; в single-режиме
  // наружу отдаём одиночное значение (тип это и обещает).
  const toArray = (value: string | string[] | undefined): string[] | undefined =>
    value === undefined ? undefined : Array.isArray(value) ? value : [value];
  const emit = props.onValueChange as (
    value: string | string[],
    eventDetails: SegmentedChangeEventDetails,
  ) => void;

  const controlledValue = toArray(props.value);
  const uncontrolledValue = props.value === undefined ? toArray(props.defaultValue) : undefined;
  return (
    <BaseToggleGroup
      className="seal-segmented"
      data-size={size}
      data-variant={variant}
      orientation={orientation}
      loopFocus={loopFocus}
      value={controlledValue}
      defaultValue={uncontrolledValue}
      onValueChange={(groupValue, eventDetails) => {
        if (multiple) {
          emit(groupValue, eventDetails);
          return;
        }
        // Single-режим Base UI отдаёт массив; пустой = активный пункт снят.
        emit(groupValue.length > 0 ? groupValue[groupValue.length - 1] : '', eventDetails);
      }}
      disabled={disabled}
      multiple={multiple}
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <BaseToggle key={option.value} className="seal-segmented-item" value={option.value}>
          {option.label}
        </BaseToggle>
      ))}
    </BaseToggleGroup>
  );
}
