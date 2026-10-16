import type { ReactNode } from 'react';

export type DetailRowProps = {
  /** Подпись слева, приглушённая и обрезаемая. */
  label: ReactNode;
  /** Значение справа; без него рендерится «—» приглушённым тоном. */
  value?: ReactNode;
  /** Действие, проступающее при наведении на значение (шаблон Polar). */
  action?: ReactNode;
  /** Моно-шрифт для идентификаторов — как valueClassName="font-mono" у Polar. */
  mono?: boolean;
};

export function DetailRow({ label, value, action, mono = false }: DetailRowProps) {
  // Донор (`apps/web/src/components/Shared/DetailRow.tsx`) использует `value ?? '—'`
  // и приглушает цвет по falsy-значению, а не только по null/undefined.
  const empty = !value;
  return (
    <div className="seal-detail-row">
      <h3 className="seal-detail-label">{label}</h3>
      <span
        className="seal-detail-value"
        data-mono={mono ? '' : undefined}
        data-empty={empty ? '' : undefined}
      >
        {empty ? '—' : value}
        {action ? <span className="seal-detail-value-action">{action}</span> : null}
      </span>
    </div>
  );
}
