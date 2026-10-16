import type { ComponentProps, ReactNode, Ref } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { useRevealSelected } from './useRevealSelected';

export type TabsOrientation = 'horizontal' | 'vertical';

// Как в Select.tsx: стилевые escape hatch’и (className/style/render) запечатаны.
type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
/**
 * Триггер-части сохраняют `render`: в Base UI это механизм композиции
 * (вкладка-ссылка), а не внешнее оформление, поэтому он не запечатан.
 */
type SealedComposition<Props> = Omit<Props, 'className' | 'style'>;
type WithRef<Props, Element> = Props & { ref?: Ref<Element> };

/** Base UI `Tabs.Root.ChangeEventDetails` — второй аргумент `onValueChange`. */
export type TabsChangeEventDetails = BaseTabs.Root.ChangeEventDetails;

export type TabItem = {
  value: string;
  label: ReactNode;
  /** Base UI `Tabs.Tab.disabled` — вкладка исключается из навигации. */
  disabled?: boolean;
  /** Base UI `render` + `nativeButton=false`: вкладка рендерится ссылкой. */
  href?: string;
};

export type TabsProps = {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  /** Base UI `Tabs.Root.onValueChange(value, eventDetails)`. */
  onValueChange?: (value: string, eventDetails: TabsChangeEventDetails) => void;
  /** Base UI `Tabs.Root.orientation` (Polar: горизонтальный список). */
  orientation?: TabsOrientation;
  /** Base UI `Tabs.List.activateOnFocus` — смена вкладки стрелками без Enter. */
  activateOnFocus?: boolean;
  /** Base UI `Tabs.List.loopFocus` — фокус зацикливается на концах списка. */
  loopFocus?: boolean;
  children?: ReactNode;
  'aria-label'?: string;
};

/**
 * Polar Tabs (orbit Tabs.tsx): список gap-2, триггер px-4 text-sm, активная —
 * rounded-xl + muted-подложка (light gray-100 / dark polar-700) и text-white,
 * неактивная — muted-тон (gray-400 / polar-500) с hover в основной текст.
 * Поведение — Base UI Tabs (roving focus, orientation, disabled-вкладки).
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  activateOnFocus = false,
  loopFocus = true,
  children,
  'aria-label': ariaLabel,
}: TabsProps) {
  return (
    <TabsRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={
        onValueChange ? (next, eventDetails) => onValueChange(String(next), eventDetails) : undefined
      }
      orientation={orientation}
      aria-label={ariaLabel}
    >
      <TabsList activateOnFocus={activateOnFocus} loopFocus={loopFocus}>
        {items.map((item) => (
          <TabsTab
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            nativeButton={item.href ? false : undefined}
            render={item.href ? <a href={item.href} /> : undefined}
          >
            {item.label}
          </TabsTab>
        ))}
      </TabsList>
      {children}
    </TabsRoot>
  );
}

export type TabsPanelProps = {
  value: string;
  children: ReactNode;
  /** Base UI `Tabs.Panel.keepMounted` — панель остаётся в DOM при скрытии. */
  keepMounted?: boolean;
};

export function TabsPanel({ value, children, keepMounted = false }: TabsPanelProps) {
  return (
    <BaseTabs.Panel value={value} className="seal-tabs-panel" keepMounted={keepMounted}>
      {children}
    </BaseTabs.Panel>
  );
}

/** Base UI `Tabs.Indicator` — скользящая подложка вместо подсветки самих вкладок. */
export type TabsIndicatorProps = WithRef<
  Sealed<ComponentProps<typeof BaseTabs.Indicator>>,
  HTMLSpanElement
>;

export function TabsIndicator(props: TabsIndicatorProps) {
  return <BaseTabs.Indicator {...props} className="seal-tabs-indicator" />;
}

export type TabsRootProps = WithRef<Sealed<ComponentProps<typeof BaseTabs.Root>>, HTMLDivElement>;
export type TabsListProps = WithRef<Sealed<ComponentProps<typeof BaseTabs.List>>, HTMLDivElement>;
export type TabsTabProps = WithRef<SealedComposition<ComponentProps<typeof BaseTabs.Tab>>, HTMLElement>;
export type TabsPanelPartProps = WithRef<
  Sealed<ComponentProps<typeof BaseTabs.Panel>>,
  HTMLDivElement
>;

export function TabsRoot({ ref, ...props }: TabsRootProps) {
  return <BaseTabs.Root {...props} ref={ref} />;
}

/**
 * Горизонтальный список шире контейнера прокручивается (свайпом, без
 * полосы прокрутки), а выбранная вкладка подъезжает в видимую часть.
 */
export function TabsList({ children, ref, ...props }: TabsListProps) {
  const listRef = useRevealSelected<HTMLDivElement>('[aria-selected="true"]', 'aria-selected', ref);
  return (
    <BaseTabs.List {...props} ref={listRef} className="seal-tabs-list">
      {children}
    </BaseTabs.List>
  );
}

export function TabsTab({ children, ref, ...props }: TabsTabProps) {
  return (
    <BaseTabs.Tab {...props} ref={ref} className="seal-tabs-tab">
      {children}
    </BaseTabs.Tab>
  );
}

/** Часть `Tabs.Panel` со всем документированным API (value/keepMounted/render). */
export function TabsPanelPart({ children, ref, ...props }: TabsPanelPartProps) {
  return (
    <BaseTabs.Panel {...props} ref={ref} className="seal-tabs-panel">
      {children}
    </BaseTabs.Panel>
  );
}

/**
 * Все части Base UI Tabs 1.8 для ручной композиции: Root, List, Tab,
 * Indicator, Panel. Простой путь — компонент `Tabs` + `TabsPanel`.
 */
export const TabsParts = {
  Root: TabsRoot,
  List: TabsList,
  Tab: TabsTab,
  Indicator: TabsIndicator,
  Panel: TabsPanelPart,
};
