import type { CSSProperties, ReactNode } from 'react';

/**
 * Ключи отступов sealui = шаги Polar spacing (value.stylex).
 * 4→xs, 8→s, 12→m, 16→l, 24→xl, 32→2xl, 48→3xl, 64→4xl, 96→5xl.
 */
export const SPACE = {
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '6': 24,
  '8': 32,
  '12': 48,
  '16': 64,
  '24': 96,
} as const;

export type Space = keyof typeof SPACE;

/** Ширина контейнера = breakpoint-ключи Polar (sm 640 / md 768 / lg 1024 / xl 1280). */
const WIDTHS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type ContainerWidth = keyof typeof WIDTHS | 'full';

export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type ClusterJustify = 'start' | 'center' | 'end' | 'between';

function alignValue(align: StackAlign): CSSProperties['alignItems'] {
  switch (align) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'stretch':
      return 'stretch';
  }
}

function justifyValue(justify: ClusterJustify): CSSProperties['justifyContent'] {
  switch (justify) {
    case 'start':
      return 'flex-start';
    case 'center':
      return 'center';
    case 'end':
      return 'flex-end';
    case 'between':
      return 'space-between';
  }
}

export type StackProps = {
  gap?: Space;
  align?: StackAlign;
  children: ReactNode;
};

/** Вертикальный стек — основной строительный блок страницы. */
export function Stack({ gap = '4', align = 'stretch', children }: StackProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE[gap], alignItems: alignValue(align) }}>
      {children}
    </div>
  );
}

export type ClusterProps = {
  gap?: Space;
  /** Поперечная ось ряда: выравнивание по вертикали. */
  align?: StackAlign;
  /** Главная ось ряда: распределение по горизонтали. */
  justify?: ClusterJustify;
  children: ReactNode;
};

/** Горизонтальный ряд с переносом — для кнопок, бейджей, мета-информации. */
export function Cluster({ gap = '2', align = 'center', justify = 'start', children }: ClusterProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACE[gap],
        alignItems: alignValue(align),
        justifyContent: justifyValue(justify),
      }}
    >
      {children}
    </div>
  );
}

export type ContainerProps = {
  width?: ContainerWidth;
  children: ReactNode;
};

/** Центрирующая обёртка с ограниченной шириной. */
export function Container({ width = 'md', children }: ContainerProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: width === 'full' ? undefined : WIDTHS[width],
        marginInline: 'auto',
        paddingInline: SPACE[6],
      }}
    >
      {children}
    </div>
  );
}
