import type { CSSProperties, ElementType, ReactNode } from 'react';

/** 12 / 14 / 16 / 18 / 20 — Polar fontSizes[1..5] (tokens/value.stylex.ts:106). */
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'disabled'
  | 'accent'
  | 'warning'
  | 'success'
  /** Polar textColorStyles.danger */
  | 'danger'
  /** Polar textColorStyles.error — синоним danger (semantics.stylex.ts:143). */
  | 'error'
  | 'inverse'
  | 'inherit';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextWrap = 'wrap' | 'nowrap' | 'balance' | 'pretty';
/** Полный набор тегов Polar createText; роли heading остаются на Heading. */
export type TextTag = 'p' | 'span' | 'label' | 'strong' | 'em' | 'small' | 'code' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TextFormatter = 'number' | 'compact' | ((value: string | number) => string);

// Pinned locale: сервер и клиент дают идентичную строку (как в Polar createText).
const numberFormatter = new Intl.NumberFormat('en-US');
const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact' });

function applyFormatter(formatter: TextFormatter, value: string | number): string {
  if (typeof formatter === 'function') {
    return formatter(value);
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  return formatter === 'compact' ? compactFormatter.format(numeric) : numberFormatter.format(numeric);
}

export type TextProps = {
  size?: TextSize;
  tone?: TextTone;
  as?: TextTag;
  /** Горизонтальное выравнивание (Polar createText.align). */
  align?: TextAlign;
  /** Правила переноса строк (Polar createText.wrap). */
  wrap?: TextWrap;
  children?: ReactNode;
  /** Пульсирующий skeleton вместо текста (Polar createText.loading). */
  loading?: boolean;
  /** Текст-заготовка однострочного skeleton; по умолчанию берётся из children. */
  placeholderText?: string;
  /** Больше 1 — многострочный skeleton на столько строк. */
  placeholderNumberOfLines?: number;
  /** Моноширинное начертание с сохранением размера роли. */
  monospace?: boolean;
  /** Табличные цифры для ровных колонок в таблицах и метриках. */
  tabularNums?: boolean;
  /** Зачёркивание, например для старой цены. */
  lineThrough?: boolean;
  /** Обрезка переполнения: `true` — одна строка, число — столько строк. */
  truncate?: boolean | number;
  /** Форматирование значения, переданного в children. */
  formatter?: TextFormatter;
};

export function Text({
  size = 'sm',
  tone = 'default',
  as = 'p',
  align,
  wrap,
  children,
  loading = false,
  placeholderText,
  placeholderNumberOfLines,
  monospace = false,
  tabularNums = false,
  lineThrough = false,
  truncate,
  formatter,
}: TextProps) {
  // ElementType: union из 14 тегов Polar иначе слишком широко ломает вывод JSX-пропсов.
  const Tag: ElementType = as;

  const content: ReactNode =
    formatter !== undefined && (typeof children === 'string' || typeof children === 'number')
      ? applyFormatter(formatter, children)
      : children;

  let rendered: ReactNode = content;
  let loadingStyle: CSSProperties | undefined;

  if (loading) {
    const lines = placeholderNumberOfLines ?? 1;
    if (lines > 1) {
      rendered = (
        <span className="seal-text-skeleton-lines" aria-hidden>
          {Array.from({ length: lines }, (_, index) => (
            <span className="seal-text-skeleton-row" key={index}>
              <span
                className="seal-text-skeleton"
                style={{ width: index === lines - 1 ? '60%' : '100%' }}
              />
            </span>
          ))}
        </span>
      );
    } else {
      rendered = (
        <>
          <span className="seal-text-skeleton-placeholder" aria-hidden>
            {placeholderText ?? content ?? 'Loading...'}
          </span>
          <span className="seal-text-skeleton seal-text-skeleton-overlay" aria-hidden />
        </>
      );
      loadingStyle = { position: 'relative', display: 'inline-block' };
    }
  }

  // Числовая обрезка задаётся inline (как в Polar), одиночная — классом.
  const truncateStyle: CSSProperties =
    typeof truncate === 'number'
      ? {
          display: '-webkit-box',
          WebkitLineClamp: truncate,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  return (
    <Tag
      className="seal-text"
      data-size={size}
      data-tone={tone}
      data-align={align}
      data-wrap={wrap}
      data-mono={monospace || undefined}
      data-tabular={tabularNums || undefined}
      data-strike={lineThrough || undefined}
      data-truncate={truncate === true ? '' : undefined}
      style={Object.keys(truncateStyle).length > 0 || loadingStyle ? { ...truncateStyle, ...loadingStyle } : undefined}
    >
      {rendered}
    </Tag>
  );
}

export type HeadingSize = 'sm' | 'md' | 'lg';
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type HeadingProps = {
  size?: HeadingSize;
  as?: HeadingTag;
  /** Горизонтальное выравнивание (Polar createText.align). */
  align?: TextAlign;
  /** Правила переноса строк (Polar createText.wrap). */
  wrap?: TextWrap;
  /** Обрезка переполнения: `true` — одна строка, число — столько строк. */
  truncate?: boolean | number;
  children: ReactNode;
};

export function Heading({ size = 'md', as = 'h2', align, wrap, truncate, children }: HeadingProps) {
  const Tag: ElementType = as;

  const truncateStyle: CSSProperties =
    typeof truncate === 'number'
      ? {
          display: '-webkit-box',
          WebkitLineClamp: truncate,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }
      : {};

  return (
    <Tag
      className="seal-heading"
      data-size={size}
      data-align={align}
      data-wrap={wrap}
      data-truncate={truncate === true ? '' : undefined}
      style={Object.keys(truncateStyle).length > 0 ? truncateStyle : undefined}
    >
      {children}
    </Tag>
  );
}