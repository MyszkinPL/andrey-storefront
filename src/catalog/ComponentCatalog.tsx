import { useMemo, useState } from 'react';
import { Pill, Heading, Input, Stack, Text } from '../index';
import type { CatalogEntry } from './types';

const storyModules = import.meta.glob<{ entries: CatalogEntry[] }>('./stories/*.stories.tsx', { eager: true });
const stories = Object.values(storyModules).flatMap((module) => module.entries);

export function ComponentCatalog() {
  const [query, setQuery] = useState('');
  const categories = useMemo(() => ['All', ...new Set(stories.map((story) => story.category))], []);
  const [category, setCategory] = useState('All');
  const filtered = stories.filter((story) => {
    const matchesCategory = category === 'All' || story.category === category;
    const text = `${story.name} ${story.category} ${story.description}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  });

  return (
    <Stack gap="6">
      <Stack gap="2">
        <Heading size="md" as="h2">Компоненты sealui</Heading>
        <Text size="sm" tone="muted">Каталог автоматически выводит все зарегистрированные компоненты и варианты. Изменения в story сразу видны в dev server.</Text>
      </Stack>
      <div className="seal-catalog-toolbar">
        <Input value={query} onValueChange={setQuery} placeholder="Найти компонент…" />
        <div className="seal-catalog-filters" aria-label="Фильтр категорий">
          {categories.map((item) => (
            <button key={item} type="button" className="seal-catalog-filter" data-active={category === item || undefined} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="seal-catalog-grid">
        {filtered.map((story) => (
          <section className="seal-catalog-card" key={story.name}>
            <header className="seal-catalog-card-header">
              <div>
                <h3>{story.name}</h3>
                <p>{story.description}</p>
              </div>
              <Pill color="gray">{story.category}</Pill>
            </header>
            <div className="seal-catalog-variants">
              {story.variants.map((variant) => (
                <div className="seal-catalog-variant" key={variant.name}>
                  <div className="seal-catalog-variant-label">{variant.name}</div>
                  <div className="seal-catalog-preview">{variant.preview}</div>
                  {variant.code ? <pre className="seal-catalog-code"><code>{variant.code}</code></pre> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
        {filtered.length === 0 ? <Text tone="muted">Компоненты не найдены.</Text> : null}
      </div>
    </Stack>
  );
}
