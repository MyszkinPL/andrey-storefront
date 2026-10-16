import type { ReactNode } from 'react';

export type CatalogVariant = {
  name: string;
  preview: ReactNode;
  code?: string;
};

export type CatalogEntry = {
  name: string;
  category: string;
  description: string;
  variants: CatalogVariant[];
};
