import { useState } from 'react';
import {
  Button,
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerPopup,
  DrawerPortal,
  DrawerRoot,
  DrawerSwipeArea,
  DrawerTitle,
  DrawerTrigger,
  DrawerViewport,
  PreviewCard,
  ScrollArea,
  Text,
} from '../../index';
import type { CatalogEntry } from '../types';

function DrawerSides() {
  return (
    <div className="seal-catalog-row">
      {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
        <Drawer
          key={side}
          side={side}
          trigger={<Button variant="secondary">{side}</Button>}
          title={`Drawer from ${side}`}
          description="Панель выезжает из края экрана: Esc и клик вне закрывают, жест — свайп в сторону закрытия."
          aria-label={`Open drawer from ${side}`}
        >
          <Text size="sm">
            Polar ui/sheet: padding 24, gap 12, border 1px, shadow-lg, overlay black/80. Bottom-панель получает радиус 24
            сверху и ручку-индикатор (Polar BottomSheet).
          </Text>
        </Drawer>
      ))}
    </div>
  );
}

function DrawerSnapAndSwipe() {
  const [open, setOpen] = useState(false);
  return (
    <div className="seal-catalog-column">
      <Drawer
        side="bottom"
        open={open}
        onOpenChange={setOpen}
        swipeArea
        snapPoints={[0.35, 0.7, 1]}
        trigger={<Button variant="secondary">Snap points + swipe area</Button>}
        title="Snap points"
        description="Панель фиксируется в 35% / 70% / 100% высоты; полоса у нижнего края открывает её свайпом."
        aria-label="Open snap drawer"
      >
        <Text size="sm">Текущее состояние: {open ? 'open' : 'closed'} (controlled через open/onOpenChange).</Text>
        <Text size="sm" tone="muted">
          dragDelta и свайп-закрытие обрабатывает Base UI; всё состояние доступно через data-атрибуты.
        </Text>
      </Drawer>
      <Text size="xs" tone="muted">
        Открыт: {String(open)}
      </Text>
    </div>
  );
}

function DrawerAllParts() {
  return (
    <div className="seal-catalog-row">
      <DrawerRoot modal>
        <DrawerTrigger render={<Button variant="secondary">Parts composition</Button>}>{null}</DrawerTrigger>
        <DrawerSwipeArea />
        <DrawerPortal>
          <DrawerBackdrop />
          <DrawerViewport side="right">
            <DrawerPopup>
              <DrawerContent>
                <DrawerTitle>Полная сборка</DrawerTitle>
                <DrawerDescription>
                  Root / Trigger / SwipeArea / Portal / Backdrop / Viewport / Popup / Content / Title / Description / Close —
                  все части Base UI 1.8 доступны отдельно.
                </DrawerDescription>
                <DrawerClose render={<Button variant="secondary">Закрыть</Button>}>{null}</DrawerClose>
              </DrawerContent>
            </DrawerPopup>
          </DrawerViewport>
        </DrawerPortal>
      </DrawerRoot>
    </div>
  );
}

const LOREM = [
  'Вернакулярная архитектура — строительство вне академической традиции и без профессионального руководства.',
  'По оценке Амоса Рапопорта (1995), вернакулярная архитектура составляет 95% построенной среды мира.',
  'Такие постройки отвечают локальным нуждам, ограничены доступными материалами и отражают местные традиции.',
  'Local builders rarely received attribution for the work.',
  'Исследование вернакулярной архитектуры связано с энергоэффективностью современного строительства.',
  'Поэтому важны материалы региона, климат и практики, передаваемые из поколения в поколение.',
  'Fade-маска по краям показывает, что контент продолжается за границей области прокрутки.',
  'Кастомный скроллбар появляется при наведении и во время прокрутки.',
];

function ScrollAreaStates() {
  return (
    <div className="seal-catalog-row" style={{ alignItems: 'flex-start' }}>
      <ScrollArea size="sm" aria-label="Fade scroll area (sm)">
        {LOREM.map((paragraph) => (
          <Text key={paragraph} size="sm">
            {paragraph}
          </Text>
        ))}
      </ScrollArea>
      <ScrollArea size="md" aria-label="Fade scroll area (md)">
        {LOREM.map((paragraph) => (
          <Text key={paragraph} size="sm">
            {paragraph}
          </Text>
        ))}
      </ScrollArea>
      <ScrollArea size="lg" fade={false} aria-label="Scroll area without fade">
        {LOREM.map((paragraph) => (
          <Text key={paragraph} size="sm">
            {paragraph}
          </Text>
        ))}
      </ScrollArea>
    </div>
  );
}

function ScrollAreaBothAxes() {
  return (
    <ScrollArea size="md" scrollbar="both" aria-label="Two-axis scroll area">
      <div className="seal-catalog-row" style={{ flexWrap: 'nowrap', gap: 'var(--seal-space-2)' }}>
        {Array.from({ length: 40 }, (_, index) => (
          <div
            key={index}
            style={{
              flex: 'none',
              width: 96,
              padding: 'var(--seal-space-3)',
              border: '1px solid var(--seal-border)',
              borderRadius: 'var(--seal-radius-lg)',
              textAlign: 'center',
            }}
          >
            <Text size="sm">{index + 1}</Text>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function PreviewCardStates() {
  return (
    <div className="seal-catalog-row">
      <PreviewCard
        trigger={<a href="#preview">@polar-sh</a>}
        sideOffset={10}
        arrow
        aria-label="Polar preview"
      >
        <Text size="sm">Polar Software</Text>
        <Text size="xs" tone="muted">
          Открывается по наведению и фокусу с задержкой 600 мс, закрывается через 300 мс после ухода курсора.
        </Text>
      </PreviewCard>
      <PreviewCard trigger={<a href="#preview-top">Subscription #1042</a>} side="top" align="start" delay={150} closeDelay={100}>
        <Text size="sm">Pro plan · $29 / month</Text>
        <Text size="xs" tone="muted">
          delay=150, closeDelay=100, side=top, align=start.
        </Text>
      </PreviewCard>
    </div>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'Drawer',
    category: 'Feedback',
    description:
      'Base UI Drawer (все части, snapPoints, свайп) в Polar-визуале ui/sheet и BottomSheet: панель p-6, overlay black/80, ручка снизу.',
    variants: [
      { name: 'Sides', preview: <DrawerSides /> },
      { name: 'Snap points, swipe area, controlled', preview: <DrawerSnapAndSwipe /> },
      { name: 'All parts composition', preview: <DrawerAllParts /> },
    ],
  },
  {
    name: 'ScrollArea',
    category: 'Layout',
    description:
      'Base UI ScrollArea (Root/Viewport/Content/Scrollbar/Thumb/Corner) с Polar-маской fade 24px по краям прокрутки и тонким кастомным скроллбаром.',
    variants: [
      { name: 'Sizes and fade', preview: <ScrollAreaStates /> },
      { name: 'Both axes and corner', preview: <ScrollAreaBothAxes /> },
    ],
  },
  {
    name: 'PreviewCard',
    category: 'Feedback',
    description: 'Base UI PreviewCard (все части) на popover-поверхности Polar: hover/focus с задержками, стрелка, стороны.',
    variants: [
      { name: 'Hover, arrow, delays', preview: <PreviewCardStates /> },
    ],
  },
];
