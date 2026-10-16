import * as React from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';

type SeparatorProps = Omit<BaseSeparator.Props, 'className' | 'style' | 'render'> & {
  ref?: React.Ref<HTMLDivElement>;
};

export type { SeparatorProps };
export type { SeparatorState } from '@base-ui/react/separator';

export function Separator({ orientation = 'horizontal', ref, ...props }: SeparatorProps) {
  return (
    <BaseSeparator
      {...props}
      ref={ref}
      orientation={orientation}
      className="seal-separator"
    />
  );
}
