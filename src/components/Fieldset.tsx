import type { ReactNode, Ref } from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react';
import type {
  FieldsetRootProps as BaseFieldsetRootProps,
  FieldsetLegendProps as BaseFieldsetLegendProps,
} from '@base-ui/react/fieldset';

type WithoutStyling<T> = Omit<T, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Props & { ref?: Ref<Element> };

export type FieldsetRootProps = WithRef<WithoutStyling<BaseFieldsetRootProps>, HTMLElement>;
export type FieldsetLegendProps = WithRef<WithoutStyling<BaseFieldsetLegendProps>, HTMLDivElement>;

/** Base UI Fieldset.Root — нативный `<fieldset>` без браузерной рамки и отступов. */
export function FieldsetRoot({ children, ref, ...props }: FieldsetRootProps) {
  return (
    <BaseFieldset.Root ref={ref} className="seal-fieldset" {...props}>
      {children}
    </BaseFieldset.Root>
  );
}

/** Base UI Fieldset.Legend — подпись группы (Polar-стиль 14px/500). */
export function FieldsetLegend({ children, ref, ...props }: FieldsetLegendProps) {
  return (
    <BaseFieldset.Legend ref={ref} className="seal-fieldset-legend" {...props}>
      {children}
    </BaseFieldset.Legend>
  );
}

/**
 * Готовая группа: Root + Legend. Все пропсы Fieldset.Root (disabled, name,
 * form, id и нативные атрибуты `<fieldset>`) прокидываются как есть.
 */
export type FieldsetProps = Omit<FieldsetRootProps, 'children'> & {
  legend?: ReactNode;
  children: ReactNode;
};

export function Fieldset({ legend, children, ...props }: FieldsetProps) {
  return (
    <FieldsetRoot {...props}>
      {legend ? <FieldsetLegend>{legend}</FieldsetLegend> : null}
      {children}
    </FieldsetRoot>
  );
}

/** Обе части Base UI Fieldset 1.8 с Polar-оформлением. */
export const FieldsetParts = {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
} as const;
