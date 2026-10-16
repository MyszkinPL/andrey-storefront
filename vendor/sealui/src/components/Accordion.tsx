import type { ComponentProps, ReactNode, Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { Accordion as BaseAccordion } from '@base-ui/react/accordion';

// Как в Select.tsx: стилевые escape hatch’и (className/style/render) запечатаны.
type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Props & { ref?: Ref<Element> };

/**
 * Единственный источник иконки раскрытия (lucide `ChevronDown` 16px, Polar).
 * Использует и композиция `Accordion`, и часть `AccordionTrigger` — раньше
 * Part и композиция рисовали шеврон по-разному.
 */
const CHEVRON = <ChevronDown size={16} className="seal-accordion-chevron" aria-hidden />;

export type AccordionItemData = {
  title: string;
  content: ReactNode;
  /** Base UI `Accordion.Item.value` — нужен для управляемого `value`/`defaultValue`. */
  value?: string;
  /** Base UI `Accordion.Item.disabled`. */
  disabled?: boolean;
};

export type AccordionProps = {
  items: AccordionItemData[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Base UI `Accordion.Root.multiple` — несколько панелей открыты одновременно. */
  multiple?: boolean;
  disabled?: boolean;
  /** Base UI `Accordion.Root.hiddenUntilFound` — панель находится поиском по странице. */
  hiddenUntilFound?: boolean;
  /** Base UI `Accordion.Root.keepMounted` — закрытые панели остаются в DOM. */
  keepMounted?: boolean;
};

/**
 * Polar Accordion (ui/accordion.tsx): триггер на всю ширину, chevron вниз с
 * поворотом на 180° (`data-panel-open`), плавное раскрытие по высоте
 * (`--accordion-panel-height`). Поведение — Base UI Accordion 1.8.
 */
export function Accordion({
  items,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled = false,
  hiddenUntilFound = false,
  keepMounted = false,
}: AccordionProps) {
  return (
    <AccordionRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next) => onValueChange(next as string[]) : undefined}
      multiple={multiple}
      disabled={disabled}
      hiddenUntilFound={hiddenUntilFound}
      keepMounted={keepMounted}
    >
      {items.map((item) => (
        <AccordionItem key={item.value ?? item.title} value={item.value} disabled={item.disabled}>
          <AccordionHeader>
            <AccordionTrigger>{item.title}</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </AccordionRoot>
  );
}

export type AccordionRootProps = WithRef<Sealed<ComponentProps<typeof BaseAccordion.Root>>, HTMLDivElement>;
export type AccordionItemProps = WithRef<Sealed<ComponentProps<typeof BaseAccordion.Item>>, HTMLDivElement>;
export type AccordionHeaderProps = WithRef<
  Sealed<ComponentProps<typeof BaseAccordion.Header>>,
  HTMLHeadingElement
>;
export type AccordionTriggerProps = WithRef<
  Sealed<ComponentProps<typeof BaseAccordion.Trigger>>,
  HTMLButtonElement
>;
export type AccordionPanelProps = WithRef<
  Sealed<ComponentProps<typeof BaseAccordion.Panel>>,
  HTMLDivElement
>;

export function AccordionRoot({ children, ref, ...props }: AccordionRootProps) {
  return (
    <BaseAccordion.Root {...props} ref={ref} className="seal-accordion">
      {children}
    </BaseAccordion.Root>
  );
}

export function AccordionItem({ children, ref, ...props }: AccordionItemProps) {
  return (
    <BaseAccordion.Item {...props} ref={ref} className="seal-accordion-item">
      {children}
    </BaseAccordion.Item>
  );
}

export function AccordionHeader({ children, ref, ...props }: AccordionHeaderProps) {
  return (
    <BaseAccordion.Header {...props} ref={ref} className="seal-accordion-header">
      {children}
    </BaseAccordion.Header>
  );
}

export function AccordionTrigger({ children, ref, ...props }: AccordionTriggerProps) {
  return (
    <BaseAccordion.Trigger {...props} ref={ref} className="seal-accordion-trigger">
      {children}
      {CHEVRON}
    </BaseAccordion.Trigger>
  );
}

export function AccordionPanel({ children, ref, ...props }: AccordionPanelProps) {
  return (
    <BaseAccordion.Panel {...props} ref={ref} className="seal-disclosure-panel seal-accordion-panel">
      <div className="seal-disclosure-panel-content seal-accordion-panel-content">{children}</div>
    </BaseAccordion.Panel>
  );
}

/**
 * Все части Base UI Accordion 1.8 (Root, Item, Header, Trigger, Panel) в
 * Polar-стиле. Простой путь — компонент `Accordion` со списком `items`.
 */
export const AccordionParts = {
  Root: AccordionRoot,
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
};
