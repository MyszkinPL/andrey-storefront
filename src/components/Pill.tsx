import type { ReactNode } from 'react';

export type PillColor = 'gray' | 'blue' | 'purple' | 'yellow' | 'red' | 'green';
export type StatusColor = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';
export type StatusSize = 'small' | 'medium';

export type PillProps = {
  color: PillColor;
  children: ReactNode;
};

export type StatusProps = {
  status: string;
  color?: StatusColor;
  size?: StatusSize;
};

export function Pill({ color, children }: PillProps) {
  return <span className="seal-pill" data-color={color}>{children}</span>;
}

export function Status({ status, color, size = 'medium' }: StatusProps) {
  return (
    <div className="seal-status" data-size={size} data-color={color ?? 'none'}>
      {status}
    </div>
  );
}
