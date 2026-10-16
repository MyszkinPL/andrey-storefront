import type { ComponentProps, ReactNode, Ref } from 'react';
import { Input as BaseInput } from '@base-ui/react';

/**
 * Единственный источник правды для вида поля: один и тот же класс носят
 * Input и Field.Control, поэтому вид поля описан ровно в одном месте CSS.
 */
export const INPUT_CLASS = 'seal-input';

/**
 * Base UI Input: автоматически работает внутри Field (валидация, aria-связи).
 * Пропсы — полный набор Base UI 1.8 (`@base-ui/react/input`), то есть все
 * нативные атрибуты input, плюс Polar-слоты orbit/Input `preSlot`/`postSlot`.
 */
export type InputProps = Omit<ComponentProps<typeof BaseInput>, 'className' | 'style' | 'render' | 'ref'> & {
  ref?: Ref<HTMLElement>;
  /** Слот слева от текста (Polar orbit/Input preSlot): иконка/валюта. */
  preSlot?: ReactNode;
  /** Слот справа от текста (Polar orbit/Input postSlot): суффикс/единицы. */
  postSlot?: ReactNode;
};

export function Input({ preSlot, postSlot, ref, ...props }: InputProps) {
  // value/onValueChange/defaultValue и вся field-интеграция — целиком Base UI.
  const control = (
    <BaseInput
      ref={ref}
      className={INPUT_CLASS}
      data-slot-pre={preSlot ? '' : undefined}
      data-slot-post={postSlot ? '' : undefined}
      {...props}
    />
  );

  if (!preSlot && !postSlot) {
    return control;
  }

  return (
    <span className="seal-input-wrap">
      {control}
      {preSlot ? <span className="seal-input-slot seal-input-slot-pre">{preSlot}</span> : null}
      {postSlot ? <span className="seal-input-slot seal-input-slot-post">{postSlot}</span> : null}
    </span>
  );
}

/**
 * Нативный textarea — отдельного компонента в Base UI нет. Пропсы и вид
 * взяты из Polar orbit/TextArea (min-h 120px, radius-2xl, p-4, resizable).
 */
export type TextareaProps = Omit<ComponentProps<'textarea'>, 'className' | 'style' | 'ref'> & {
  ref?: Ref<HTMLTextAreaElement>;
  /** Polar orbit/TextArea: false → resize: none. */
  resizable?: boolean;
};

export function Textarea({ resizable = true, ref, ...props }: TextareaProps) {
  return (
    <textarea
      ref={ref}
      className={`${INPUT_CLASS} seal-textarea`}
      data-resizable={resizable ? undefined : 'false'}
      {...props}
    />
  );
}
