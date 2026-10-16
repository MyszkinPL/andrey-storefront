export type Theme = 'light' | 'dark';

/** Переключение темы — только два значения, кастомных палитр нет. */
export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}
