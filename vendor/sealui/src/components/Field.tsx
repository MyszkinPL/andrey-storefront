import type { ReactNode, Ref } from 'react';
import { Field as BaseField } from '@base-ui/react';
import type {
  FieldRootProps as BaseFieldRootProps,
  FieldLabelProps as BaseFieldLabelProps,
  FieldControlProps as BaseFieldControlProps,
  FieldItemProps as BaseFieldItemProps,
  FieldDescriptionProps as BaseFieldDescriptionProps,
  FieldErrorProps as BaseFieldErrorProps,
  FieldValidityProps as BaseFieldValidityProps,
} from '@base-ui/react/field';
import { INPUT_CLASS } from './Input';

/** Пропсы части Base UI без стилевых escape-hatch: sealui — закрытая система. */
type WithoutStyling<T> = Omit<T, 'className' | 'style' | 'render'>;
/**
 * Все части Field — forwardRef-компоненты Base UI (`RefAttributes<...>` в их
 * .d.ts), поэтому ref принимаем и прокидываем ровно с их типом элемента.
 */
type WithRef<Props, Element> = Props & { ref?: Ref<Element> };

export type FieldRootProps = WithRef<WithoutStyling<BaseFieldRootProps>, HTMLDivElement>;
export type FieldLabelProps = WithRef<WithoutStyling<BaseFieldLabelProps>, HTMLElement>;
export type FieldControlProps = WithRef<WithoutStyling<BaseFieldControlProps>, HTMLElement>;
export type FieldItemProps = WithRef<WithoutStyling<BaseFieldItemProps>, HTMLDivElement>;
export type FieldDescriptionProps = WithRef<WithoutStyling<BaseFieldDescriptionProps>, HTMLParagraphElement>;
export type FieldErrorProps = WithRef<WithoutStyling<BaseFieldErrorProps>, HTMLDivElement>;
/** Field.Validity принимает только children-функцию состояния — запечатывать нечего. */
export type FieldValidityProps = BaseFieldValidityProps;

export type FieldValidationMode = NonNullable<FieldRootProps['validationMode']>;

/**
 * Обёртка поля (Base UI Field.Root) в Polar-стиле: лейбл 14/500 leading-none,
 * описание и ошибка 14px muted/danger, gap 8px (Polar ui/form: space-y-2).
 * Все пропсы Field.Root (name, disabled, invalid, dirty, touched, validate,
 * validationMode, validationDebounceTime, actionsRef, …) прокидываются как есть.
 */
export type FieldProps = Omit<FieldRootProps, 'children'> & {
  label?: ReactNode;
  description?: ReactNode;
  /** Внешняя ошибка — показывается всегда, когда непустая (Field.Error `match`). */
  error?: ReactNode;
  /**
   * Base UI Field.Label `nativeLabel`. Дока предписывает `false` для
   * контролов-`<button>` (наш Select.Trigger, Combobox.Trigger): иначе подпись
   * наследует поведение `<label>` и hover/клик уходят в кнопку.
   */
  nativeLabel?: boolean;
  children: ReactNode;
};

export function Field({ label, description, error, nativeLabel, children, ref, ...props }: FieldProps) {
  return (
    <BaseField.Root ref={ref} className="seal-field" {...props}>
      {label ? <FieldLabel nativeLabel={nativeLabel}>{label}</FieldLabel> : null}
      {children}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError match={error ? true : undefined}>{error}</FieldError>
    </BaseField.Root>
  );
}

/** Подпись поля (Base UI Field.Label). */
export function FieldLabel({ children, ref, ...props }: FieldLabelProps) {
  // Base UI: with `nativeLabel={false}` the label must not be a <label>
  // (a <label> would forward clicks into a <button> control such as
  // Select.Trigger), so the part is rendered as a <span> in that case.
  const render = props.nativeLabel === false ? <span /> : undefined;
  return (
    <BaseField.Label ref={ref} className="seal-field-label" render={render} {...props}>
      {children}
    </BaseField.Label>
  );
}

/**
 * Сам контрол поля (Base UI Field.Control) — носит тот же класс вида, что и
 * Input (`INPUT_CLASS`), поэтому вид поля описан один раз.
 */
export function FieldControl({ ref, ...props }: FieldControlProps) {
  return <BaseField.Control ref={ref} className={INPUT_CLASS} {...props} />;
}

/** Строка группы (Base UI Field.Item): контрол + лейбл + описание. */
export function FieldItem({ children, ref, ...props }: FieldItemProps) {
  return (
    <BaseField.Item ref={ref} className="seal-field-item" {...props}>
      {children}
    </BaseField.Item>
  );
}

/** Описание поля (Base UI Field.Description). */
export function FieldDescription({ children, ref, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description ref={ref} className="seal-field-description" {...props}>
      {children}
    </BaseField.Description>
  );
}

/**
 * Сообщение об ошибке (Base UI Field.Error). Без children автоматически
 * показывает нативное сообщение контрола; `match` показывает сообщение по
 * состоянию валидности (или всегда, при `match`).
 */
export function FieldError({ children, ref, ...props }: FieldErrorProps) {
  return (
    <BaseField.Error ref={ref} className="seal-field-error" {...props}>
      {children}
    </BaseField.Error>
  );
}

/** Кастомное сообщение по состоянию валидности (Base UI Field.Validity). */
export function FieldValidity(props: FieldValidityProps) {
  return <BaseField.Validity {...props} />;
}

/** Все части Base UI Field 1.8 с Polar-оформлением. */
export const FieldParts = {
  Root: Field,
  Label: FieldLabel,
  Control: FieldControl,
  Item: FieldItem,
  Description: FieldDescription,
  Error: FieldError,
  Validity: FieldValidity,
} as const;
