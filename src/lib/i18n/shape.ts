/**
 * The Russian dictionary is declared `as const`, so its leaves are literal
 * types. Widening them back to `string` lets other locales share the exact
 * same key structure without repeating the literals.
 */
export type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : Widen<T[K]>
}

/** Plural categories, kept identical across locales so shapes still match. */
export type PluralForms = {
  one: string
  few: string
  many: string
  other: string
}
