import { Check, ChevronLeft, Filter, Search } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Popover } from './Popover';
import { Text } from './Text';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterBase = {
  key: string;
  label: string;
  icon?: ReactNode;
  options: FilterOption[];
  /** Фильтр загружает опции асинхронно: пустой список показывает Loading…. */
  loading?: boolean;
  /** Поиск внутри фильтра: контролируемый запрос + колбэк (Polar searchQuery). */
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchPlaceholder?: string;
};

export type SingleFilter = FilterBase & {
  type: 'single';
  /** null = не выбрано; defaultValue — значение, с которым загрузилась страница. */
  value: string | null;
  defaultValue?: string | null;
  onChange: (value: string | null) => void;
};

export type MultiFilter = FilterBase & {
  type: 'multi';
  value: string[];
  onChange: (value: string[]) => void;
};

export type Filter = SingleFilter | MultiFilter;

export type FilterPopoverProps = {
  filters: Filter[];
  /** Подпись триггер-кнопки. */
  label?: string;
  /** Заблокировать триггер. */
  disabled?: boolean;
  /** Колбэк Base UI Popover об изменении открытия (для контролируемых сценариев). */
  onOpenChange?: (open: boolean) => void;
};

const isActive = (filter: Filter): boolean =>
  filter.type === 'single' ? filter.value !== null : filter.value.length > 0;

// Фильтр на дефолтном значении не считается пользовательским — в бейдж не попадает.
const isDefaulted = (filter: Filter): boolean =>
  filter.type === 'single' &&
  filter.defaultValue !== undefined &&
  filter.value === filter.defaultValue;

const isSelected = (filter: Filter, option: FilterOption): boolean =>
  filter.type === 'single'
    ? filter.value === option.value
    : filter.value.includes(option.value);

const clearFilter = (filter: Filter): void => {
  if (filter.type === 'single') {
    filter.onChange(filter.defaultValue ?? null);
  } else {
    filter.onChange([]);
  }
};

const toggleOption = (filter: Filter, option: FilterOption): void => {
  if (filter.type === 'single') {
    filter.onChange(
      filter.value === option.value ? (filter.defaultValue ?? null) : option.value,
    );
  } else {
    filter.onChange(
      filter.value.includes(option.value)
        ? filter.value.filter((value) => value !== option.value)
        : [...filter.value, option.value],
    );
  }
};

const filterSummary = (filter: Filter): string | null => {
  if (!isActive(filter)) {
    return null;
  }
  if (filter.type === 'single') {
    return filter.options.find(({ value }) => value === filter.value)?.label ?? null;
  }
  if (filter.value.length === 1) {
    return filter.options.find(({ value }) => value === filter.value[0])?.label ?? '1 selected';
  }
  return `${filter.value.length} selected`;
};

/**
 * Polar FilterPopover: триггер с иконкой и бейджем активных фильтров,
 * список фильтров со сводками, вложенный список опций с Check, Clear filters.
 * Поисковый фильтр раскрывается поиском (crossfade лейбл ↔ инпут), Backspace
 * возвращает к списку фильтров. Логика Polar 1:1, рендер — Base UI Popover.
 */
export function FilterPopover({ filters, label = 'Filters', disabled = false, onOpenChange }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeFilter = filters.find(({ key }) => key === activeKey);
  const activeCount = filters.filter((f) => isActive(f) && !isDefaulted(f)).length;
  const isSearchable = !!activeFilter?.onSearchQueryChange;

  useEffect(() => {
    if (searchExpanded) {
      searchRef.current?.focus();
    }
  }, [searchExpanded]);

  // Донор Shared/FilterPopover.tsx: collapseSearch гасит фокус поиска
  // и очищает запрос (searchInputRef.current?.blur()).
  const collapseSearch = () => {
    setSearchExpanded(false);
    searchRef.current?.blur();
    activeFilter?.onSearchQueryChange?.('');
  };

  const goBack = () => {
    setActiveKey(null);
    collapseSearch();
  };

  const finish = () => {
    setOpen(false);
    setActiveKey(null);
    collapseSearch();
  };

  const onSelectOption = (filter: Filter, option: FilterOption) => {
    toggleOption(filter, option);
    if (filter.type === 'single') {
      goBack();
    }
  };

  const clearAll = () => {
    for (const filter of filters) {
      if (isActive(filter)) {
        clearFilter(filter);
      }
    }
    finish();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (activeFilter && !searchExpanded && event.key === 'Backspace') {
      event.preventDefault();
      goBack();
    }
  };

  return (
    <Popover
      open={open}
      // Донор сбрасывает навигацию и поиск на ЛЮБОМ изменении открытия
      // (onOpenChange: setActiveKey(null) + collapseSearch()), а не только
      // по «Clear filters» — закрытие по Esc/вне панели тоже возвращает к корню.
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setActiveKey(null);
        collapseSearch();
        onOpenChange?.(nextOpen);
      }}
      side="bottom"
      align="start"
      aria-label={label}
      trigger={
        <Button variant="secondary" disabled={disabled} icon={<Filter aria-hidden />}>
          {label}
          {activeCount > 0 ? <span className="seal-filter-badge">{activeCount}</span> : null}
        </Button>
      }
    >
      <div className="seal-filter-menu" onKeyDown={onMenuKeyDown}>
        {activeFilter ? (
          <>
            <div className="seal-filter-header">
              <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back to filters">
                <ChevronLeft aria-hidden />
              </Button>
              <div className="seal-filter-header-stack">
                <span
                  className={
                    searchExpanded
                      ? 'seal-filter-header-label seal-filter-hidden'
                      : 'seal-filter-header-label'
                  }
                >
                  <Text as="span" tone="muted" truncate>
                    {activeFilter.label}
                  </Text>
                </span>
                {isSearchable ? (
                  <span className={searchExpanded ? 'seal-filter-header-active' : 'seal-filter-header-active seal-filter-hidden'}>
                    <Input
                      value={activeFilter.searchQuery ?? ''}
                      onValueChange={(value: string) => {
                        if (activeFilter.onSearchQueryChange) {
                          activeFilter.onSearchQueryChange(value);
                        }
                      }}
                      placeholder={activeFilter.searchPlaceholder ?? 'Search…'}
                      aria-label={`Search ${activeFilter.label}`}
                      tabIndex={searchExpanded ? 0 : -1}
                      disabled={!searchExpanded}
                    />
                  </span>
                ) : null}
              </div>
              {isSearchable ? (
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label={searchExpanded ? 'Close search' : 'Search'}
                  onClick={() => (searchExpanded ? collapseSearch() : setSearchExpanded(true))}
                >
                  <Search aria-hidden />
                </Button>
              ) : null}
            </div>
            <div className="seal-popup-separator" />
            <div className="seal-filter-list" role="listbox" aria-label={activeFilter.label}>
              {activeFilter.options.length === 0 ? (
                <div className="seal-popup-empty">
                  <Text as="span" tone="muted">
                    {activeFilter.loading ? 'Loading…' : 'No results found'}
                  </Text>
                </div>
              ) : (
                activeFilter.options.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="seal-popup-item"
                    role="option"
                    aria-selected={isSelected(activeFilter, option)}
                    onClick={() => onSelectOption(activeFilter, option)}
                  >
                    <span className="seal-popup-item-content">
                      <Text as="span" truncate>
                        {option.label}
                      </Text>
                    </span>
                    {isSelected(activeFilter, option) ? (
                      <span className="seal-popup-item-indicator">
                        <Check size={16} strokeWidth={2} aria-hidden />
                      </span>
                    ) : (
                      <span className="seal-filter-check-spacer" />
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="seal-filter-list" role="menu" aria-label={label}>
              {filters.map((filter) => {
                const summary = filterSummary(filter);
                return (
                  <button
                    type="button"
                    key={filter.key}
                    className="seal-popup-item seal-filter-item-row"
                    role="menuitem"
                    onClick={() => setActiveKey(filter.key)}
                  >
                    {filter.icon ? <span className="seal-filter-item-icon">{filter.icon}</span> : null}
                    <span className="seal-popup-item-content">
                      <Text as="span" truncate>
                        {filter.label}
                      </Text>
                    </span>
                    {summary ? (
                      <span className="seal-filter-item-summary">
                        <Text as="span" size="xs" tone="muted" truncate>
                          {summary}
                        </Text>
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {activeCount > 0 ? (
              <>
                <div className="seal-popup-separator" />
                <div className="seal-filter-list">
                  <button type="button" className="seal-popup-item" onClick={clearAll}>
                    Clear filters
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </Popover>
  );
}
