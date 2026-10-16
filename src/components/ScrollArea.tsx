import type { ComponentProps, ReactNode } from 'react';
import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area';

/**
 * ScrollArea — полный Base UI 1.8 ScrollArea (Root/Viewport/Content/Scrollbar/
 * Thumb/Corner) в Polar-визуале Shared/ScrollFade: маска-fade 24px по краям
 * (fadeSize = 24 в Polar) на основе data-overflow-y-start / data-overflow-y-end
 * и тонкий кастомный скроллбар.
 */

type SealPart<T> = Omit<T, 'className' | 'style'>;

export type ScrollAreaRootProps = SealPart<ComponentProps<typeof BaseScrollArea.Root>>;
export type ScrollAreaViewportProps = SealPart<ComponentProps<typeof BaseScrollArea.Viewport>>;
export type ScrollAreaContentProps = SealPart<ComponentProps<typeof BaseScrollArea.Content>>;
export type ScrollAreaScrollbarProps = SealPart<ComponentProps<typeof BaseScrollArea.Scrollbar>>;
export type ScrollAreaThumbProps = SealPart<ComponentProps<typeof BaseScrollArea.Thumb>>;
export type ScrollAreaCornerProps = SealPart<ComponentProps<typeof BaseScrollArea.Corner>>;

/** Пресеты высоты области (никаких произвольных пикселей снаружи). */
export type ScrollAreaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Какие кастомные скроллбары рисовать. */
export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export const ScrollAreaParts = {
  Root: BaseScrollArea.Root,
  Viewport: BaseScrollArea.Viewport,
  Content: BaseScrollArea.Content,
  Scrollbar: BaseScrollArea.Scrollbar,
  Thumb: BaseScrollArea.Thumb,
  Corner: BaseScrollArea.Corner,
};

export function ScrollAreaRoot(props: ScrollAreaRootProps) {
  return <BaseScrollArea.Root className="seal-scroll-area" {...props} />;
}

export function ScrollAreaViewport(props: ScrollAreaViewportProps) {
  return <BaseScrollArea.Viewport className="seal-scroll-area-viewport" {...props} />;
}

export function ScrollAreaContent(props: ScrollAreaContentProps) {
  return <BaseScrollArea.Content className="seal-scroll-area-content" {...props} />;
}

export function ScrollAreaScrollbar(props: ScrollAreaScrollbarProps) {
  return <BaseScrollArea.Scrollbar className="seal-scroll-area-scrollbar" {...props} />;
}

export function ScrollAreaThumb(props: ScrollAreaThumbProps) {
  return <BaseScrollArea.Thumb className="seal-scroll-area-thumb" {...props} />;
}

export function ScrollAreaCorner(props: ScrollAreaCornerProps) {
  return <BaseScrollArea.Corner className="seal-scroll-area-corner" {...props} />;
}

export type ScrollAreaProps = Omit<ScrollAreaRootProps, 'children'> & {
  children?: ReactNode;
  /** Высота области пресетом; `fill` — растянуть по родителю. */
  size?: ScrollAreaSize;
  fill?: boolean;
  /** Polar-маска по краям прокрутки (fadeSize 24). */
  fade?: boolean;
  /** Какие кастомные скроллбары показывать. */
  scrollbar?: ScrollAreaOrientation;
  /** Держать скроллбар в DOM, даже когда прокрутки нет. */
  keepMounted?: boolean;
};

/**
 * ScrollArea «из коробки»: Root + Viewport + Content + кастомные скроллбары.
 * Порог `overflowEdgeThreshold` управляет тем, с какого сдвига включается fade.
 */
export function ScrollArea({
  children,
  size = 'md',
  fill = false,
  fade = true,
  scrollbar = 'vertical',
  keepMounted = false,
  ...rootProps
}: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root
      className="seal-scroll-area"
      data-size={size}
      data-fill={fill || undefined}
      data-fade={fade || undefined}
      {...rootProps}
    >
      <BaseScrollArea.Viewport className="seal-scroll-area-viewport">
        <BaseScrollArea.Content className="seal-scroll-area-content">{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      {scrollbar === 'vertical' || scrollbar === 'both' ? (
        <BaseScrollArea.Scrollbar
          className="seal-scroll-area-scrollbar"
          orientation="vertical"
          keepMounted={keepMounted}
        >
          <BaseScrollArea.Thumb className="seal-scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      ) : null}
      {scrollbar === 'horizontal' || scrollbar === 'both' ? (
        <BaseScrollArea.Scrollbar
          className="seal-scroll-area-scrollbar"
          orientation="horizontal"
          keepMounted={keepMounted}
        >
          <BaseScrollArea.Thumb className="seal-scroll-area-thumb" />
        </BaseScrollArea.Scrollbar>
      ) : null}
      {scrollbar === 'both' ? <BaseScrollArea.Corner className="seal-scroll-area-corner" /> : null}
    </BaseScrollArea.Root>
  );
}
