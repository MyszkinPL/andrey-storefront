import type { ComponentProps, ReactNode } from 'react';
import { Form as BaseForm } from '@base-ui/react';
import type {
  FormActions as BaseFormActions,
  FormSubmitEventDetails,
  FormValidationMode as BaseFormValidationMode,
} from '@base-ui/react/form';

/** Значения формы — та же форма, что в Base UI (`Form.Values extends Record<string, any>`). */
export type FormValues = Record<string, any>;
export type FormValidationMode = BaseFormValidationMode;
export type FormActions = BaseFormActions;
export type { FormSubmitEventDetails };

/**
 * Base UI Form (+ все его пропсы: errors, validationMode, actionsRef, нативные
 * атрибуты `<form>`) плюс публичный типизированный генерик `Values`, как у самой
 * Base UI (`Form.Values`). Два контракта сабмита: короткий `onSubmit(values)` и
 * полный Base UI-колбэк `onFormSubmit(values, eventDetails)`.
 */
export type FormProps<Values extends FormValues = FormValues> = Omit<
  ComponentProps<typeof BaseForm>,
  'className' | 'style' | 'render' | 'onFormSubmit' | 'onSubmit'
> & {
  /** Короткая форма: только значения полей. */
  onSubmit?: (values: Values) => void;
  /** Полный контракт Base UI: значения + event details. */
  onFormSubmit?: (values: Values, eventDetails: FormSubmitEventDetails) => void;
  children: ReactNode;
};

/**
 * Форма (Base UI Form): нативная отправка, консолидация ошибок полей и
 * внешних (серверных) ошибок, валидация через actionsRef — вся логика Base UI.
 * Поля внутри — Field/Fieldset в нашем стиле.
 */
export function Form<Values extends FormValues = FormValues>({
  onSubmit,
  onFormSubmit,
  children,
  ...props
}: FormProps<Values>) {
  // Наружу отдаём типизированный Values, внутрь Base UI — его собственный
  // `Record<string, any>`; граница типов ровно здесь, без `any` в публичном API.
  const handleFormSubmit = onFormSubmit
    ? (values: FormValues, eventDetails: FormSubmitEventDetails) => onFormSubmit(values as Values, eventDetails)
    : onSubmit
      ? (values: FormValues) => onSubmit(values as Values)
      : undefined;

  return (
    <BaseForm className="seal-form" onFormSubmit={handleFormSubmit} {...props}>
      {children}
    </BaseForm>
  );
}
