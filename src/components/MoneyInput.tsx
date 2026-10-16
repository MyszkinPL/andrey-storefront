import { useCallback, useMemo, useState, type FocusEventHandler, type KeyboardEvent, type ReactNode } from 'react';
import { Input } from './Input';

export type MoneyInputProps = {
  name?: string;
  /** id поля — для связки с внешним label (Polar MoneyInput.id). */
  id?: string;
  /** Значение в минорных единицах (центах), как у Polar. */
  value?: number | null;
  onChange?: (value: number | null) => void;
  /** Плейсхолдер в минорных единицах. */
  placeholder?: number;
  /** ISO-код валюты; JPY и другие без десятичных знаков — целые. */
  currency: string;
  disabled?: boolean;
  /** Шаг стрелок вверх/вниз, в минорных единицах (по умолчанию 10 центов). */
  step?: number;
  /** Замена подписи валюты слева (Polar MoneyInput.preSlot). */
  preSlot?: ReactNode;
  /** Слот справа от поля (Polar MoneyInput.postSlot). */
  postSlot?: ReactNode;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
};

// Кастомные токены sealui: базовые decimal-валюты и исключения.
const NON_DECIMAL_CURRENCIES = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'ISK', 'XOF', 'XAF', 'BIF', 'CDF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'VUV',
]);

const DECIMAL_FACTORS: Record<string, number> = {
  BHD: 1000, JOD: 1000, KWD: 1000, OMR: 1000, TND: 1000, IQD: 1000, LYD: 1000,
  // Стандарт для остальных decimal-валют: 2 знака.
};

const getDecimalFactor = (currency: string): number => {
  if (NON_DECIMAL_CURRENCIES.has(currency)) {
    return 1;
  }
  return DECIMAL_FACTORS[currency] ?? 100;
};

/**
 * Polar MoneyInput: ввод в основных единицах, наружу — минорные (центы).
 * Запятая принимается как разделитель, ArrowUp/Down шагают значением,
 * blur нормализует висячую точку и ведущую точку.
 */
export function MoneyInput({
  name,
  id,
  value,
  onChange,
  placeholder,
  currency,
  disabled = false,
  step = 10,
  preSlot,
  postSlot,
  onBlur,
  onFocus,
  'aria-label': ariaLabel,
}: MoneyInputProps) {
  const decimalFactor = useMemo(() => getDecimalFactor(currency), [currency]);
  const isNonDecimal = decimalFactor === 1;

  const getInternalValue = useCallback(
    (val: number | null | undefined): string | undefined => {
      if (val === undefined || val === null) {
        return undefined;
      }
      if (isNonDecimal) {
        return val.toString();
      }
      return (val / decimalFactor).toFixed(2);
    },
    [decimalFactor, isNonDecimal],
  );

  const getUnits = useCallback(
    (raw: string): number => {
      let amount = Number.parseFloat(raw);
      if (Number.isNaN(amount)) {
        amount = 0;
      }
      if (isNonDecimal) {
        return Math.round(amount);
      }
      return Math.round(amount * decimalFactor);
    },
    [decimalFactor, isNonDecimal],
  );

  const [previousValue, setPreviousValue] = useState<number | null | undefined>(value);
  const [internalValue, setInternalValue] = useState<string | undefined>(() => getInternalValue(value));

  if (value !== previousValue) {
    setPreviousValue(value);
    setInternalValue(getInternalValue(value));
  }

  const updateValue = useCallback(
    (nextRaw: string) => {
      if (onChange) {
        if (!nextRaw || nextRaw.trim() === '') {
          setPreviousValue(null);
          onChange(null);
        } else {
          const units = getUnits(nextRaw);
          setPreviousValue(units);
          onChange(units);
        }
      }
      setInternalValue(nextRaw);
    },
    [getUnits, onChange],
  );

  const handleChange = useCallback(
    (input: string) => {
      if (input === '') {
        updateValue('');
        return;
      }

      if (isNonDecimal) {
        updateValue(input.replace(/[^0-9]/g, ''));
        return;
      }

      // Чистим всё, кроме цифр и разделителей (вставка из буфера может быть любой)
      const cleaned = input.replace(/[^0-9,.]/g, '');
      // По умолчанию — целое число без разделителей; хвостовая запятая остаётся для ввода
      let next = cleaned.replace(/[,.](?!$)/g, '').replace(/,$/, '.');

      // Десятичный хвост: округление до 2 знаков (запятая принимается как точка)
      const decimalMatch = cleaned.match(/([.,])([0-9]+)$/);
      if (decimalMatch) {
        const maxPrecision = 2;
        const decimalPart = decimalMatch[2];
        const integerPart = cleaned.slice(0, -decimalMatch[0].length).replace(/[,.]/g, '');
        const trimmed = decimalPart.slice(0, maxPrecision);
        const parsed = Number.parseFloat(`${integerPart}.${trimmed}`);
        if (!Number.isNaN(parsed)) {
          const places = Math.min(maxPrecision, decimalPart.length);
          const formatted = parsed.toFixed(places);
          next = integerPart.length > 0 ? formatted : formatted.replace(/^0(?=\.)/, '');
        }
      }

      updateValue(next);
    },
    [isNonDecimal, updateValue],
  );

  const handleBlur = useCallback(() => {
    if (internalValue) {
      let next = internalValue;
      if (!isNonDecimal) {
        if (next.startsWith('.')) {
          next = `0${next}`;
        }
        if (next.endsWith('.')) {
          next = next.replace(/\.$/, '');
        }
      }
      if (next !== internalValue) {
        updateValue(next);
      }
    }
  }, [internalValue, isNonDecimal, updateValue]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
      if (isNonDecimal) {
        if (!/[0-9]/.test(event.key) && !allowed.includes(event.key) && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
        }
        return;
      }

      if (!/[0-9.,]/.test(event.key) && !allowed.includes(event.key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const parsed = Number.parseFloat(event.currentTarget.value);
        const next = (!Number.isNaN(parsed) ? parsed + step / decimalFactor : step / decimalFactor).toFixed(2);
        updateValue(next);
      }

      if (event.key === 'ArrowDown') {
        const parsed = Number.parseFloat(event.currentTarget.value);
        const next = Math.max(0, (!Number.isNaN(parsed) ? parsed - step / decimalFactor : -step / decimalFactor)).toFixed(2);
        updateValue(next);
      }

      // Один десятичный разделитель на поле
      if ((event.key === '.' || event.key === ',') && event.currentTarget.value.includes('.')) {
        event.preventDefault();
      }
    },
    [decimalFactor, isNonDecimal, step, updateValue],
  );

  const placeholderValue = useMemo(() => {
    if (!placeholder) return undefined;
    if (isNonDecimal) {
      return placeholder.toLocaleString('en-US');
    }
    return (placeholder / decimalFactor).toLocaleString('en-US');
  }, [decimalFactor, isNonDecimal, placeholder]);

  // Полярный MoneyInput — это Orbit `Input` со слотами: подпись валюты приходит
  // в `preSlot`, а не отдельным абсолютным боксом. Поэтому используем наш `Input`
  // (он и есть один источник правды вида поля) вместо своей разметки со слотом.
  return (
    <Input
      type="text"
      inputMode={isNonDecimal ? 'numeric' : 'decimal'}
      id={id}
      name={name}
      value={internalValue ?? ''}
      onChange={(event) => handleChange(event.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={(event) => {
        handleBlur();
        onBlur?.(event);
      }}
      onFocus={onFocus}
      placeholder={placeholderValue}
      disabled={disabled}
      aria-label={ariaLabel ?? `Amount in ${currency.toUpperCase()}`}
      preSlot={preSlot ?? <span className="seal-money-currency">{currency.toUpperCase()}</span>}
      postSlot={postSlot}
    />
  );
}
