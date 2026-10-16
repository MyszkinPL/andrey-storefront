import type { ReactNode } from 'react';

export type ListGroupProps = {
  children: ReactNode;
};

/**
 * Группа карточек — порт orbit/ListGroup: кольцо 1px gray-200 / polar-700
 * (ring-1), радиус 16px (rounded-2xl), прозрачный фон, overflow hidden.
 */
export function ListGroup({ children }: ListGroupProps) {
  return <div className="seal-list-group">{children}</div>;
}

export type ListGroupItemProps = {
  children: ReactNode;
};

/** Элемент группы — порт orbit/ListGroup.Item: padding 20px, верхняя рамка-разделитель (у первого её нет). */
export function ListGroupItem({ children }: ListGroupItemProps) {
  return <div className="seal-list-group-item">{children}</div>;
}
