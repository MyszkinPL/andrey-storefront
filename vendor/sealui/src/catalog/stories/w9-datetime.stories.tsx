import { useState } from 'react';
import { Calendar, DateRangePicker, DateTimePicker, Text } from '../../index';
import type { CatalogEntry } from '../types';

function DateStates() {
  const [value, setValue] = useState<Date | undefined>(new Date());
  return (
    <div className="seal-catalog-column">
      <DateTimePicker value={value} onChange={setValue} aria-label="Pick a date" />
      <DateTimePicker aria-label="Empty date picker" />
      <DateTimePicker disabled aria-label="Disabled date picker" />
      <Text size="xs" tone="muted">
        Значение: {value ? value.toDateString() : '—'} · триггер = поле `.seal-input` (h-10, radius-xl), иконка CalendarDays 16px
        opacity .5 справа
      </Text>
    </div>
  );
}

function DateTimeStates() {
  const [value, setValue] = useState<Date | undefined>(new Date(2026, 9, 8, 14, 30));
  return (
    <div className="seal-catalog-column">
      <DateTimePicker mode="datetime" value={value} onChange={setValue} aria-label="Pick date and time" />
      <DateTimePicker mode="datetime" minuteStep={5} format="short" aria-label="Five minute step" />
      <Text size="xs" tone="muted">
        Время: {value ? `${value.toDateString()} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : '—'} ·
        часы и минуты — Base UI Select (Polar-язык, 32px), выбор дня сохраняет уже выбранное время
      </Text>
    </div>
  );
}

function RangeStates() {
  const [range, setRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>({
    from: new Date(2026, 9, 5),
    to: new Date(2026, 9, 12),
  });
  return (
    <div className="seal-catalog-column">
      <DateRangePicker value={range} onChange={setRange} aria-label="Billing period" />
      <DateRangePicker format="long" aria-label="Empty range" />
      <Text size="xs" tone="muted">
        Диапазон: {range?.from ? range.from.toDateString() : '—'} → {range?.to ? range.to.toDateString() : '…'} ·
        react-day-picker mode=&quot;range&quot; (accent-soft середина, accent границы)
      </Text>
    </div>
  );
}

function BoundsStates() {
  const [value, setValue] = useState<Date | undefined>();
  return (
    <div className="seal-catalog-column">
      <DateTimePicker
        value={value}
        onChange={setValue}
        min={new Date(2026, 9, 1)}
        max={new Date(2026, 11, 31)}
        disabledDays={{ dayOfWeek: [0, 6] }}
        aria-label="Business day within quarter"
      />
      <Text size="xs" tone="muted">
        Мин/макс и выходные: донор — rdp-матчеры (`before`/`after` + `dayOfWeek`), навигация ограничена min/max
      </Text>
    </div>
  );
}

function CalendarStates() {
  const [single, setSingle] = useState<Date | undefined>(new Date(2026, 9, 8));
  const [range, setRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>(undefined);
  return (
    <div className="seal-catalog-column">
      <div className="seal-catalog-row" style={{ alignItems: 'flex-start' }}>
        <div className="seal-calendar-surface">
          <Calendar mode="single" selected={single} onSelect={setSingle} />
        </div>
        <div className="seal-calendar-surface">
          <Calendar mode="range" selected={range} onSelect={setRange} />
        </div>
      </div>
      <Text size="xs" tone="muted">Голый Calendar — для собственных композиций (те же части, что внутри поля)</Text>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'DateTimePicker',
    category: 'Forms',
    description: 'Polar calendar (react-day-picker v9) inside a Base UI popover, with an optional Polar time row on Base UI Selects.',
    variants: [
      { name: 'Date field', preview: <DateStates /> },
      { name: 'Date and time', preview: <DateTimeStates /> },
      { name: 'Date range', preview: <RangeStates /> },
      { name: 'Min, max and disabled days', preview: <BoundsStates /> },
      { name: 'Raw Calendar composition', preview: <CalendarStates /> },
    ],
  },
];
