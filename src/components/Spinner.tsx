export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  /** Диаметр: sm 16px, md 20px (orbit `h-5 w-5`), lg 24px. */
  size?: SpinnerSize;
  /** Доступное имя (aria-label + role="status"); без него спиннер декоративен (aria-hidden). */
  label?: string;
};

/**
 * Спиннер загрузки — порт orbit/Spinner (SpinnerNoMargin): svg-круг 25% +
 * дуга 75% текущего цвета, вращение 1s linear infinite (`seal-spin`).
 * В отличие от orbit-версии не несёт внешних отступов (mr-3 -ml-1) —
 * позиционирование остаётся за родительской раскладкой.
 */
export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <svg
      className="seal-spinner"
      data-size={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <circle className="seal-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="seal-spinner-arc"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
