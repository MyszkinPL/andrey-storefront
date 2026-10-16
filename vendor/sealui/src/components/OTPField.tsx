import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { OTPField as BaseOTPField } from '@base-ui/react/otp-field';

/** Закрытый API: className/style снаружи недоступны. */
type Closed<T> = Omit<T, 'className' | 'style'>;

/**
 * Base UI OTPField (Root / Input / Separator) в Polar-стиле `ui/input-otp`:
 * ячейки 40×40 с общими рамками (border-r у Polar, у нас −1px margin),
 * первая/последняя скруглены на radius-md, активная — 2px ring, gap 8.
 */
export type OTPFieldRootProps = Closed<ComponentProps<typeof BaseOTPField.Root>>;
export type OTPFieldInputProps = Closed<ComponentProps<typeof BaseOTPField.Input>>;
export type OTPFieldSeparatorProps = Closed<ComponentProps<typeof BaseOTPField.Separator>>;

export function OTPFieldRoot({ children, ...props }: OTPFieldRootProps) {
  return (
    <BaseOTPField.Root {...props} className="seal-otp-root">
      {children}
    </BaseOTPField.Root>
  );
}

export function OTPFieldInput(props: OTPFieldInputProps) {
  return <BaseOTPField.Input {...props} className="seal-otp-slot" />;
}

export function OTPFieldSeparator(props: OTPFieldSeparatorProps) {
  return <BaseOTPField.Separator {...props} className="seal-otp-separator" />;
}

/** Все части Base UI OTPField с Polar-классами. */
export const OTPFieldParts = {
  Root: OTPFieldRoot,
  Input: OTPFieldInput,
  Separator: OTPFieldSeparator,
};

export type OTPFieldProps = OTPFieldRootProps & {
  /** Подпись над ячейками (native label → id первого слота). */
  label?: ReactNode;
  /** Свой шаблон aria-label для слотов; по умолчанию «Character N of M». */
  slotAriaLabel?: (index: number, length: number) => string;
};

/**
 * Готовое поле: подпись + M слотов. Режимы Base UI (mask, validationType,
 * onValueComplete, autoSubmit, onValueInvalid, normalizeValue) передаются
 * напрямую в Root.
 */
export function OTPField({ label, slotAriaLabel, ...props }: OTPFieldProps) {
  const generatedId = useId();
  const rootId = props.id ?? generatedId;
  const { length } = props;

  return (
    <div className="seal-otp">
      {label ? (
        <label className="seal-otp-label" htmlFor={rootId}>
          {label}
        </label>
      ) : null}
      <OTPFieldRoot {...props} id={rootId}>
        {Array.from({ length }, (_, index) => (
          <OTPFieldInput
            key={index}
            aria-label={
              index === 0
                ? undefined
                : (slotAriaLabel?.(index, length) ?? `Character ${index + 1} of ${length}`)
            }
          />
        ))}
      </OTPFieldRoot>
    </div>
  );
}
