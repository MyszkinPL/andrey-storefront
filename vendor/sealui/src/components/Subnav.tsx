import type { ReactNode } from 'react';

export type SubnavProps = {
  /** Доступное имя навигационного landmark (orbit: 'Secondary'). */
  label?: string;
  children: ReactNode;
};

/**
 * Поднавигация — порт orbit/Subnav: горизонтальный ряд ссылок для переключения
 * секций страницы. Составляется из `SubnavItem`, ссылкой выступает любой
 * элемент роутера, переданный в children.
 */
export function Subnav({ label = 'Secondary', children }: SubnavProps) {
  return (
    <nav className="seal-subnav" aria-label={label}>
      <ul className="seal-subnav-list">{children}</ul>
    </nav>
  );
}

export type SubnavItemProps = {
  /** Отмечает секцию как текущую (aria-current="page" + постоянный цвет text-primary). */
  active?: boolean;
  /** Элемент ссылки секции; цвет и типографика наследуются. */
  children: ReactNode;
};

/**
 * Пункт поднавигации — порт orbit/SubnavItem: колонка по центру, цвет
 * text-secondary (gray-500/polar-400) → text-primary (black/white) на hover
 * и в активном состоянии, transition colors 120ms (durations.fast),
 * типографика heading-xxs (18px → 20px на md, 1.375, 400, sans).
 */
export function SubnavItem({ active, children }: SubnavItemProps) {
  return (
    <li
      className="seal-subnav-item"
      data-active={active ? '' : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="seal-subnav-text">{children}</span>
    </li>
  );
}
