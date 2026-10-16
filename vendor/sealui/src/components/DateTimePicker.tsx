import * as React from 'react';
import { format as formatDate } from 'date-fns';
import {
  DayPicker,
  getDefaultClassNames,
  type ChevronProps,
  type DateRange,
  type DayPickerProps,
  type Matcher,
} from 'react-day-picker';
import 'react-day-picker/style.css';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { PopoverParts } from './Popover';
import { Select } from './Select';
import { Text } from './Text';

/**
 * Polar Calendar — react-day-picker v9 в оформлении Polar.
 * Донор: `packages/ui/src/components/ui/calendar.tsx` у Polar (тот же приём:
 * к дефолтным классам пакета добавляем свои и правим через CSS-переменные rdp).
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type CalendarProps = DistributiveOmit<
  DayPickerProps,
  'className' | 'classNames' | 'style' | 'styles' | 'modifiersStyles' | 'modifiersClassNames'
>;

const defaultClassNames = getDefaultClassNames();

const CALENDAR_CLASS_NAMES = {
  ...defaultClassNames,
  root: `${defaultClassNames.root} seal-calendar`,
  months: `${defaultClassNames.months} seal-calendar-months`,
  month: `${defaultClassNames.month} seal-calendar-month`,
  month_caption: `${defaultClassNames.month_caption} seal-calendar-month-caption`,
  caption_label: `${defaultClassNames.caption_label} seal-calendar-caption-label`,
  nav: `${defaultClassNames.nav} seal-calendar-nav`,
  button_previous: `${defaultClassNames.button_previous} seal-calendar-nav-previous`,
  button_next: `${defaultClassNames.button_next} seal-calendar-nav-next`,
  month_grid: `${defaultClassNames.month_grid} seal-calendar-month-grid`,
  weekdays: `${defaultClassNames.weekdays} seal-calendar-weekdays`,
  weekday: `${defaultClassNames.weekday} seal-calendar-weekday`,
  week: `${defaultClassNames.week} seal-calendar-week`,
  day: `${defaultClassNames.day} seal-calendar-day`,
  day_button: `${defaultClassNames.day_button} seal-calendar-day-button`,
  chevron: `${defaultClassNames.chevron} seal-calendar-chevron`,
  footer: `${defaultClassNames.footer} seal-calendar-footer`,
  selected: `${defaultClassNames.selected} seal-calendar-day-selected`,
  range_start: `${defaultClassNames.range_start} seal-calendar-day-range-start`,
  range_middle: `${defaultClassNames.range_middle} seal-calendar-day-range-middle`,
  range_end: `${defaultClassNames.range_end} seal-calendar-day-range-end`,
  today: `${defaultClassNames.today} seal-calendar-day-today`,
  outside: `${defaultClassNames.outside} seal-calendar-day-outside`,
  disabled: `${defaultClassNames.disabled} seal-calendar-day-disabled`,
  hidden: `${defaultClassNames.hidden} seal-calendar-day-hidden`,
  focused: `${defaultClassNames.focused} seal-calendar-day-focused`,
};

/** Polar: lucide ChevronLeft/ChevronRight 16px (в shadcn-календаре `h-4 w-4`). */
function CalendarChevron({ orientation }: ChevronProps) {
  return orientation === 'left' ? (
    <ChevronLeft className="seal-calendar-chevron" size={16} aria-hidden />
  ) : (
    <ChevronRight className="seal-calendar-chevron" size={16} aria-hidden />
  );
}

/** Голый календарь Polar-стиля — для собственных композиций. */
export function Calendar({ components, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      {...(props as DayPickerProps)}
      classNames={CALENDAR_CLASS_NAMES}
      components={{ Chevron: CalendarChevron, ...components }}
    />
  );
}

const HOURS = Array.from({ length: 24 }, (_, hour) => ({ value: String(hour), label: pad(hour) }));

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function minuteOptions(step: number) {
  const safeStep = step > 0 && step <= 60 ? step : 15;
  return Array.from({ length: Math.ceil(60 / safeStep) }, (_, index) => index * safeStep).map((minute) => ({
    value: String(minute),
    label: pad(minute),
  }));
}

function dayMatchers(disabledDays: Matcher | Matcher[] | undefined, min?: Date, max?: Date): Matcher[] | undefined {
  const matchers: Matcher[] = [];
  if (disabledDays) {
    matchers.push(...(Array.isArray(disabledDays) ? disabledDays : [disabledDays]));
  }
  // `before`/`after` — строгие матчеры, поэтому границы min/max остаются доступными.
  if (min) matchers.push({ before: min });
  if (max) matchers.push({ after: max });
  return matchers.length > 0 ? matchers : undefined;
}

function dateFormatFor(mode: 'date' | 'datetime', format: 'short' | 'long'): string {
  if (mode === 'datetime') return format === 'long' ? 'PPPp' : 'PPp';
  return format === 'long' ? 'PPP' : 'PP';
}

type FieldProps = {
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
};

function DateTimeTrigger({
  label,
  filled,
  disabled,
  ariaLabel,
}: {
  label: string;
  filled: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  // Триггер — наш `Button` (донор `atoms/DateTimePicker.tsx` у Polar рендерит
  // ровно `<Button variant="outline" className="h-10 w-full justify-start rounded-xl …">`).
  // Раньше здесь был самописный `<button className="seal-input seal-datetime-trigger">`,
  // т.е. вид кнопки дублировался мимо компонента. Внутренний span даёт Polar-раскладку
  // (лейбл слева, иконка справа) внутри кнопки и не требует className у самого Button.
  return (
    <PopoverParts.Trigger
      render={
        <Button variant="outline" fullWidth disabled={disabled} aria-label={ariaLabel}>
          <span className="seal-datetime-field">
            <Text as="span" size="sm" tone={filled ? undefined : 'muted'} truncate>
              {label}
            </Text>
            <CalendarDays className="seal-datetime-icon" size={16} aria-hidden />
          </span>
        </Button>
      }
    >
      {null}
    </PopoverParts.Trigger>
  );
}

export type DateTimePickerProps = FieldProps & {
  value?: Date | null;
  defaultValue?: Date;
  onChange?: (value: Date | undefined) => void;
  /** `date` — только дата, `datetime` — дата + время (Base UI Select для часов и минут). */
  mode?: 'date' | 'datetime';
  /** `short` = PP / `long` = PPP (date-fns), как `format(…, 'PPP')` у Polar. */
  format?: 'short' | 'long';
  /** Шаг минут в режиме datetime (Polar-дефолт 15). */
  minuteStep?: number;
  min?: Date;
  max?: Date;
  disabledDays?: Matcher | Matcher[];
};

/**
 * Поле выбора даты: Polar-календарь внутри Base UI Popover,
 * триггер — поле в стиле `.seal-input` (Polar: h-10, w-full, rounded-xl, outline-кнопка).
 */
export function DateTimePicker({
  value,
  defaultValue,
  onChange,
  mode = 'date',
  format = 'long',
  minuteStep = 15,
  min,
  max,
  disabledDays,
  placeholder = 'Pick a date',
  disabled = false,
  'aria-label': ariaLabel,
}: DateTimePickerProps) {
  const [uncontrolled, setUncontrolled] = React.useState<Date | undefined>(defaultValue);
  const selected = value === undefined ? uncontrolled : value ?? undefined;

  const commit = (next: Date | undefined) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const selectDay = (date: Date | undefined) => {
    if (!date) {
      commit(undefined);
      return;
    }
    const next = new Date(date);
    if (mode === 'datetime' && selected) {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    commit(next);
  };

  const hour = selected ? selected.getHours() : 0;
  const minute = selected ? selected.getMinutes() : 0;
  const minuteStepSafe = minuteStep > 0 && minuteStep <= 60 ? minuteStep : 15;
  const minuteValue = Math.floor(minute / minuteStepSafe) * minuteStepSafe;

  const setTime = (nextHour: number, nextMinute: number) => {
    const base = selected ?? new Date();
    const next = new Date(base);
    next.setHours(nextHour, nextMinute, 0, 0);
    commit(next);
  };

  return (
    <PopoverParts.Root>
      <DateTimeTrigger
        label={selected ? formatDate(selected, dateFormatFor(mode, format)) : placeholder}
        filled={Boolean(selected)}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
      <PopoverParts.Portal>
        <PopoverParts.Positioner align="start">
          <PopoverParts.Popup>
            <Calendar
              mode="single"
              selected={selected}
              onSelect={selectDay}
              disabled={dayMatchers(disabledDays, min, max)}
              startMonth={min}
              endMonth={max}
              autoFocus
            />
            {mode === 'datetime' ? (
              <div className="seal-datetime-time">
                <span className="seal-datetime-time-label">Time</span>
                <Select
                  aria-label="Hours"
                  options={HOURS}
                  value={String(hour)}
                  onValueChange={(next) => setTime(Number(next), minuteValue)}
                />
                <Select
                  aria-label="Minutes"
                  options={minuteOptions(minuteStepSafe)}
                  value={String(minuteValue)}
                  onValueChange={(next) => setTime(hour, Number(next))}
                />
              </div>
            ) : null}
          </PopoverParts.Popup>
        </PopoverParts.Positioner>
      </PopoverParts.Portal>
    </PopoverParts.Root>
  );
}

export type DateRangePickerProps = FieldProps & {
  value?: DateRange | null;
  defaultValue?: DateRange;
  onChange?: (value: DateRange | undefined) => void;
  format?: 'short' | 'long';
  min?: Date;
  max?: Date;
  disabledDays?: Matcher | Matcher[];
};

/** Диапазон дат (react-day-picker `mode="range"`) в том же Polar-оформлении. */
export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  format = 'short',
  min,
  max,
  disabledDays,
  placeholder = 'Pick a date range',
  disabled = false,
  'aria-label': ariaLabel,
}: DateRangePickerProps) {
  const [uncontrolled, setUncontrolled] = React.useState<DateRange | undefined>(defaultValue);
  const selected = value === undefined ? uncontrolled : value ?? undefined;

  const commit = (next: DateRange | undefined) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const label = selected?.from
    ? `${formatDate(selected.from, dateFormatFor('date', format))}${
        selected.to ? ` – ${formatDate(selected.to, dateFormatFor('date', format))}` : ''
      }`
    : placeholder;

  return (
    <PopoverParts.Root>
      <DateTimeTrigger
        label={label}
        filled={Boolean(selected?.from)}
        disabled={disabled}
        ariaLabel={ariaLabel}
      />
      <PopoverParts.Portal>
        <PopoverParts.Positioner align="start">
          <PopoverParts.Popup>
            <Calendar
              mode="range"
              selected={selected}
              onSelect={commit}
              disabled={dayMatchers(disabledDays, min, max)}
              startMonth={min}
              endMonth={max}
              autoFocus
            />
          </PopoverParts.Popup>
        </PopoverParts.Positioner>
      </PopoverParts.Portal>
    </PopoverParts.Root>
  );
}
