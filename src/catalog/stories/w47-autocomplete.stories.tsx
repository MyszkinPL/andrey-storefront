import { useState } from 'react';
import { Autocomplete, Text } from '../../index';
import type { CatalogEntry } from '../types';

/**
 * Типы объявлены локально: `AutocompleteOption` из `index.ts` совпадает с `Option`
 * структурно, а новые `AutocompleteGroupEntry` / `AutocompleteItemsInput` в публичный
 * `index.ts` этого слайса не входят (правка index.ts — за координатором).
 */
type Option = { value: string; label: string };
type Group = { value: string; items: Option[] };

const products: Option[] = [
  { value: 'pro', label: 'Pro plan' },
  { value: 'free', label: 'Free plan' },
  { value: 'team', label: 'Team plan' },
  { value: 'enterprise', label: 'Enterprise plan' },
  { value: 'starter', label: 'Starter plan' },
  { value: 'scale', label: 'Scale plan' },
];

const groupedProducts: Group[] = [
  {
    value: 'Subscriptions',
    items: [
      { value: 'pro', label: 'Pro plan' },
      { value: 'team', label: 'Team plan' },
      { value: 'enterprise', label: 'Enterprise plan' },
    ],
  },
  {
    value: 'One-time',
    items: [
      { value: 'credits', label: 'Credit pack' },
      { value: 'license', label: 'Perpetual license' },
    ],
  },
];

function FlatStates() {
  const [value, setValue] = useState('');
  return (
    <div className="seal-catalog-column">
      <Autocomplete
        label="Search products"
        items={products}
        value={value}
        onChange={setValue}
        placeholder="e.g. pro"
        emptyLabel="No products for"
        autoHighlight
        isItemDisabled={(item) => item.value === 'starter'}
      />
      <Text size="xs" tone="muted">
        Значение поля: «{value || '—'}» · autoHighlight подсвечивает первый найденный пункт, Enter выбирает его, Esc закрывает
      </Text>
    </div>
  );
}

function GroupedStates() {
  const [value, setValue] = useState('');
  return (
    <div className="seal-catalog-column">
      <Autocomplete
        label="Grouped search"
        items={groupedProducts}
        value={value}
        onChange={setValue}
        placeholder="e.g. team"
        emptyLabel="Nothing in groups for"
        autoHighlight="always"
      />
      <Text size="xs" tone="muted">
        Группы — {'{ value: heading, items: [...] }'} (дока Base UI «Grouped»): Group + GroupLabel + Collection
      </Text>
    </div>
  );
}

function InlineStates() {
  return (
    <div className="seal-catalog-column">
      <Autocomplete
        label="Inline list (no popup)"
        items={products}
        placeholder="Type to filter"
        inline
        autoHighlight
        emptyLabel="No matches for"
      />
      <Text size="xs" tone="muted">
        inline + open из доки: список идёт в потоке, Portal/Positioner не рендерятся
      </Text>
    </div>
  );
}

function StatusStates() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const results = query
    ? products.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : products;
  return (
    <div className="seal-catalog-column">
      <Autocomplete
        label="Async search"
        items={products}
        filteredItems={results}
        value={query}
        onChange={(next) => {
          setQuery(next);
          setLoading(true);
          window.setTimeout(() => setLoading(false), 400);
        }}
        isLoading={loading}
        placeholder="Type to search…"
        emptyLabel="Nothing found for"
      />
      <Autocomplete
        label="Load error"
        items={[]}
        error="Failed to load products. Try again."
        placeholder="Empty list with Status"
      />
      <Text size="xs" tone="muted">
        filteredItems + filter=null — асинхронный режим; Status показывает загрузку и ошибку, Empty — пустой результат
      </Text>
    </div>
  );
}

function DisabledStates() {
  return (
    <div className="seal-catalog-column">
      <Autocomplete label="Disabled" items={products} defaultValue="pro" disabled />
      <Autocomplete label="readOnly" items={products} defaultValue="team" readOnly />
      <Text size="xs" tone="muted">
        Сетка и виртуализация: корень принимает grid / virtualized, части Row и Separator доступны через AutocompleteParts
      </Text>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'Autocomplete',
    category: 'Forms',
    description:
      'Base UI Autocomplete 1.8 in Polar styling: flat and grouped items, async filteredItems, inline list, autoHighlight, clear/trigger, status and empty states (21 parts + useFilter hooks).',
    variants: [
      { name: 'Flat list, autoHighlight, disabled item', preview: <FlatStates /> },
      { name: 'Grouped items', preview: <GroupedStates /> },
      { name: 'Inline list (no popup)', preview: <InlineStates /> },
      { name: 'Async search and status', preview: <StatusStates /> },
      { name: 'Disabled and read-only', preview: <DisabledStates /> },
    ],
  },
];
