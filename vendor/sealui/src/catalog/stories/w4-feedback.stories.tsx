import { useEffect, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  Autocomplete,
  AutocompleteParts,
  Button,
  Slider,
  Text,
  Toaster,
  ToastProvider,
  useToast,
} from '../../index';
import type { AutocompleteOption } from '../../index';
import type { CatalogEntry } from '../types';

const PRODUCTS: AutocompleteOption[] = [
  { value: 'pro', label: 'Pro subscription' },
  { value: 'free', label: 'Free plan' },
  { value: 'team', label: 'Team seats' },
  { value: 'enterprise', label: 'Enterprise contract' },
  { value: 'usage', label: 'Usage-based pricing' },
];

const asSingle = (value: number | readonly number[], fallback: number) =>
  typeof value === 'number' ? value : value[0] ?? fallback;

function SliderSingle() {
  const [volume, setVolume] = useState(25);
  const [speed, setSpeed] = useState(400);
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Slider
          label="Volume"
          value={volume}
          onValueChange={(next) => setVolume(asSingle(next, 25))}
          showValue
          thumbLabels={['Volume']}
        />
        <Slider
          label="Playback speed"
          value={speed}
          onValueChange={(next) => setSpeed(asSingle(next, 400))}
          showValue
          min={100}
          max={900}
          step={100}
          largeStep={200}
          thumbLabels={['Playback speed']}
          marks={[100, 500, 900]}
          markLabels={['100', '500', '900']}
        />
      </div>
      <Text size="xs" tone="muted">
        volume {volume} · speed {speed} (шаг 100, Page Up/Down — 200, метки на треке)
      </Text>
    </div>
  );
}

function SliderRange() {
  const [range, setRange] = useState<number[]>([25, 70]);
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Slider
          label="Price range"
          value={range}
          onValueChange={(next) => setRange(typeof next === 'number' ? [next, next] : [...next])}
          showValue
          min={0}
          max={100}
          step={5}
          minStepsBetweenValues={2}
          thumbLabels={['Minimum price', 'Maximum price']}
        />
      </div>
      <Text size="xs" tone="muted">
        {range[0]} – {range[1]} · два ползунка, minStepsBetweenValues=2, collision behavior по умолчанию «push»
      </Text>
    </div>
  );
}

function SliderVerticalAndDisabled() {
  return (
    <div className="seal-catalog-row" style={{ alignItems: 'flex-start', gap: 'var(--seal-space-8)' }}>
      <div style={{ height: 200 }}>
        <Slider orientation="vertical" defaultValue={35} label="Zoom" showValue thumbLabels={['Zoom']} />
      </div>
      <div className="seal-catalog-column" style={{ width: 320 }}>
        <Slider defaultValue={60} label="Disabled" showValue disabled thumbLabels={['Disabled']} />
        <Slider
          defaultValue={20}
          disabled
          thumbLabels={['Disabled without label']}
        />
      </div>
    </div>
  );
}

function ToastButtons() {
  const toast = useToast();
  return (
    <div className="seal-catalog-row">
      <Button
        variant="secondary"
        onClick={() => toast.add({ title: 'Saved', description: 'Your changes are live.', type: 'success' })}
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.add({ title: 'Payout scheduled', description: 'Funds arrive within 3 business days.', type: 'info' })
        }
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.add({ title: 'Usage at 92%', description: 'Consider upgrading before the next cycle.', type: 'warning' })
        }
      >
        Warning
      </Button>
      <Button
        variant="danger"
        onClick={() => toast.add({ title: 'Payment failed', description: 'The card was declined.', type: 'danger' })}
      >
        Danger
      </Button>
    </div>
  );
}

function ToastAdvancedButtons() {
  const toast = useToast();
  return (
    <div className="seal-catalog-row">
      <Button
        variant="secondary"
        onClick={() =>
          toast.add({
            title: 'Message archived',
            description: 'Moved to the archive folder.',
            actionProps: { children: 'Undo' },
          })
        }
      >
        Undo action
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.add({ title: 'Uploading logs…', description: 'This toast never auto-closes.', timeout: 0 })}
      >
        Persistent (timeout 0)
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1600)), {
            loading: { title: 'Saving product…' },
            success: { title: 'Product saved', type: 'success' },
            error: { title: 'Could not save', type: 'danger' },
          })
        }
      >
        Promise
      </Button>
    </div>
  );
}

function ToastStates() {
  return (
    <ToastProvider>
      <div className="seal-catalog-column">
        <ToastButtons />
        <ToastAdvancedButtons />
        <Text size="xs" tone="muted">
          Стопка внизу справа (лимит 3, авто-скрытие 5 с). Клавиша F6 переводит фокус в область тостов, свайп/крестик закрывают.
        </Text>
        <Toaster />
      </div>
    </ToastProvider>
  );
}

function ToastPositions() {
  return (
    <ToastProvider limit={2} timeout={0}>
      <div className="seal-catalog-column">
        <ToastPositionButtons />
        <Toaster position="top-center" />
      </div>
    </ToastProvider>
  );
}

function ToastPositionButtons() {
  const toast = useToast();
  return (
    <div className="seal-catalog-row">
      <Button variant="secondary" onClick={() => toast.add({ title: 'Top center stack', description: 'limit=2, без авто-скрытия' })}>
        Add toast
      </Button>
    </div>
  );
}

function AutocompleteSync() {
  const [value, setValue] = useState('team');
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Autocomplete
          items={PRODUCTS}
          value={value}
          onChange={setValue}
          label="Product"
          placeholder="Type to filter…"
          emptyLabel="No matching products"
        />
      </div>
      <Text size="xs" tone="muted">
        value: {value || '—'} · фильтрация внутри Base UI, ввод/стрелки/Enter/Esc, кнопка очистки появляется при непустом значении
      </Text>
    </div>
  );
}

function AutocompleteAsync() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const normalized = query.toLowerCase();
      setResults(PRODUCTS.filter((item) => item.label.toLowerCase().includes(normalized)));
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Autocomplete
          items={[]}
          filteredItems={results}
          value={query}
          onChange={setQuery}
          isLoading={loading}
          label="Product (async)"
          placeholder="Search remote products…"
          emptyLabel="Nothing found"
        />
      </div>
      <Text size="xs" tone="muted">
        Запрос: {query || '—'} · результаты приходят через 400 мс, filter отключён (`filteredItems`)
      </Text>
    </div>
  );
}

function AutocompleteInline() {
  const [value, setValue] = useState('');
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Autocomplete
          inline
          items={PRODUCTS}
          value={value}
          onChange={setValue}
          placeholder="Inline suggestions"
          emptyLabel="No matches"
        />
      </div>
      <Text size="xs" tone="muted">Список в потоке документа (Base UI `inline` + постоянный `open`), без поповера и портала</Text>
    </div>
  );
}

function AutocompletePartsStates() {
  const [value, setValue] = useState('');
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <AutocompleteParts.Root items={PRODUCTS} value={value} onValueChange={setValue} openOnInputClick>
          <label className="seal-autocomplete-label" htmlFor="ac-parts">
            Parts API (grouped)
          </label>
          <AutocompleteParts.InputGroup>
            <AutocompleteParts.Input id="ac-parts" placeholder="All parts…" />
            <AutocompleteParts.Icon>
              <ChevronDown size={16} aria-hidden />
            </AutocompleteParts.Icon>
            <AutocompleteParts.Clear aria-label="Clear">
              <X size={14} aria-hidden />
            </AutocompleteParts.Clear>
          </AutocompleteParts.InputGroup>
          <AutocompleteParts.Portal>
            <AutocompleteParts.Positioner sideOffset={4}>
              <AutocompleteParts.Popup>
                <AutocompleteParts.Status />
                <AutocompleteParts.Empty>No matches</AutocompleteParts.Empty>
                <AutocompleteParts.List>
                  <AutocompleteParts.Group>
                    <AutocompleteParts.GroupLabel>Plans</AutocompleteParts.GroupLabel>
                    {PRODUCTS.slice(0, 3).map((item) => (
                      <AutocompleteParts.Item key={item.value} value={item}>
                        <span className="seal-combobox-item-content">{item.label}</span>
                      </AutocompleteParts.Item>
                    ))}
                  </AutocompleteParts.Group>
                  <AutocompleteParts.Separator />
                  <AutocompleteParts.Group>
                    <AutocompleteParts.GroupLabel>Other</AutocompleteParts.GroupLabel>
                    {PRODUCTS.slice(3).map((item) => (
                      <AutocompleteParts.Item key={item.value} value={item}>
                        <span className="seal-combobox-item-content">{item.label}</span>
                      </AutocompleteParts.Item>
                    ))}
                  </AutocompleteParts.Group>
                </AutocompleteParts.List>
              </AutocompleteParts.Popup>
            </AutocompleteParts.Positioner>
          </AutocompleteParts.Portal>
        </AutocompleteParts.Root>
      </div>
      <Text size="xs" tone="muted">
        Собрано из частей вручную: InputGroup / Input / Icon / Clear / Portal / Positioner / Popup / Status / Empty / List / Group /
        GroupLabel / Item / Separator
      </Text>
    </div>
  );
}

function AutocompleteDisabledItems() {
  const [value, setValue] = useState('');
  return (
    <div className="seal-catalog-column">
      <div style={{ width: 320 }}>
        <Autocomplete
          items={PRODUCTS}
          value={value}
          onChange={setValue}
          label="Disabled option"
          placeholder="Try “enterprise”"
          isItemDisabled={(item) => item.value === 'enterprise'}
        />
      </div>
      <Text size="xs" tone="muted">Пункт «Enterprise contract» задизейблен через `isItemDisabled`</Text>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'Slider',
    category: 'Forms',
    description: 'Base UI Slider in Polar styling: track and fill from the Polar progress bar, accent-ringed thumb, range, steps, marks, vertical and disabled.',
    variants: [
      { name: 'Single value, steps and marks', preview: <SliderSingle /> },
      { name: 'Range (two thumbs)', preview: <SliderRange /> },
      { name: 'Vertical and disabled', preview: <SliderVerticalAndDisabled /> },
    ],
  },
  {
    name: 'Toast',
    category: 'Feedback',
    description: 'Base UI Toast: provider + stacked viewport, typed variants, action button, promise mode, persistent toasts and configurable position.',
    variants: [
      { name: 'Variants, action, promise, persistent', preview: <ToastStates /> },
      { name: 'Position and provider options', preview: <ToastPositions /> },
    ],
  },
  {
    name: 'Autocomplete',
    category: 'Forms',
    description: 'Base UI Autocomplete in the Polar combobox surface: sync filtering, async search via filteredItems, inline (non-popup) list, disabled options and a full parts API.',
    variants: [
      { name: 'Sync filtering', preview: <AutocompleteSync /> },
      { name: 'Async search', preview: <AutocompleteAsync /> },
      { name: 'Inline list', preview: <AutocompleteInline /> },
      { name: 'Disabled option', preview: <AutocompleteDisabledItems /> },
      { name: 'Parts API with groups', preview: <AutocompletePartsStates /> },
    ],
  },
];
