import type { ComponentProps, ReactNode, Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible as BaseCollapsible } from '@base-ui/react';

// Как в Select.tsx: стилевые escape hatch’и (className/style/render) запечатаны.
type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Props & { ref?: Ref<Element> };

/**
 * Единственный источник иконки раскрытия (lucide `ChevronDown` 16px, Polar).
 * Использует и композиция `Collapsible`, и часть `CollapsibleTrigger` —
 * чтобы Part и композиция давали один и тот же вид.
 */
const CHEVRON = (
  <span className="seal-collapsible-chevron">
    <ChevronDown size={16} aria-hidden />
  </span>
);

export type CollapsibleProps = {
  /** Подпись кнопки-триггера. */
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Base UI `Collapsible.Panel.keepMounted` — панель остаётся в DOM. */
  keepMounted?: boolean;
  /** Base UI `Collapsible.Panel.hiddenUntilFound` — панель находится поиском по странице. */
  hiddenUntilFound?: boolean;
};

export function Collapsible({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  keepMounted = false,
  hiddenUntilFound = false,
}: CollapsibleProps) {
  return (
    <CollapsibleRoot
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
    >
      <CollapsibleTrigger>{trigger}</CollapsibleTrigger>
      <CollapsiblePanel keepMounted={keepMounted} hiddenUntilFound={hiddenUntilFound}>
        {children}
      </CollapsiblePanel>
    </CollapsibleRoot>
  );
}

export type CollapsibleRootProps = WithRef<
  Sealed<ComponentProps<typeof BaseCollapsible.Root>>,
  HTMLDivElement
>;
export type CollapsibleTriggerProps = WithRef<
  Sealed<ComponentProps<typeof BaseCollapsible.Trigger>>,
  HTMLButtonElement
>;
export type CollapsiblePanelProps = WithRef<
  Sealed<ComponentProps<typeof BaseCollapsible.Panel>>,
  HTMLDivElement
>;

export function CollapsibleRoot({ children, ref, ...props }: CollapsibleRootProps) {
  return (
    <BaseCollapsible.Root {...props} ref={ref} className="seal-collapsible">
      {children}
    </BaseCollapsible.Root>
  );
}

export function CollapsibleTrigger({ children, ref, ...props }: CollapsibleTriggerProps) {
  return (
    <BaseCollapsible.Trigger
      {...props}
      ref={ref}
      className="seal-button seal-collapsible-trigger"
      data-variant="ghost"
      data-size="sm"
    >
      {children}
      {CHEVRON}
    </BaseCollapsible.Trigger>
  );
}

export function CollapsiblePanel({ children, ref, ...props }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel {...props} ref={ref} className="seal-disclosure-panel seal-collapsible-panel">
      <div className="seal-disclosure-panel-content seal-collapsible-panel-content">{children}</div>
    </BaseCollapsible.Panel>
  );
}

/**
 * Все части Base UI Collapsible 1.8 (Root, Trigger, Panel) в Polar-стиле.
 * Простой путь — компонент `Collapsible` с пропом `trigger`.
 */
export const CollapsibleParts = {
  Root: CollapsibleRoot,
  Trigger: CollapsibleTrigger,
  Panel: CollapsiblePanel,
};
