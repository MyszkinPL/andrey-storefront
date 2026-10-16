import { useState } from 'react';
import { Meter, NumberField, NumberFieldParts, OTPField, OTPFieldParts, Text } from '../../index';
import type { CatalogEntry } from '../types';

function NumberFieldStates() {
  const [quantity, setQuantity] = useState<number | null>(5);
  const [seats, setSeats] = useState<number | null>(null);
  return (
    <div className="seal-catalog-column">
      <NumberField label="Quantity" value={quantity} onValueChange={setQuantity} min={1} max={20} step={1} />
      <NumberField label="Seats (shift = 10, alt = 0.1)" value={seats} onValueChange={setSeats} min={0} max={1000} largeStep={10} smallStep={0.1} allowWheelScrub />
      <NumberField label="Price" defaultValue={19.9} step={0.1} min={0} max={999} format={{ style: 'currency', currency: 'USD' }} />
      <NumberField aria-label="Without steppers" defaultValue={3} steppers={false} />
      <NumberField label="Read only" defaultValue={42} readOnly />
      <NumberField label="Disabled" defaultValue={7} disabled />
      <Text size="xs" tone="muted">
        Quantity: {quantity === null ? 'null' : quantity} · Seats: {seats === null ? 'null' : seats} · тяни подпись, чтобы скраббить; ArrowUp/Down шагают
      </Text>
    </div>
  );
}

function NumberFieldPartsStates() {
  return (
    <div className="seal-catalog-column">
      <NumberFieldParts.Root defaultValue={5} min={0} max={10} step={1} id="w3-parts-qty" required>
        <NumberFieldParts.ScrubArea>
          <label className="seal-number-field-label" htmlFor="w3-parts-qty">
            Quantity (drag the label)
          </label>
          <NumberFieldParts.ScrubAreaCursor />
        </NumberFieldParts.ScrubArea>
        <NumberFieldParts.Group>
          <NumberFieldParts.Decrement />
          <NumberFieldParts.Input />
          <NumberFieldParts.Increment />
        </NumberFieldParts.Group>
      </NumberFieldParts.Root>
      <Text size="xs" tone="muted">
        Собрано вручную из NumberFieldParts: Root, ScrubArea, ScrubAreaCursor, Group, Decrement, Input, Increment
      </Text>
    </div>
  );
}

function OTPFieldStates() {
  const [numeric, setNumeric] = useState('');
  const [alphanumeric, setAlphanumeric] = useState('');
  const [completed, setCompleted] = useState('');
  return (
    <div className="seal-catalog-column">
      <OTPField
        label="Verification code"
        length={6}
        value={numeric}
        onValueChange={setNumeric}
        onValueComplete={setCompleted}
        autoComplete="one-time-code"
      />
      <OTPField label="Recovery code (alphanumeric)" length={6} validationType="alphanumeric" value={alphanumeric} onValueChange={setAlphanumeric} />
      <OTPField label="Masked" length={4} mask />
      <OTPField label="Numeric keyboard hint" length={6} inputMode="numeric" />
      <div className="seal-catalog-column">
        <OTPFieldParts.Root length={6} id="w3-otp-parts">
          <OTPFieldParts.Input aria-label="Character 1 of 6" />
          <OTPFieldParts.Input aria-label="Character 2 of 6" />
          <OTPFieldParts.Input aria-label="Character 3 of 6" />
          <OTPFieldParts.Separator />
          <OTPFieldParts.Input aria-label="Character 4 of 6" />
          <OTPFieldParts.Input aria-label="Character 5 of 6" />
          <OTPFieldParts.Input aria-label="Character 6 of 6" />
        </OTPFieldParts.Root>
        <Text size="xs" tone="muted">Собрано вручную из OTPFieldParts, включая Separator между группами</Text>
      </div>
      <OTPField label="Read only" length={4} defaultValue="1234" readOnly />
      <OTPField label="Disabled" length={4} disabled />
      <Text size="xs" tone="muted">
        Numeric: {numeric || '—'} · completed: {completed || '—'} · Alphanumeric: {alphanumeric || '—'} · вставка кода заполняет слоты, mask прячет символы
      </Text>
    </div>
  );
}

function MeterStates() {
  return (
    <div className="seal-catalog-column">
      <Meter label="Storage used" value={24} />
      <Meter label="API calls" value={820} min={0} max={2000} format={{ style: 'decimal', maximumFractionDigits: 0 }} />
      <Meter label="Without value" value={61} showValue={false} />
      <Meter aria-label="CPU load" value={96} />
      <Text size="xs" tone="muted">Трек h-2 как у Progress, но семантика измерения: value / min / max, Meter.Value форматирует число</Text>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'NumberField',
    category: 'Forms',
    description: 'Base UI NumberField (все части) в визуальном языке Input: шаг, min/max, скраб, форматирование.',
    variants: [
      { name: 'Steppers, range, scrub, format', preview: <NumberFieldStates /> },
      { name: 'Parts (Base UI)', preview: <NumberFieldPartsStates /> },
    ],
  },
  {
    name: 'OTPField',
    category: 'Forms',
    description: 'Base UI OTPField в Polar-стиле input-otp: ячейки 40×40, mask, alphanumeric, separator.',
    variants: [{ name: 'Numeric, masked, alphanumeric, parts', preview: <OTPFieldStates /> }],
  },
  {
    name: 'Meter',
    category: 'Data display',
    description: 'Base UI Meter: измерение в диапазоне на Polar-треке прогресса.',
    variants: [{ name: 'Values and ranges', preview: <MeterStates /> }],
  },
];
