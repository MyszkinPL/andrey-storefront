#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   compare-css.cjs — аудит соответствия sealui (src/tokens.css) эталону
   Polar Orbit (polar-orbit/src/components/*.tsx, Tailwind-классы).

   Возможности (все четыре требования аудита):
   1. Резолвит CSS-переменные: var(--seal-space-2) → 8px, var(--seal-primary)
      → oklch(…) — по цепочке, раздельно для light (:root) и dark
      ([data-theme='dark']) токенов.
   2. Различает классы по элементам: у каждого компонента конфигурация
      «частей» (wrapper vs input vs thumb…), каждая часть — свой якорь
      в orbit-исходнике и свой селектор(ы) в tokens.css.
   3. Игнорирует комментарии в CSS (стриппер /* *​/ до парсинга, строки
      не задевает).
   4. Полный Tailwind → CSS маппинг: spacing/size-шкалы, arbitrary-значения,
      палитра Polar (парсится из polar-orbit/src/tokens/value.stylex.ts),
      shadcn-семантика (primary/background/popover/… из docs/TOKENS-POLAR.md),
      варианты dark:, hover:, focus-visible:, disabled:, data-[state=…]:,
      md:/sm:, ring-система (компонуется в box-shadow), space-y, translate,
      truncate и т.д. Неизвестные классы попадают в отчёт «unmapped».

   Каскад на стороне sealui считается честно: специфичность + порядок в файле
   + @media (по выбранному viewport) + [data-theme='dark']-скоупы. Именно так
   был найден баг Dialog: канон `:where()`-слоя `.seal-popup-viewport
   { position: relative }` стоял ПОСЛЕ `.seal-dialog-viewport { position:
   fixed }` и при равной специфичности ронял диалог в поток (вниз страницы).

   Запуск:
     node scripts/compare-css.cjs                     # все компоненты, light+dark
     node scripts/compare-css.cjs --component=Switch  # один компонент
     node scripts/compare-css.cjs --viewport=mobile   # мобильные медиа-бакеты
     node scripts/compare-css.cjs --json              # машиночитаемый отчёт
     node scripts/compare-css.cjs --fail-on-diff      # exit 1 при ✗ (для CI)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOKENS_CSS = path.join(ROOT, 'src', 'tokens.css');
const ORBIT_DIR = path.join(ROOT, 'polar-orbit', 'src');

// ─── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? true : hit.slice(eq + 1);
};
const OPT = {
  components: getArg('component') ? String(getArg('component')).split(',').map((s) => s.trim()) : null,
  viewport: getArg('viewport') || 'desktop', // desktop | mobile
  theme: getArg('theme') || 'both', // light | dark | both
  json: Boolean(getArg('json')),
  failOnDiff: Boolean(getArg('fail-on-diff')),
  verbose: Boolean(getArg('verbose')),
};
const VIEWPORT_WIDTH = OPT.viewport === 'mobile' ? 375 : 1280;

// ─── Утилиты ────────────────────────────────────────────────────────────────

/** Снимает /*-комментарии, не трогая содержимое строк. */
function stripCssComments(css) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const ch = css[i];
    if (quote) {
      out += ch;
      if (ch === quote && css[i - 1] !== '\\') quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end === -1 ? css.length : end + 2;
      // Сохраняем переводы строк, чтобы номера строк не съезжали.
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

const round = (n) => Math.round(n * 1000) / 1000;

/** rem → px, 0.50 → 0.5, #abc → #aabbcc, hsl(0, 0%, 13%) → hsl(0 0% 13%). */
function normalizeValue(prop, value) {
  let v = String(value).trim().toLowerCase();
  v = v.replace(/\s+/g, ' ');
  // rem → px
  v = v.replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${round(parseFloat(n) * 16)}px`);
  // числа: 0.50 → 0.5, 22.0px → 22px
  v = v.replace(/(-?\d+\.\d+)(px|em|%|s)?/g, (m, n, unit) => `${round(parseFloat(n))}${unit || ''}`);
  v = v.replace(/\b0px\b/g, '0');
  // calc(4px * -1) → -4px (отрицательные margin через var)
  v = v.replace(/calc\(([-\d.]+(?:px|rem|em|%)) \* -1\)/g, '-$1');
  // hex 3 → 6
  v = v.replace(/#([0-9a-f])([0-9a-f])([0-9a-f])\b/g, '#$1$1$2$2$3$3');
  // hsl/rgb: запятые → пробелы, '/' сохраняем (современный синтаксис)
  v = v.replace(/(hsl|rgb)a?\(([^)]+)\)/g, (m, fn, body) => {
    const parts = body.split(/,\s*|\s+/).filter(Boolean);
    return `${fn}(${parts.join(' ')})`;
  });
  v = v.replace(/\s*\/\s*/g, ' / ');
  // oklch пробелы
  v = v.replace(/oklch\(([^)]+)\)/g, (m, body) => `oklch(${body.split(/\s+/).filter(Boolean).join(' ')})`);
  // color-mix: нормализуем пробелы вокруг процентов
  v = v.replace(/color-mix\(([^)]+)\)/g, (m, body) => `color-mix(${body.split(/\s+/).filter(Boolean).join(' ')})`);
  return v;
}

/** Числовое сравнение длин (8px == 0.5rem == 8.0px). */
function lengthsEqual(a, b) {
  return normalizeValue('', a) === normalizeValue('', b);
}

// Свойства, расхождения в которых важны (✗), а не информационны (~).
const SOFT_PROPS = new Set([
  'box-shadow', 'transition', 'transition-property', 'transition-duration',
  'transition-timing-function', 'font-family', '@space-y', '@space-x', '@ring', 'outline',
  'outline-style', 'outline-offset', 'will-change', '@animation', 'text-wrap',
  'user-select', 'line-height', 'z-index',
]);

// Значения, равные CSS-initial: если seal их не задаёт — это не расхождение.
const INITIAL_VALUES = {
  'outline-style': 'none', 'flex-direction': 'row', 'position': 'static',
  'z-index': 'auto', 'opacity': '1', 'cursor': 'auto', 'overflow': 'visible',
  'pointer-events': 'auto', 'border-style': 'none', 'text-align': 'start',
  'white-space': 'normal', 'flex-shrink': '1', 'flex-grow': '0',
  'display': 'inline', 'border-width': 'medium', 'transform': 'none',
};

// Осознанные отклонения sealui (prop → причина). Отмечаются в отчёте как ⊘.
// Задаются в конфиге части через `accepted`.


// ─── Палитра Polar (value.stylex.ts) ────────────────────────────────────────

function loadOrbitPalette() {
  const src = fs.readFileSync(path.join(ORBIT_DIR, 'tokens', 'value.stylex.ts'), 'utf8');
  const blockMatch = src.match(/export const palette = stylex\.defineVars\(\{([\s\S]*?)\n\}(?: as const)?\)/);
  if (!blockMatch) throw new Error('Не найден palette в value.stylex.ts');
  const palette = {};
  const re = /(\w+):\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(blockMatch[1]))) palette[m[1]] = m[2];
  return palette;
}

const PALETTE = loadOrbitPalette();

// Синяя рамка у Polar — дефолт Tailwind v4 (`--color-blue-*` из @theme),
// в value.stylex.ts её нет. Литералы — Tailwind v4 defaults (независимый
// источник; sealui --seal-blue-* должен им совпадать).
const TW4_DEFAULTS = {
  'blue-50': 'oklch(0.97 0.014 254.604)',
  'blue-100': 'oklch(0.932 0.032 255.585)',
  'blue-200': 'oklch(0.882 0.059 254.128)',
  'blue-300': 'oklch(0.809 0.105 251.813)',
  'blue-400': 'oklch(0.707 0.165 254.624)',
  'blue-500': 'oklch(0.623 0.214 259.815)',
  'blue-600': 'oklch(0.546 0.245 262.881)',
  'blue-700': 'oklch(0.488 0.243 264.376)',
  'blue-800': 'oklch(0.424 0.199 265.638)',
  'blue-900': 'oklch(0.379 0.146 265.522)',
  'blue-950': 'oklch(0.282 0.091 267.935)',
  'yellow-100': 'oklch(0.973 0.071 103.193)',
  'yellow-400': 'oklch(0.852 0.199 91.936)',
  'yellow-500': 'oklch(0.795 0.184 86.047)',
  'yellow-950': 'oklch(0.421 0.095 57.708)',
  'purple-100': 'oklch(0.946 0.033 307.174)',
  'purple-300': 'oklch(0.827 0.119 306.383)',
  'purple-600': 'oklch(0.558 0.288 302.321)',
  'purple-700': 'oklch(0.496 0.265 301.924)',
  'violet-100': 'oklch(0.943 0.029 294.588)',
  'violet-400': 'oklch(0.702 0.183 293.541)',
  'violet-500': 'oklch(0.606 0.25 292.717)',
  'violet-950': 'oklch(0.283 0.141 291.089)',
};

/** camelCase (gray200) → Tailwind-имя (gray-200) + дефолты TW v4. */
function paletteToTailwind() {
  const map = { ...TW4_DEFAULTS };
  for (const [key, value] of Object.entries(PALETTE)) {
    const tw = key.replace(/^([a-z]+)(\d+)$/, '$1-$2');
    map[tw] = value;
  }
  map.white = PALETTE.white;
  map.black = PALETTE.black;
  return map;
}
const TW_COLORS = paletteToTailwind();

// shadcn-семантика Polar (docs/TOKENS-POLAR.md: globals.css :root / :root.dark).
// Значение — имя в TW_COLORS или литерал.
const SHADCN = {
  light: {
    'primary': 'blue-600',
    'primary-foreground': 'gray-50',
    'background': 'gray-50',
    'foreground': 'gray-900',
    'card': 'white',
    'card-foreground': 'gray-900',
    'popover': 'white',
    'popover-foreground': 'hsl(224 71.4% 4.1%)',
    'border': 'gray-200',
    'input': 'gray-200',
    'ring': 'gray-200',
    'muted': 'gray-100',
    'muted-foreground': 'gray-500',
    'secondary': 'gray-100',
    'secondary-foreground': 'gray-900',
    'accent': 'blue-600',
    'accent-foreground': 'white',
    'destructive': 'red-500',
  },
  dark: {
    'primary': 'blue-600',
    'primary-foreground': 'polar-50',
    'background': 'polar-800',
    'foreground': 'polar-50',
    'card': 'polar-800',
    'card-foreground': 'polar-50',
    'popover': 'polar-900',
    'popover-foreground': 'polar-50',
    'border': 'polar-700',
    'input': 'polar-700',
    'ring': 'polar-700',
    'muted': 'polar-700',
    'muted-foreground': 'polar-500',
    'secondary': 'polar-700',
    'secondary-foreground': 'polar-50',
    'accent': 'blue-600',
    'accent-foreground': 'polar-50',
    'destructive': 'red-500',
  },
};

/** Tailwind-имя цвета → литерал (с учётом темы и альфы `…/40`). */
function resolveColor(name, theme) {
  let alpha = null;
  const slash = name.match(/^(.+)\/(\d+)$/);
  let base = name;
  if (slash) {
    base = slash[1];
    alpha = Number(slash[2]) / 100;
  }
  let literal = null;
  const semantic = SHADCN[theme][base];
  if (semantic !== undefined) {
    literal = semantic.startsWith('#') || semantic.includes('(') ? semantic : TW_COLORS[semantic] || null;
  } else if (TW_COLORS[base] !== undefined) {
    literal = TW_COLORS[base];
  } else if (base === 'transparent') {
    literal = 'transparent';
  } else if (base === 'current') {
    literal = 'currentcolor';
  }
  if (literal === null) return null;
  if (alpha !== null && literal !== 'transparent') {
    return { alpha: { color: normalizeValue('', literal), value: alpha } };
  }
  return normalizeValue('', literal);
}

// ─── Tailwind-шкалы ─────────────────────────────────────────────────────────

const SPACING = {
  '0': '0', 'px': '1px', '0.5': '2px', '1': '4px', '1.5': '6px', '2': '8px',
  '2.5': '10px', '3': '12px', '3.5': '14px', '4': '16px', '5': '20px',
  '6': '24px', '7': '28px', '8': '32px', '9': '36px', '10': '40px',
  '11': '44px', '12': '48px', '14': '56px', '16': '64px', '20': '80px',
  '24': '96px', '28': '112px', '32': '128px', '36': '144px', '40': '160px',
  '44': '176px', '48': '192px', '52': '208px', '56': '224px', '60': '240px',
  '64': '256px', '72': '288px', '80': '320px', '96': '384px',
};

function resolveLength(token) {
  if (token === undefined) return null;
  const arb = token.match(/^\[(.+)\]$/);
  if (arb) {
    const raw = arb[1].trim();
    // [22px], [37px], [3px], [0.6rem], [10%], [calc(…)]
    return raw.includes('calc') || raw.includes('var') ? raw : normalizeValue('', raw);
  }
  if (SPACING[token] !== undefined) return SPACING[token];
  if (token === 'full') return '100%';
  if (token === 'screen') return '100vw';
  if (token === 'auto') return 'auto';
  if (token === 'min') return 'min-content';
  if (token === 'max') return 'max-content';
  if (token === 'fit') return 'fit-content';
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return `${round((Number(frac[1]) / Number(frac[2])) * 100)}%`;
  if (/^\d+(\.\d+)?$/.test(token)) return SPACING[token] || `${round(Number(token) * 4)}px`;
  return null;
}

// Радиусы Polar (globals.css @theme, --radius: 0.6rem): те же значения,
// что в --seal-radius-* (docs/TOKENS-POLAR.md, POLAR-TOKENS.md).
const RADIUS = {
  'none': '0', 'xs': '2px', 'sm': '5.6px', '': '5.6px', 'md': '7.6px',
  'lg': '9.6px', 'xl': '12px', '2xl': '16px', '3xl': '24px', '4xl': '32px',
  'full': '9999px',
};

const FONT_SIZE = {
  'xxs': ['10.4px', '1.4'], 'xs': ['12px', '16px'], 'sm': ['14px', '20px'],
  'base': ['16px', '24px'], 'lg': ['18px', '28px'], 'xl': ['20px', '28px'],
  '2xl': ['24px', '32px'], '3xl': ['30px', '36px'], '4xl': ['36px', '40px'],
};

const FONT_WEIGHT = {
  'thin': '100', 'extralight': '200', 'light': '300', 'normal': '400',
  'medium': '500', 'semibold': '600', 'bold': '700', 'extrabold': '800',
  'black': '900',
};

const TRACKING = { 'tighter': '-0.05em', 'tight': '-0.025em', 'normal': '0', 'wide': '0.025em', 'wider': '0.05em', 'widest': '0.1em' };

// Tailwind v4 тени (дефолты). У Polar собственные --shadow-* в globals.css,
// поэтому сравнение теней — «мягкое»: сверяем наличие и ступень.
const SHADOWS = {
  '2xs': '0 1px 0 0 rgb(0 0 0 / 0.05)',
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  '': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  'none': 'none',
};

// Классы, которые осознанно не сравниваем (анимации, структурные хуки,
// псевдоэлементы — у sealui другая реализация тех же эффектов).
const IGNORED_TW = new Set([
  'peer', 'group', 'animate-in', 'animate-out', 'fade-in-0', 'fade-out-0',
  'zoom-in-95', 'zoom-out-95', 'animate-spin', 'animate-pulse', 'sr-only',
  'border-collapse', 'appearance-none', 'antialiased', 'subpixel-antialiased',
]);
const IGNORED_TW_PREFIXES = [
  'slide-in-from-', 'slide-out-to-', 'data-[state=closed]:', 'data-[state=open]:animate',
  'file:', 'placeholder:', 'peer-', 'group-data-', 'group-hover:', '[&', 'motion-',
  'first:', 'last:', 'group/', 'pointer-coarse:', 'divide-', // структурные — не моделируются по состояниям
  'safe-area-',
];

/**
 * Раскладывает класс на (варианты, утилита). Варианты: dark, hover, focus,
 * focus-visible, disabled, md, sm, data-[…], -leading (отрицательные значения).
 */
function splitVariants(cls) {
  const parts = [];
  let rest = cls;
  for (;;) {
    const idx = rest.indexOf(':');
    if (idx === -1) break;
    // не режем по двоеточию внутри url(...) и data-[a:b] — в TW-классах их нет
    parts.push(rest.slice(0, idx));
    rest = rest.slice(idx + 1);
  }
  return { variants: parts, utility: rest };
}

function variantApplies(variant, bucket) {
  switch (variant) {
    case 'dark': return bucket.theme === 'dark';
    case 'light': return bucket.theme === 'light';
    case 'hover': return bucket.pseudo === 'hover';
    case 'focus': return bucket.pseudo === 'focus' || bucket.pseudo === 'focus-visible';
    case 'focus-visible': return bucket.pseudo === 'focus-visible';
    case 'disabled': return bucket.pseudo === 'disabled' || Boolean(bucket.attrs['disabled']);
    case 'md': return VIEWPORT_WIDTH >= 768;
    case 'sm': return VIEWPORT_WIDTH >= 640;
    case 'lg': return VIEWPORT_WIDTH >= 1024;
    default: {
      const dv = variant.match(/^data-\[(.+?)\]$/);
      if (dv) {
        const [attrRaw, valueRaw] = dv[1].split('=');
        const attr = attrRaw.startsWith('data-') ? attrRaw : `data-${attrRaw}`;
        const want = valueRaw ? valueRaw.replace(/^["']|["']$/g, '') : '';
        const have = bucket.attrs[attr];
        if (valueRaw) return have === want;
        return have !== undefined;
      }
      return null; // неизвестный вариант
    }
  }
}

/**
 * Tailwind-утилита → канонические декларации {prop: value}.
 * bucket: {theme, attrs, pseudo}. Возвращает null, если класс не распознан.
 */
function mapUtility(utility, bucket, unmapped) {
  const decls = {};
  const add = (p, v) => { decls[p] = v; };

  // ── display / flex / grid ──
  const displayMap = {
    'flex': 'flex', 'inline-flex': 'inline-flex', 'block': 'block',
    'inline-block': 'inline-block', 'grid': 'grid', 'inline': 'inline',
    'hidden': 'none', 'table': 'table', 'contents': 'contents',
  };
  if (displayMap[utility] !== undefined) return add('display', displayMap[utility]), decls;
  if (utility === 'flex-row') return add('flex-direction', 'row'), decls;
  if (utility === 'flex-wrap') return add('flex-wrap', 'wrap'), decls;
  if (utility === 'flex-nowrap') return add('flex-wrap', 'nowrap'), decls;
  if (utility === 'flex-wrap-reverse') return add('flex-wrap', 'wrap-reverse'), decls;
  if (utility === 'flex-col') return add('flex-direction', 'column'), decls;
  if (utility === 'flex-col-reverse') return add('flex-direction', 'column-reverse'), decls;
  if (utility === 'flex-row-reverse') return add('flex-direction', 'row-reverse'), decls;
  if (utility === 'flex-wrap') return add('flex-wrap', 'wrap'), decls;
  if (utility === 'flex-1') return add('flex', '1 1 0%'), decls;
  if (utility === 'flex-none') return add('flex', 'none'), decls;
  if (utility === 'shrink-0') return add('flex-shrink', '0'), decls;
  if (utility === 'shrink') return add('flex-shrink', '1'), decls;
  const textAlign = utility.match(/^text-(left|right|center|justify|start|end)$/);
  if (textAlign) return add('text-align', textAlign[1]), decls;
  const vAlign = utility.match(/^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/);
  if (vAlign) return add('vertical-align', vAlign[1] === 'top' ? 'top' : vAlign[1] === 'bottom' ? 'bottom' : vAlign[1]), decls;
  if (utility === 'caption-bottom') return add('caption-side', 'bottom'), decls;
  if (utility === 'caption-top') return add('caption-side', 'top'), decls;
  if (utility === 'grow') return add('flex-grow', '1'), decls;
  if (/^grow-\d+$/.test(utility)) return add('flex-grow', utility.slice(5)), decls;
  const items = utility.match(/^items-(start|end|center|baseline|stretch)$/);
  if (items) return add('align-items', items[1] === 'start' ? 'flex-start' : items[1] === 'end' ? 'flex-end' : items[1]), decls;
  const justify = utility.match(/^justify-(start|end|center|between|around|evenly|stretch|normal)$/);
  if (justify) {
    // TW выдаёт легаси-значения flex-start/flex-end для start/end.
    const v = justify[1] === 'start' ? 'flex-start' : justify[1] === 'end' ? 'flex-end' : justify[1] === 'between' ? 'space-between' : justify[1] === 'around' ? 'space-around' : justify[1] === 'evenly' ? 'space-evenly' : justify[1];
    return add('justify-content', v), decls;
  }
  const selfAlign = utility.match(/^self-(start|end|center|stretch)$/);
  if (selfAlign) return add('align-self', selfAlign[1] === 'start' ? 'flex-start' : selfAlign[1] === 'end' ? 'flex-end' : selfAlign[1]), decls;
  const placeItems = utility.match(/^place-items-(center|start|end)$/);
  if (placeItems) return add('place-items', placeItems[1]), decls;

  // ── position ──
  if (['relative', 'absolute', 'fixed', 'static', 'sticky'].includes(utility)) return add('position', utility), decls;
  if (utility === 'inset-0') { add('top', '0'); add('right', '0'); add('bottom', '0'); add('left', '0'); return decls; }
  const insetSide = utility.match(/^(top|right|bottom|left)-(.+)$/);
  if (insetSide && resolveLength(insetSide[2]) !== null) return add(insetSide[1], resolveLength(insetSide[2])), decls;
  const negInset = utility.match(/^-(top|right|bottom|left)-(.+)$/);
  if (negInset && resolveLength(negInset[2]) !== null) return add(negInset[1], `-${resolveLength(negInset[2])}`), decls;
  const zIndex = utility.match(/^z-(\d+|auto|\[.+\])$/);
  if (zIndex) return add('z-index', zIndex[1].replace(/[[\]px]/g, '')), decls;

  // ── box size ──
  const sizeProps = [
    [/^h-(.+)$/, ['height']], [/^w-(.+)$/, ['width']], [/^size-(.+)$/, ['width', 'height']],
    [/^min-h-(.+)$/, ['min-height']], [/^min-w-(.+)$/, ['min-width']],
    [/^max-h-(.+)$/, ['max-height']], [/^max-w-(.+)$/, ['max-width']],
  ];
  for (const [re, props] of sizeProps) {
    const m = utility.match(re);
    if (m) {
      const len = resolveLength(m[1]);
      if (len !== null) { for (const p of props) add(p, len); return decls; }
      if (m[1] === 'screen') { for (const p of props) add(p, p.startsWith('h') ? '100vh' : '100vw'); return decls; }
      break;
    }
  }
  if (utility === 'aspect-square') return add('aspect-ratio', '1'), decls;

  // ── spacing ──
  const padProps = [
    [/^p-(.+)$/, ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']],
    [/^px-(.+)$/, ['padding-left', 'padding-right']],
    [/^py-(.+)$/, ['padding-top', 'padding-bottom']], [/^pt-(.+)$/, ['padding-top']],
    [/^pr-(.+)$/, ['padding-right']], [/^pb-(.+)$/, ['padding-bottom']],
    [/^pl-(.+)$/, ['padding-left']],
  ];
  for (const [re, props] of padProps) {
    const m = utility.match(re);
    if (m) {
      const len = resolveLength(m[1]);
      if (len !== null) { for (const p of props) add(p, len); return decls; }
      break;
    }
  }
  const margM = utility.match(/^(-?)m([trblxy])?-(.+)$/);
  if (margM) {
    const len = resolveLength(margM[3]);
    if (len !== null) {
      const val = margM[1] === '-' ? `-${len}` : len;
      const sideMap = { t: ['margin-top'], r: ['margin-right'], b: ['margin-bottom'], l: ['margin-left'], x: ['margin-left', 'margin-right'], y: ['margin-top', 'margin-bottom'] };
      for (const pr of (margM[2] ? sideMap[margM[2]] : ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'])) add(pr, val);
      return decls;
    }
  }
  const gapM = utility.match(/^gap(?:-(x|y))?-(.+)$/);
  if (gapM) {
    const len = resolveLength(gapM[2]);
    if (len !== null) {
      if (!gapM[1] || gapM[1] === 'x') add(gapM[1] ? 'column-gap' : 'gap', len);
      if (!gapM[1] || gapM[1] === 'y') add(gapM[1] ? 'row-gap' : 'gap', len);
      return decls;
    }
  }
  const spaceX = utility.match(/^space-x-(.+)$/);
  if (spaceX) {
    const len = resolveLength(spaceX[1]);
    if (len !== null) return add('@space-x', len), decls;
  }
  const spaceY = utility.match(/^space-y-(.+)$/);
  if (spaceY) {
    const len = resolveLength(spaceY[1]);
    if (len !== null) return add('@space-y', len), decls;
  }

  // ── transform ──
  const tx = utility.match(/^(-?)translate-x-(.+)$/);
  if (tx) {
    const len = resolveLength(tx[2]);
    if (len !== null) return add('@translate-x', tx[1] ? `-${len}` : len), decls;
  }
  const ty = utility.match(/^(-?)translate-y-(.+)$/);
  if (ty) {
    const len = resolveLength(ty[2]);
    if (len !== null) return add('@translate-y', ty[1] ? `-${len}` : len), decls;
  }
  const scale = utility.match(/^scale-(\d+)$/);
  if (scale) return add('@scale', String(Number(scale[1]) / 100)), decls;

  // ── border / radius ──
  if (utility === 'border-none') { add('border-style', 'none'); add('border-width', '0'); return decls; }
  if (utility === 'border') { add('border-width', '1px'); add('border-style', 'solid'); return decls; }
  const borderW = utility.match(/^border-(\d+)$/);
  if (borderW) { add('border-width', `${borderW[1]}px`); add('border-style', 'solid'); return decls; }
  const borderSideW = utility.match(/^border-([trblxy])(?:-([\d.]+))?$/);
  if (borderSideW) {
    const sideMap = { t: 'top', r: 'right', b: 'bottom', l: 'left' };
    const s = borderSideW[1];
    const width = borderSideW[2] !== undefined ? `${borderSideW[2]}px` : '1px';
    if (s === 'x') { add('border-left-width', width); add('border-right-width', width); }
    else if (s === 'y') { add('border-top-width', width); add('border-bottom-width', width); }
    else add(`border-${sideMap[s]}-width`, width);
    add('border-style', 'solid');
    return decls;
  }
  const rounded = utility.match(/^rounded(-[a-z0-9[\].-]+)?$/);
  if (rounded && (rounded[1] === undefined || RADIUS[rounded[1].slice(1)] !== undefined || /^\[.+\]$/.test(rounded[1].slice(1)))) {
    const key = rounded[1] ? rounded[1].slice(1) : '';
    const arb = key.match(/^\[(.+)\]$/);
    add('border-radius', arb ? normalizeValue('', arb[1]) : RADIUS[key]);
    return decls;
  }

  // ── ring (фокус-кольца; компонуем в box-shadow-эквивалент) ──
  const ringW = utility.match(/^ring-(\d+|\[.+\])$/);
  if (ringW) return add('@ring-width', ringW[1].startsWith('[') ? normalizeValue('', ringW[1].slice(1, -1)) : `${ringW[1]}px`), decls;
  if (utility === 'ring') return add('@ring-width', '1px'), decls;
  if (utility === 'ring-0') return add('@ring-width', '0'), decls;
  const ringOffset = utility.match(/^ring-offset-(\d+)$/);
  if (ringOffset) return add('@ring-offset', `${ringOffset[1]}px`), decls;
  if (utility === 'ring-offset-transparent') return add('@ring-offset-color', 'transparent'), decls;
  const ringOffsetColor = utility.match(/^ring-offset-(.+)$/);
  if (ringOffsetColor) {
    const c = resolveColor(ringOffsetColor[1], bucket.theme);
    if (c) return add('@ring-offset-color', colorToStr(c)), decls;
  }
  const ringColor = utility.match(/^ring-(.+)$/);
  if (ringColor) {
    const c = resolveColor(ringColor[1], bucket.theme);
    if (c) return add('@ring-color', colorToStr(c)), decls;
  }

  // ── цвета ──
  const bg = utility.match(/^bg-(.+)$/);
  if (bg) {
    const c = resolveColor(bg[1], bucket.theme);
    if (c !== null) return add('background-color', colorToStr(c)), decls;
    if (bg[1] === 'transparent') return add('background-color', 'transparent'), decls;
  }
  const borderC = utility.match(/^border-(.+)$/);
  if (borderC) {
    const c = resolveColor(borderC[1], bucket.theme);
    if (c !== null) return add('border-color', colorToStr(c)), decls;
  }
  const textM = utility.match(/^text-(.+)$/);
  if (textM) {
    const t = textM[1];
    if (FONT_SIZE[t]) { add('font-size', FONT_SIZE[t][0]); add('line-height', FONT_SIZE[t][1]); return decls; }
    if (['left', 'center', 'right', 'justify'].includes(t)) return add('text-align', t), decls;
    const arbT = t.match(/^\[(.+)\]$/);
    if (arbT) return add('font-size', normalizeValue('', arbT[1])), decls;
    const c = resolveColor(t, bucket.theme);
    if (c !== null) return add('color', colorToStr(c)), decls;
  }
  if (utility === 'fill-current') return add('fill', 'currentcolor'), decls;
  if (utility === 'divide-y') return add('@divide-y', '1px'), decls;
  const divideC = utility.match(/^divide-(.+)$/);
  if (divideC) {
    const c = resolveColor(divideC[1], bucket.theme);
    if (c !== null) return add('@divide-color', colorToStr(c)), decls;
  }

  // ── типографика ──
  const fontW = utility.match(/^font-(.+)$/);
  if (fontW) {
    const t = fontW[1];
    const arb = t.match(/^\[(\d+)\]$/);
    if (arb) return add('font-weight', arb[1]), decls;
    if (FONT_WEIGHT[t]) return add('font-weight', FONT_WEIGHT[t]), decls;
    if (['sans', 'display', 'mono'].includes(t)) return add('font-family', `@${t}`), decls;
  }
  const track = utility.match(/^tracking-(.+)$/);
  if (track) {
    const t = track[1];
    const arb = t.match(/^\[(.+)\]$/);
    if (arb) return add('letter-spacing', normalizeValue('', arb[1])), decls;
    if (TRACKING[t] !== undefined) return add('letter-spacing', TRACKING[t]), decls;
  }
  if (utility === 'leading-none') return add('line-height', '1'), decls;
  const leading = utility.match(/^leading-(\d+)$/);
  if (leading) return add('line-height', resolveLength(leading[1])), decls;
  if (utility === 'whitespace-nowrap') return add('white-space', 'nowrap'), decls;
  if (utility === 'truncate') {
    add('overflow', 'hidden'); add('text-overflow', 'ellipsis'); add('white-space', 'nowrap');
    return decls;
  }
  if (utility === 'underline') return add('text-decoration-line', 'underline'), decls;
  const underlineOffset = utility.match(/^underline-offset-(\d+)$/);
  if (underlineOffset) return add('text-underline-offset', `${underlineOffset[1]}px`), decls;

  // ── эффекты / поведение ──
  const opacity = utility.match(/^opacity-(\d+)$/);
  if (opacity) return add('opacity', String(Number(opacity[1]) / 100)), decls;
  const shadow = utility.match(/^shadow(-[a-z0-9]+)?$/);
  if (shadow && SHADOWS[(shadow[1] || '').slice(1)] !== undefined) {
    const key = (shadow[1] || '').slice(1);
    return add('box-shadow', key === 'none' ? 'none' : `@shadow-${key || 'sm'}`), decls;
  }
  if (utility === 'overflow-hidden') return add('overflow', 'hidden'), decls;
  if (utility === 'overflow-auto') return add('overflow', 'auto'), decls;
  if (utility === 'overflow-y-auto') return add('overflow-y', 'auto'), decls;
  if (utility === 'overflow-x-hidden') return add('overflow-x', 'hidden'), decls;
  const cursor = utility.match(/^cursor-(.+)$/);
  if (cursor) return add('cursor', cursor[1]), decls;
  if (utility === 'pointer-events-none') return add('pointer-events', 'none'), decls;
  if (utility === 'pointer-events-auto') return add('pointer-events', 'auto'), decls;
  if (utility === 'select-none') return add('user-select', 'none'), decls;
  if (utility === 'outline-none' || utility === 'outline-hidden') { add('outline-style', 'none'); return decls; }
  const transition = utility.match(/^transition(-[a-z]+)?$/);
  if (transition) {
    const what = (transition[1] || '-all').slice(1);
    const propMap = {
      'all': 'all', 'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      'transform': 'transform', 'opacity': 'opacity', 'shadow': 'box-shadow',
    };
    add('transition-property', propMap[what] || what);
    add('transition-duration', '150ms');
    return decls;
  }
  const duration = utility.match(/^duration-(\d+)$/);
  if (duration) return add('transition-duration', `${duration[1]}ms`), decls;
  const ease = utility.match(/^ease-(linear|in|out|in-out)$/);
  if (ease) return add('transition-timing-function', ease[1] === 'linear' ? 'linear' : `cubic-bezier(${ease[1] === 'in' ? '0.4, 0, 1, 1' : ease[1] === 'out' ? '0, 0, 0.2, 1' : '0.4, 0, 0.2, 1'})`), decls;

  return null;
}

function colorToStr(c) {
  if (typeof c === 'string') return c;
  if (c && c.alpha) return `alpha(${c.alpha.color}, ${c.alpha.value})`;
  return String(c);
}

/**
 * Классы orbit-элемента → декларации для бакета
 * {theme, attrs, pseudo}. Поздние классы перекрывают ранние (tw-merge).
 */
function tailwindToDecls(classStr, bucket, unmapped) {
  const out = {};
  const ring = {};
  const rawTokens = classStr.split(/\s+/).filter(Boolean);
  // Порядок Tailwind-каскада: утилиты с бОльшим числом вариантов (dark:, md:,
  // data-[…]:) идут в слоях ПОСЛЕ базовых, поэтому сортируем устойчиво по
  // числу вариантов — иначе «поздний» базовый класс в строке перетирал бы
  // dark:-вариант (реальный CSS так не делает).
  const tokens = rawTokens
    .map((cls, idx) => ({ cls, idx, vcount: splitVariants(cls).variants.length }))
    .sort((x, y) => x.vcount - y.vcount || x.idx - y.idx)
    .map((t) => t.cls);
  for (const cls of tokens) {
    if (IGNORED_TW.has(cls)) continue;
    if (IGNORED_TW_PREFIXES.some((p) => cls.startsWith(p))) continue;
    const { variants, utility } = splitVariants(cls);
    // Варианты псевдоэлементов (placeholder:, file:) не моделируем — пропускаем.
    if (variants.some((v) => ['placeholder', 'file', 'marker', 'selection', 'before', 'after'].includes(v))) continue;
    let applies = true;
    let unknownVariant = false;
    for (const v of variants) {
      const r = variantApplies(v, bucket);
      if (r === null) { unknownVariant = true; applies = false; break; }
      if (!r) { applies = false; break; }
    }
    if (unknownVariant) { unmapped.add(cls); continue; }
    if (!applies) continue;
    const decls = mapUtility(utility, bucket, unmapped);
    if (!decls) { unmapped.add(cls); continue; }
    for (const [prop, value] of Object.entries(decls)) {
      if (prop.startsWith('@ring') || prop === '@ring-width' || prop === '@ring-offset' || prop === '@ring-color' || prop === '@ring-offset-color') {
        ring[prop] = value;
      } else {
        out[prop] = value;
      }
    }
  }
  // Композиция кольца в box-shadow: offset-слой + ring-слой.
  if (ring['@ring-width'] && parseFloat(ring['@ring-width']) !== 0) {
    const w = ring['@ring-width'];
    const off = ring['@ring-offset'] || '0';
    const offC = ring['@ring-offset-color'] || (bucket.theme === 'dark' ? '#000000' : '#ffffff');
    const ringC = ring['@ring-color'] || 'currentcolor';
    const layers = [];
    if (off !== '0') layers.push(`0 0 0 ${off} ${offC}`);
    const total = `calc(${off} + ${w})`;
    layers.push(`0 0 0 ${off === '0' ? w : total} ${ringC}`);
    out['@ring'] = layers.join(', ');
    // box-shadow тоже выставляем — если seal реализует кольцо через shadow
    if (!out['box-shadow']) out['box-shadow'] = layers.join(', ');
  }
  return out;
}

// ─── Парсер tokens.css ──────────────────────────────────────────────────────

function parseTokensCss(css) {
  const clean = stripCssComments(css);
  const lines = css.split('\n');
  // Индекс «позиция в clean-строке → номер строки» не ведём: для отчёта
  // достаточно порядка правил.
  const rules = []; // {selector, decls: [prop, value], media, order}
  const tokenBlocks = { light: {}, dark: {} };

  let i = 0;
  let order = 0;
  const n = clean.length;

  function parseDecls(body) {
    const decls = [];
    for (const raw of body.split(';')) {
      const idx = raw.indexOf(':');
      if (idx === -1) continue;
      const prop = raw.slice(0, idx).trim();
      const value = raw.slice(idx + 1).trim();
      if (!prop || !value) continue;
      decls.push([prop, value]);
    }
    return decls;
  }

  function parseBlock(startIdx) {
    // Возвращает [body, nextIdx] для блока, начинающегося с '{' в startIdx.
    let depth = 0;
    let j = startIdx;
    let quote = null;
    for (; j < n; j += 1) {
      const ch = clean[j];
      if (quote) {
        if (ch === quote && clean[j - 1] !== '\\') quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return [clean.slice(startIdx + 1, j), j + 1];
      }
    }
    return [clean.slice(startIdx + 1), n];
  }

  while (i < n) {
    const brace = clean.indexOf('{', i);
    if (brace === -1) break;
    const prelude = clean.slice(i, brace).trim();
    const [body, next] = parseBlock(brace);

    if (prelude.startsWith('@media')) {
      // Вложенные правила внутри медиа-блока.
      let k = 0;
      while (k < body.length) {
        const b2 = body.indexOf('{', k);
        if (b2 === -1) break;
        const sel = body.slice(k, b2).trim();
        let depth = 0; let j = b2; let q = null;
        for (; j < body.length; j += 1) {
          const ch = body[j];
          if (q) { if (ch === q && body[j - 1] !== '\\') q = null; continue; }
          if (ch === '"' || ch === "'") { q = ch; continue; }
          if (ch === '{') depth += 1;
          else if (ch === '}') { depth -= 1; if (depth === 0) break; }
        }
        const inner = body.slice(b2 + 1, j);
        if (sel) rules.push({ selector: sel, decls: parseDecls(inner), media: prelude, order: order++ });
        k = j + 1;
      }
    } else if (prelude.startsWith('@font-face') || prelude.startsWith('@keyframes') || prelude.startsWith('@supports') || prelude.startsWith('@layer')) {
      // пропускаем целиком (внутри @supports бывают правила — у нас их нет)
    } else if (prelude) {
      const decls = parseDecls(body);
      // Токен-блоки: :root и [data-theme='dark']
      if (/^:root(\s|$|,)/.test(prelude) || prelude === ':root') {
        for (const [p, v] of decls) if (p.startsWith('--')) tokenBlocks.light[p] = v;
      } else if (prelude === "[data-theme='dark']" || prelude === '[data-theme="dark"]') {
        for (const [p, v] of decls) if (p.startsWith('--')) tokenBlocks.dark[p] = v;
      }
      rules.push({ selector: prelude, decls, media: null, order: order++ });
    }
    i = next;
  }

  return { rules, tokenBlocks };
}

/** Рекурсивно резолвит var(--x) в литералы по токен-блоку темы. */
function makeVarResolver(tokenBlocks, theme) {
  const base = { ...tokenBlocks.light, ...(theme === 'dark' ? tokenBlocks.dark : {}) };
  const cache = new Map();
  function resolveVar(name, depth = 0) {
    if (depth > 12) return `var(${name})`;
    if (cache.has(name)) return cache.get(name);
    cache.set(name, `var(${name})`); // защита от циклов
    let value = base[name];
    if (value === undefined) return `var(${name})`;
    value = resolveVarsInValue(value, depth + 1);
    cache.set(name, value);
    return value;
  }
  function resolveVarsInValue(value, depth = 0) {
    if (depth > 12) return value;
    return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]+(?:\([^)]*\))[^()]*))?\)/g, (m, name, fallback) => {
      const resolved = resolveVar(name, depth + 1);
      if (resolved === `var(${name})` && fallback) return resolveVarsInValue(fallback.trim(), depth + 1);
      return resolved;
    });
  }
  return resolveVarsInValue;
}

// ─── Селекторы: парсинг и матчинг ───────────────────────────────────────────

/** Разбивает сложный селектор на цепочку [compound, combinator, compound…]. */
function parseSelectorChain(selector) {
  const tokens = [];
  let current = '';
  let paren = 0;
  let bracket = 0;
  let quote = null;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (quote) {
      current += ch;
      if (ch === quote && selector[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === '(') paren += 1;
    if (ch === ')') paren -= 1;
    if (ch === '[') bracket += 1;
    if (ch === ']') bracket -= 1;
    if ((ch === '>' || ch === '+' || ch === '~') && paren === 0 && bracket === 0) {
      if (current.trim()) tokens.push({ compound: current.trim() });
      tokens.push({ combinator: ch });
      current = '';
      continue;
    }
    if (ch === ' ' && paren === 0 && bracket === 0) {
      if (current.trim()) {
        tokens.push({ compound: current.trim() });
        tokens.push({ combinator: ' ' });
      }
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) tokens.push({ compound: current.trim() });
  // Схлопываем повторяющиеся пробельные комбинаторы и « > »
  const out = [];
  for (const t of tokens) {
    if (t.combinator) {
      if (out.length && out[out.length - 1].combinator) { out[out.length - 1] = t; continue; }
      out.push(t);
      continue;
    }
    if (out.length && !out[out.length - 1].combinator) out.push({ combinator: ' ' });
    out.push(t);
  }
  return out;
}

/** Разбирает compound-селектор: тег, классы, атрибуты, псевдоклассы. */
function parseCompound(compound) {
  const parts = { tag: null, classes: [], attrs: [], pseudos: [], where: null, not: [], universal: false };
  let i = 0;
  const n = compound.length;
  let currentToken = '';
  while (i < n) {
    const ch = compound[i];
    if (ch === '.' || ch === '#' || ch === ':' || ch === '[') {
      if (currentToken && !parts.tag && parts.classes.length === 0 && parts.attrs.length === 0 && parts.pseudos.length === 0) {
        if (currentToken === '*') parts.universal = true; else parts.tag = currentToken.toLowerCase();
      }
      currentToken = '';
      if (ch === '.') {
        let j = i + 1;
        while (j < n && !'.#:[ '.includes(compound[j])) j += 1;
        parts.classes.push(compound.slice(i + 1, j));
        i = j;
        continue;
      }
      if (ch === '[') {
        let depth = 0; let j = i; let q = null;
        for (; j < n; j += 1) {
          const c2 = compound[j];
          if (q) { if (c2 === q && compound[j - 1] !== '\\') q = null; continue; }
          if (c2 === '"' || c2 === "'") { q = c2; continue; }
          if (c2 === '[') depth += 1;
          if (c2 === ']') { depth -= 1; if (depth === 0) break; }
        }
        const attrStr = compound.slice(i + 1, j);
        const am = attrStr.match(/^([\w-]+)\s*(=|\^=|\$=|\*=|~=|\|=)?\s*(.*)$/);
        if (am) parts.attrs.push({ name: am[1], op: am[2] || null, value: am[3] ? am[3].replace(/^["']|["']$/g, '') : null });
        i = j + 1;
        continue;
      }
      if (ch === ':') {
        let j = i + 1;
        if (compound[j] === ':') j += 1; // pseudo-element — не наш случай
        while (j < n && !'.#:[( '.includes(compound[j])) j += 1;
        let name = compound.slice(i + 1, j);
        let arg = null;
        if (compound[j] === '(') {
          let depth = 0; let k = j; let q = null;
          for (; k < n; k += 1) {
            const c2 = compound[k];
            if (q) { if (c2 === q && compound[k - 1] !== '\\') q = null; continue; }
            if (c2 === '"' || c2 === "'") { q = c2; continue; }
            if (c2 === '(') depth += 1;
            if (c2 === ')') { depth -= 1; if (depth === 0) break; }
          }
          arg = compound.slice(j + 1, k);
          j = k + 1;
          // у :not(a, b) аргумент может содержать ',' — оставляем как есть
        }
        if (name === 'where' && arg !== null) parts.where = arg;
        else if (name === 'not' && arg !== null) parts.not.push(arg);
        else parts.pseudos.push({ name, arg });
        i = j;
        continue;
      }
      if (ch === '#') {
        // id — не используем; пропускаем токен
        let j = i + 1;
        while (j < n && !'.#:[ '.includes(compound[j])) j += 1;
        parts.attrs.push({ name: 'id', op: '=', value: compound.slice(i + 1, j) });
        i = j;
        continue;
      }
    }
    currentToken += ch;
    i += 1;
  }
  if (currentToken) {
    if (currentToken === '*') parts.universal = true;
    else if (!parts.tag && parts.classes.length === 0 && parts.pseudos.length === 0 && parts.attrs.length === 0) parts.tag = currentToken.toLowerCase();
  }
  return parts;
}

function attrMatches(descAttrs, attr) {
  const have = descAttrs[attr.name];
  if (attr.op === null) return have !== undefined;
  if (have === undefined) return false;
  switch (attr.op) {
    case '=': return have === attr.value;
    case '^=': return String(have).startsWith(attr.value);
    case '$=': return String(have).endsWith(attr.value);
    case '*=': return String(have).includes(attr.value);
    default: return false;
  }
}

function pseudoMatches(desc, pseudo) {
  const { name, arg } = pseudo;
  if (name === 'disabled') return desc.pseudos.includes('disabled') || desc.attrs['disabled'] !== undefined;
  if (name === 'hover') return desc.pseudos.includes('hover');
  if (name === 'focus') return desc.pseudos.includes('focus') || desc.pseudos.includes('focus-visible');
  if (name === 'focus-visible') return desc.pseudos.includes('focus-visible');
  if (name === 'active') return desc.pseudos.includes('active');
  if (name === 'first-child' || name === 'last-child' || name === 'only-child') return desc.pseudos.includes(name);
  if (name === 'empty') return false;
  if (name === 'has') {
    const inner = (arg || '').replace(/^>\s*/, '').trim();
    const hasClasses = [...inner.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
    return hasClasses.length > 0 && hasClasses.every((c) => (desc.contains || []).includes(c));
  }
  return false; // остальные псевдоклассы не матчим
}

/** Матчит compound против дескриптора; возвращает специфичность или null. */
function matchCompound(parts, desc) {
  let b = 0; let c = 0;
  if (parts.tag && parts.tag !== (desc.tag || null)) return null;
  if (parts.tag) c += 1;
  if (parts.universal) { /* * — 0 специфичности */ }
  for (const cls of parts.classes) {
    if (!desc.classes.includes(cls)) return null;
    b += 1;
  }
  for (const attr of parts.attrs) {
    if (!attrMatches(desc.attrs || {}, attr)) return null;
    b += 1;
  }
  for (const pseudo of parts.pseudos) {
    if (!pseudoMatches(desc, pseudo)) return null;
    b += 1;
  }
  for (const notArg of parts.not) {
    // :not(...) — специфичность по самому специфичному внутреннему
    const innerList = notArg.split(',').map((s) => s.trim());
    let innerMax = { b: 0, c: 0 };
    let anyMatches = false;
    for (const inner of innerList) {
      const parsed = parseCompound(inner);
      const r = matchCompound(parsed, desc);
      if (r !== null) { anyMatches = true; innerMax = r; break; }
      const spec = specOf(parsed);
      if (spec.b > innerMax.b) innerMax = spec;
    }
    if (anyMatches) return null;
    b += innerMax.b; c += innerMax.c;
  }
  if (parts.where !== null) {
    // :where(...) — матчим содержимое, специфичность 0
    const innerList = parts.where.split(',').map((s) => s.trim());
    let matched = false;
    for (const inner of innerList) {
      const parsed = parseCompound(inner);
      if (matchCompoundNoSpec(parsed, desc)) { matched = true; break; }
    }
    if (!matched) return null;
  }
  return { b, c };
}

function matchCompoundNoSpec(parts, desc) {
  return matchCompound(parts, desc) !== null;
}

function specOf(parts) {
  let b = parts.classes.length + parts.attrs.length + parts.pseudos.length;
  let c = parts.tag ? 1 : 0;
  for (const notArg of parts.not) b += parseCompound(notArg.split(',')[0].trim()).classes.length;
  return { b, c };
}

function mediaApplies(media) {
  if (!media) return true;
  const minW = media.match(/min-width:\s*(\d+)px/);
  const maxW = media.match(/max-width:\s*(\d+)px/);
  if (minW && VIEWPORT_WIDTH < Number(minW[1])) return false;
  if (maxW && VIEWPORT_WIDTH > Number(maxW[1])) return false;
  if (/prefers-color-scheme/.test(media)) return false; // темы рулим через [data-theme]
  return true;
}

/**
 * Каскад: все правила tokens.css, матчащие дескриптор
 * {classes, attrs, pseudos, tag, ancestors: [desc…], theme, contains}.
 * Возвращает Map prop → {value, order, spec, selector}.
 */
function computeSealDecls(desc, parsed, theme) {
  const matches = [];
  for (const rule of parsed.rules) {
    if (!mediaApplies(rule.media)) continue;
    let selector = rule.selector;
    // [data-theme='dark']-префикс → скоуп темы
    let ruleTheme = null;
    const darkPrefix = selector.match(/^\[data-theme='dark'\]\s*(.*)$/);
    if (darkPrefix) {
      ruleTheme = 'dark';
      selector = darkPrefix[1].trim();
    }
    if (ruleTheme && ruleTheme !== theme) continue;

    const selectorList = splitSelectorList(selector);
    for (const sel of selectorList) {
      const chain = parseSelectorChain(sel);
      if (!chain.length) continue;
      const last = chain[chain.length - 1];
      if (!last.compound) continue;
      const spec = matchCompound(parseCompound(last.compound), desc);
      if (!spec) continue;
      // Проверяем левую часть цепочки по ancestors
      let ok = true;
      // Скоуп темы — полноценный атрибут-селектор: +1 к специфичности,
      // иначе поздние light-правила перебивают dark-правила (в браузере не так).
      let specB = spec.b + (darkPrefix ? 1 : 0); let specC = spec.c;
      if (chain.length > 1) {
        const ancestors = desc.ancestors || [];
        // идём справа налево
        let ai = ancestors.length - 1;
        for (let ci = chain.length - 2; ci >= 0; ci -= 1) {
          const item = chain[ci];
          if (item.combinator) continue;
          const comb = chain[ci + 1] && chain[ci + 1].combinator ? chain[ci + 1].combinator : ' ';
          let matchedAnc = null;
          if (comb === '>') {
            const anc = ancestors[ai];
            if (anc) {
              const s = matchCompound(parseCompound(item.compound), anc);
              if (s) { matchedAnc = s; ai -= 1; }
            }
            if (!matchedAnc) { ok = false; break; }
          } else {
            while (ai >= 0) {
              const anc = ancestors[ai];
              ai -= 1;
              const s = matchCompound(parseCompound(item.compound), anc);
              if (s) { matchedAnc = s; break; }
            }
            if (!matchedAnc) { ok = false; break; }
          }
          if (matchedAnc) { specB += matchedAnc.b; specC += matchedAnc.c; }
        }
      }
      if (ok) {
        matches.push({ rule, specB, specC });
        break; // один селектор из списка сматчил — правило применяется один раз
      }
    }
  }
  matches.sort((x, y) => (x.specB - y.specB) || (x.specC - y.specC) || (x.rule.order - y.rule.order));
  const finalDecls = new Map();
  for (const { rule, specB } of matches) {
    for (const [prop, value] of rule.decls) {
      finalDecls.set(prop, { value, specB, selector: rule.selector, media: rule.media });
    }
  }
  return finalDecls;
}

/** Режет список селекторов по запятым верхнего уровня. */
function splitSelectorList(selector) {
  const out = [];
  let depthParen = 0; let depthBracket = 0; let quote = null; let current = '';
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (quote) {
      current += ch;
      if (ch === quote && selector[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === '(') depthParen += 1;
    if (ch === ')') depthParen -= 1;
    if (ch === '[') depthBracket += 1;
    if (ch === ']') depthBracket -= 1;
    if (ch === ',' && depthParen === 0 && depthBracket === 0) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

// ─── Канонизация значений seal для сравнения ────────────────────────────────

/** Разбивает значение по сепаратору ВЕРХНЕГО уровня (скобки/кавычки учитываются). */
function splitTopLevel(value, sep = null) {
  const out = [];
  let depth = 0; let quote = null; let current = '';
  const isSep = (ch) => (sep ? ch === sep : /\s/.test(ch));
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quote) {
      current += ch;
      if (ch === quote && value[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; current += ch; continue; }
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (isSep(ch) && depth === 0) {
      if (current.trim()) out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** 1–4 значения бокса → [top, right, bottom, left]. */
function expandBox(bits) {
  if (bits.length === 1) return [bits[0], bits[0], bits[0], bits[0]];
  if (bits.length === 2) return [bits[0], bits[1], bits[0], bits[1]];
  if (bits.length === 3) return [bits[0], bits[1], bits[2], bits[1]];
  return [bits[0], bits[1], bits[2], bits[3]];
}

/**
 * seal-декларации → канонические свойства (те же, что у orbit-стороны):
 * transform → @translate-x/@translate-y; shadow-токены → @shadow-*;
 * ring-box-shadow → @ring.
 */
function canonSealDecls(decls, resolveVars) {
  const out = {};
  for (const [prop, entry] of decls.entries()) {
    let value = resolveVars(entry.value);
    if (prop === 'transform' || prop === 'translate') {
      const tx = value.match(/translatex\(([^)]+)\)/i);
      const ty = value.match(/translatey\(([^)]+)\)/i);
      if (normalizeValue('', value) === 'none') { out['@translate-x'] = '0'; out['@translate-y'] = '0'; continue; }
      if (tx) out['@translate-x'] = normalizeValue('', tx[1]);
      if (ty) out['@translate-y'] = normalizeValue('', ty[1]);
      const rest = value.replace(/translate[xy]?\([^)]*\)\s*/gi, '').trim();
      if (rest && rest !== 'none') out[prop] = normalizeValue(prop, rest);
      continue;
    }
    // Шортхенд gap → row-gap/column-gap (орбит даёт gap-x-*/gap-y-* раздельно).
    if (prop === 'gap') {
      const bits = splitTopLevel(value);
      out['gap'] = normalizeValue(prop, value);
      out['row-gap'] = normalizeValue('', bits[0]);
      out['column-gap'] = normalizeValue('', bits[1] !== undefined ? bits[1] : bits[0]);
      continue;
    }
    // Шортхенды padding/margin → четыре стороны (орбит даёт px-*/py-*).
    const boxShort = prop.match(/^(padding|margin)$/);
    if (boxShort) {
      const bits = splitTopLevel(value);
      const [t, r, b, l] = expandBox(bits);
      out[`${prop}-top`] = normalizeValue('', t);
      out[`${prop}-right`] = normalizeValue('', r);
      out[`${prop}-bottom`] = normalizeValue('', b);
      out[`${prop}-left`] = normalizeValue('', l);
      out[prop] = normalizeValue(prop, value);
      continue;
    }
    // Шортхенд border → width/style/color (орбит-сторона даёт их раздельно).
    const borderShort = prop.match(/^border(-(top|right|bottom|left))?$/);
    if (borderShort) {
      const suffix = borderShort[2] ? `-${borderShort[2]}` : '';
      const bits = splitTopLevel(value);
      // Шортхенд из менее специфичного правила не должен перетирать уже
      // разложенные лонгхенды (каскад уже разрешён в finalDecls).
      for (const bit of bits) {
        if (/^(thin|medium|thick)$/.test(bit) || /^\d/.test(bit)) {
          if (out[`border${suffix}-width`] === undefined) out[`border${suffix}-width`] = normalizeValue('', bit);
        } else if (['solid', 'dashed', 'dotted', 'double', 'none', 'hidden'].includes(bit)) {
          if (out[`border${suffix}-style`] === undefined) out[`border${suffix}-style`] = bit;
        } else if (out[`border${suffix}-color`] === undefined) out[`border${suffix}-color`] = normalizeValue('', bit);
      }
      if (out[`border${suffix}-style`] === undefined && !bits.some((b) => ['solid', 'dashed', 'dotted', 'double', 'none', 'hidden'].includes(b))) out[`border${suffix}-style`] = 'solid';
      if (out[`border${suffix}-width`] === undefined) out[`border${suffix}-width`] = 'medium';
      continue;
    }
    // Шортхенд background с одним цветовым значением → background-color
    // (seal пишет `background: var(--token)`; orbit — bg-* → background-color).
    if (prop === 'background') {
      const v = value.trim();
      if (/^(oklch|hsl|rgb|hwb|lab|lch|color|color-mix|light-dark)\(|^#[0-9a-f]{3,8}$|^[a-z]+$/i.test(v)) {
        out['background-color'] = normalizeValue('', v);
      } else {
        out['background'] = normalizeValue(prop, v);
      }
      continue;
    }
    if (prop === 'box-shadow') {
      // Слои разделяем с учётом скобок (color-mix/oklch содержат запятые).
      const layers = splitTopLevel(value, ',');
      // Ring-слои «0 0 0 Xpx …» у orbit живут в @ring (из ring-утилит) —
      // отделяем их, остальные слои остаются тенью.
      const ringLayers = layers.filter((l) => /^0 0 0 \d/.test(l.trim()));
      const restLayers = layers.filter((l) => !/^0 0 0 \d/.test(l.trim()));
      if (ringLayers.length && restLayers.length === 0) {
        // Только кольцо — orbit-сторона держит его и в box-shadow, и в @ring.
        out['box-shadow'] = normalizeValue(prop, layers.join(', '));
        out['@ring'] = ringLayers.map((l) => normalizeValue('', l)).join(', ');
      } else {
        if (ringLayers.length) out['@ring'] = ringLayers.map((l) => normalizeValue('', l)).join(', ');
        if (restLayers.length) out['box-shadow'] = normalizeValue(prop, restLayers.join(', '));
      }
      continue;
    }
    if (prop === 'transition') {
      out['transition'] = normalizeValue(prop, value);
      // Дробим шортхенд на property/duration для мягкого сравнения.
      const parts = splitTopLevel(value, ',');
      const props = [];
      const durs = [];
      for (const part of parts) {
        const bits = part.split(/\s+/);
        props.push(bits[0]);
        const durBit = bits.find((b) => /^\d/.test(b) && /(m?s)$/.test(b));
        if (durBit) durs.push(normalizeValue('', durBit));
      }
      out['transition-property'] = props.join(', ');
      if (durs.length) out['transition-duration'] = durs.join(', ');
      continue;
    }
    out[prop] = normalizeValue(prop, value);
  }
  return out;
}

/**
 * Канонизирует box-shadow: раскрывает отсутствующий spread (0 1px 2px rgb(..)
 * ≡ 0 1px 2px 0 rgb(..)) — иначе одна и та же тень не совпадает строково.
 */
function canonShadow(value) {
  const layers = [];
  let depth = 0; let current = '';
  for (const ch of value) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) { layers.push(current); current = ''; continue; }
    current += ch;
  }
  layers.push(current);
  return layers.map((layer) => {
    const parts = splitTopLevel(layer.trim());
    // Считаем длины до первого не-длины (цвета/inset) — если их 3, spread = 0.
    let lengths = 0;
    for (const part of parts) {
      if (/^-?[\d.]+(px|rem|em|%)?$/.test(part)) lengths += 1;
      else break;
    }
    if (lengths === 3) {
      const out = [...parts];
      out.splice(3, 0, '0');
      return out.join(' ');
    }
    return parts.join(' ');
  }).join(', ');
}

/** Определяет ступень тени: сначала Polar-токены, затем TW-литералы. */
function shadowTier(value, resolvedTokens) {
  const norm = canonShadow(normalizeValue('', value));
  for (const tier of ['xs', 'sm', 'md', 'lg']) {
    const token = resolvedTokens[`--seal-shadow-${tier}`];
    if (token && canonShadow(normalizeValue('', token)) === norm) return tier;
  }
  for (const [tier, literal] of Object.entries(SHADOWS)) {
    if (tier && canonShadow(normalizeValue('', literal)) === norm) return tier === '' ? 'sm' : tier;
  }
  return null;
}

// ─── Конфигурация компонентов ───────────────────────────────────────────────
// orbit: {file, anchors: [подстроки для поиска строковых литералов]}
// seal: {classes, attrs?, tag?, ancestors?, contains?}
// states: [{name, theme, orbitAttrs, sealAttrs, pseudo, orbitExtra}]
//   orbitAttrs — data-атрибуты для data-[…]: вариантов orbit;
//   sealAttrs  — атрибуты дескриптора seal;
//   orbitExtra — дополнительные классы (условные ветки cva).

/**
 * TW4 border-утилиты дают ширину и цвет раздельно (border-b + border-gray-200 =
 * цвет на все стороны, ширина на одну). Приводим к сторонам: без ширины цвет/стиль
 * невидимы — снимаем; при частичных ширинах распределяем общий цвет по сторонам.
 */
function normalizeBorderDecls(decls) {
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const allWidth = decls['border-width'] !== undefined ? parseFloat(decls['border-width']) : 0;
  const widths = {};
  for (const s of SIDES) {
    widths[s] = decls[`border-${s}-width`] !== undefined ? parseFloat(decls[`border-${s}-width`]) : allWidth;
  }
  const sidesWithWidth = SIDES.filter((s) => widths[s] > 0);
  if (sidesWithWidth.length === 0) {
    for (const k of Object.keys(decls)) {
      if (/^border(-(top|right|bottom|left))?-(color|style)$/.test(k) || k === 'border-color' || k === 'border-style') delete decls[k];
    }
    return decls;
  }
  if (sidesWithWidth.length < 4) {
    const allColor = decls['border-color'];
    const allStyle = decls['border-style'];
    for (const s of sidesWithWidth) {
      if (decls[`border-${s}-color`] === undefined && allColor !== undefined) decls[`border-${s}-color`] = allColor;
      if (decls[`border-${s}-style`] === undefined && allStyle !== undefined) decls[`border-${s}-style`] = allStyle;
    }
    delete decls['border-color'];
    delete decls['border-style'];
    for (const s of SIDES) {
      if (widths[s] <= 0) {
        delete decls[`border-${s}-color`];
        delete decls[`border-${s}-style`];
        delete decls[`border-${s}-width`];
      }
    }
    delete decls['border-width'];
  }
  return decls;
}

const S = (name, extra = {}) => ({ name, ...extra });

const COMPONENTS = [
  {
    component: 'Switch',
    orbitFile: 'components/Switch.tsx',
    parts: [
      {
        part: 'Root (трек)',
        anchors: ['focus-visible:ring-ring focus-visible:ring-offset-background'],
        seal: { classes: ['seal-switch'] },
        states: [
          S('light:unchecked', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('light:checked', { theme: 'light', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-checked': '' } }),
          S('dark:unchecked', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('dark:checked', { theme: 'dark', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-checked': '' } }),
          S('light:disabled', { theme: 'light', pseudo: 'disabled', orbitAttrs: { 'data-state': 'unchecked' }, sealAttrs: { 'data-disabled': '' } }),
        ],
      },
      {
        part: 'Thumb (кругляш)',
        anchors: ['bg-background dark:data-[state=unchecked]:bg-polar-500'],
        seal: { classes: ['seal-switch-thumb'], ancestors: [{ classes: ['seal-switch'], attrs: {} }] },
        states: [
          S('light:unchecked', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('light:checked', {
            theme: 'light',
            orbitAttrs: { 'data-state': 'checked' },
            sealAttrs: {},
            sealAncestorAttrs: { 'data-checked': '' },
          }),
          S('dark:unchecked', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('dark:checked', {
            theme: 'dark',
            orbitAttrs: { 'data-state': 'checked' },
            sealAncestorAttrs: { 'data-checked': '' },
          }),
        ],
      },
    ],
  },
  {
    component: 'Checkbox',
    orbitFile: 'components/Checkbox.tsx',
    parts: [
      {
        part: 'Root (default)',
        anchors: [
          'ring-offset-background focus-visible:ring-ring peer h-4 w-4',
          'dark:border-polar-600 border-gray-300 data-[state=checked]:border-black',
        ],
        seal: { classes: ['seal-checkbox'] },
        states: [
          S('light:unchecked', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('light:checked', { theme: 'light', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-checked': '' } }),
          S('dark:unchecked', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' } }),
          S('dark:checked', { theme: 'dark', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-checked': '' } }),
          S('light:focus', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' }, pseudo: 'focus-visible' }),
          S('dark:focus', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' }, pseudo: 'focus-visible' }),
          S('light:disabled', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' }, pseudo: 'disabled' }),
          S('dark:disabled', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' }, pseudo: 'disabled' }),
          S('light:indeterminate', { theme: 'light', orbitAttrs: { 'data-state': 'indeterminate' }, sealAttrs: { 'data-indeterminate': '' } }),
          S('dark:indeterminate', { theme: 'dark', orbitAttrs: { 'data-state': 'indeterminate' }, sealAttrs: { 'data-indeterminate': '' } }),
        ],
      },
      {
        part: 'Root (emphasized)',
        anchors: [
          'ring-offset-background focus-visible:ring-ring peer h-4 w-4',
          'border-primary data-[state=checked]:bg-primary',
        ],
        seal: { classes: ['seal-checkbox'] },
        states: [
          S('light:unchecked', { theme: 'light', orbitAttrs: { 'data-state': 'unchecked' }, sealAttrs: { 'data-emphasized': '' } }),
          S('light:checked', { theme: 'light', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-emphasized': '', 'data-checked': '' } }),
          S('dark:unchecked', { theme: 'dark', orbitAttrs: { 'data-state': 'unchecked' }, sealAttrs: { 'data-emphasized': '' } }),
          S('dark:checked', { theme: 'dark', orbitAttrs: { 'data-state': 'checked' }, sealAttrs: { 'data-emphasized': '', 'data-checked': '' } }),
          S('light:indeterminate', { theme: 'light', orbitAttrs: { 'data-state': 'indeterminate' }, sealAttrs: { 'data-emphasized': '', 'data-indeterminate': '' } }),
          S('dark:indeterminate', { theme: 'dark', orbitAttrs: { 'data-state': 'indeterminate' }, sealAttrs: { 'data-emphasized': '', 'data-indeterminate': '' } }),
        ],
      },
      {
        part: 'Indicator',
        anchors: ['group flex h-full w-full items-center justify-center text-current'],
        seal: { classes: ['seal-checkbox-indicator'], ancestors: [{ classes: ['seal-checkbox'], attrs: {} }] },
        states: [
          S('light:checked', { theme: 'light', orbitAttrs: { 'data-state': 'checked' }, sealAncestorAttrs: { 'data-checked': '' } }),
          S('dark:checked', { theme: 'dark', orbitAttrs: { 'data-state': 'checked' }, sealAncestorAttrs: { 'data-checked': '' } }),
        ],
      },
      {
        part: 'Icon (Check)',
        anchors: ['h-4 w-4 group-data-[state=indeterminate]:hidden'],
        seal: { classes: [], tag: 'svg', ancestors: [{ classes: ['seal-checkbox'], attrs: {} }, { classes: ['seal-checkbox-indicator'] }] },
        states: [
          S('light:checked', { theme: 'light', orbitAttrs: { 'data-state': 'checked' }, sealAncestorAttrs: { 'data-checked': '' } }),
          S('dark:checked', { theme: 'dark', orbitAttrs: { 'data-state': 'checked' }, sealAncestorAttrs: { 'data-checked': '' } }),
        ],
      },
      {
        part: 'Icon (Minus, indeterminate)',
        anchors: ['hidden h-3 w-3 group-data-[state=indeterminate]:block'],
        // hidden↔block меняются групповым селектором у orbit — структурный
        // переключатель видимости, не сравниваем.
        skip: ['display'],
        seal: {
          classes: [],
          tag: 'svg',
          ancestors: [
            { classes: ['seal-checkbox'], attrs: { 'data-indeterminate': '' } },
            { classes: ['seal-checkbox-indicator'] },
          ],
        },
        states: [
          S('light:indeterminate', { theme: 'light', orbitAttrs: { 'data-state': 'indeterminate' }, sealAncestorAttrs: { 'data-indeterminate': '' } }),
          S('dark:indeterminate', { theme: 'dark', orbitAttrs: { 'data-state': 'indeterminate' }, sealAncestorAttrs: { 'data-indeterminate': '' } }),
        ],
      },
    ],
  },
  {
    component: 'Input',
    orbitFile: 'components/Input.tsx',
    parts: [
      {
        part: 'Wrapper (div-обёртка)',
        anchors: ['relative flex flex-1 flex-row rounded-full'],
        seal: { classes: ['seal-input-wrap'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Input (элемент ввода)',
        anchors: ['h-10 rounded-xl border border-gray-200 bg-white'],
        seal: { classes: ['seal-input'] },
        accepted: {
          // z-10 у orbit и z-1 у seal эквивалентны: слоты в обеих реализациях
          // z-10 и идут позже в DOM — рамка фокуса не перекрывает иконки.
          'z-index': 'focus z-1 против orbit z-10: слоты всё равно выше (z-10, позже в DOM)',
        },
        states: [
          S('light', { theme: 'light' }),
          S('dark', { theme: 'dark' }),
          S('light:focus', { theme: 'light', pseudo: 'focus-visible' }),
          S('dark:focus', { theme: 'dark', pseudo: 'focus-visible' }),
        ],
      },
    ],
  },
  {
    component: 'Button',
    orbitFile: 'components/Button.tsx',
    parts: [
      {
        part: 'Base + default (primary)',
        anchors: [
          'relative inline-flex items-center cursor-pointer font-display',
          'bg-black dark:bg-white dark:text-black text-white hover:opacity-85',
          'h-10 px-5 py-3 text-sm',
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'primary', 'data-size': 'md' } },
        states: [
          S('light', { theme: 'light' }),
          S('dark', { theme: 'dark' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
        ],
      },
      {
        part: 'outline',
        anchors: [
          'relative inline-flex items-center cursor-pointer font-display',
          'text-black dark:text-white hover:bg-gray-200 dark:bg-transparent dark:hover:bg-polar-700',
          'h-10 px-5 py-3 text-sm',
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'outline', 'data-size': 'md' } },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' }), S('light:hover', { theme: 'light', pseudo: 'hover' })],
      },
      {
        part: 'ghost',
        anchors: [
          'relative inline-flex items-center cursor-pointer font-display',
          'bg-transparent hover:bg-gray-200 dark:hover:bg-polar-700 dark:bg-transparent text-black dark:text-white',
          'h-10 px-5 py-3 text-sm',
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'ghost', 'data-size': 'md' } },
        states: [S('light', { theme: 'light' }), S('light:hover', { theme: 'light', pseudo: 'hover' })],
      },
      {
        part: 'size sm',
        anchors: [
          'relative inline-flex items-center cursor-pointer font-display',
          'bg-black dark:bg-white dark:text-black text-white hover:opacity-85',
          'h-8 px-3 py-1.5 text-xs',
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'primary', 'data-size': 'sm' } },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'size lg',
        anchors: [
          'relative inline-flex items-center cursor-pointer font-display',
          'bg-black dark:bg-white dark:text-black text-white hover:opacity-85',
          'h-12 px-5 py-4 text-sm',
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'primary', 'data-size': 'lg' } },
        states: [S('light', { theme: 'light' })],
      },
    ],
  },
  {
    component: 'Tooltip',
    orbitFile: 'components/Tooltip.tsx',
    parts: [
      {
        part: 'Content',
        anchors: ['bg-popover text-popover-foreground animate-in'],
        seal: { classes: ['seal-popup', 'seal-popup--tooltip'] },
        // z-index 60 — осознанно: тултип должен лежать выше поповеров/меню
        // (канон .seal-popup-positioner--above), у Radix порядок DOM-ный.
        accepted: { 'z-index': 'sealui: тултип выше поповеров (60), у orbit — общий z-50' },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    component: 'TextArea',
    orbitFile: 'components/TextArea.tsx',
    parts: [
      {
        part: 'Textarea',
        anchors: ['min-h-[120px] rounded-2xl'],
        // sealui Textarea = INPUT_CLASS + seal-textarea (один источник рамки).
        seal: { classes: ['seal-input', 'seal-textarea'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    component: 'Pill',
    orbitFile: 'components/Pill.tsx',
    parts: [
      {
        part: 'Pill (blue)',
        anchors: ['inline-flex items-center space-x-1', 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'blue' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'blue' } }),
        ],
      },
      {
        part: 'Pill (gray)',
        anchors: ['inline-flex items-center space-x-1', 'dark:bg-polar-700 dark:text-polar-300 bg-gray-100 text-gray-600'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'gray' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'gray' } }),
        ],
      },
      {
        part: 'Pill (purple)',
        anchors: ['inline-flex items-center space-x-1', 'bg-purple-100 text-purple-600 dark:bg-purple-700 dark:text-purple-300'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'purple' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'purple' } }),
        ],
      },
      {
        part: 'Pill (yellow)',
        anchors: ['inline-flex items-center space-x-1', 'bg-yellow-100 text-yellow-500 dark:bg-yellow-950'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'yellow' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'yellow' } }),
        ],
      },
      {
        part: 'Pill (red)',
        anchors: ['inline-flex items-center space-x-1', 'bg-red-100 text-red-600 dark:bg-red-700 dark:text-red-300'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'red' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'red' } }),
        ],
      },
      {
        part: 'Pill (green)',
        anchors: ['inline-flex items-center space-x-1', 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'],
        seal: { classes: ['seal-pill'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-color': 'green' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-color': 'green' } }),
        ],
      },
    ],
  },
  {
    component: 'Status',
    orbitFile: 'components/Status.tsx',
    parts: [
      {
        part: 'medium (green)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-emerald-100 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'green' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'green' } }),
        ],
      },
      {
        part: 'medium (red)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'red' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'red' } }),
        ],
      },
      {
        part: 'medium (yellow)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-yellow-100 text-yellow-500 dark:bg-yellow-950 dark:text-yellow-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'yellow' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'yellow' } }),
        ],
      },
      {
        part: 'medium (blue)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-indigo-100 text-indigo-500 dark:bg-indigo-950 dark:text-indigo-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'blue' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'blue' } }),
        ],
      },
      {
        part: 'medium (purple)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-violet-100 text-violet-500 dark:bg-violet-950 dark:text-violet-400'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'purple' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'purple' } }),
        ],
      },
      {
        part: 'medium (gray)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.7em] py-[0.3em] text-sm', 'bg-gray-200 text-gray-500 dark:bg-polar-700 dark:text-polar-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'medium', 'data-color': 'gray' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'medium', 'data-color': 'gray' } }),
        ],
      },
      {
        part: 'small (gray)',
        anchors: ['flex w-fit flex-row items-center justify-center rounded-[0.5em]', 'px-[0.5em] py-[0.2em] text-xs', 'bg-gray-200 text-gray-500 dark:bg-polar-700 dark:text-polar-500'],
        seal: { classes: ['seal-status'] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'data-size': 'small', 'data-color': 'gray' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'data-size': 'small', 'data-color': 'gray' } }),
        ],
      },
    ],
  },
  {
    component: 'Avatar',
    orbitFile: 'components/Avatar.tsx',
    parts: [
      {
        part: 'Root (24px)',
        anchors: ['dark:bg-polar-900 dark:border-polar-700 dark:text-polar-500 relative z-2 flex h-6 w-6'],
        seal: { classes: ['seal-avatar'] },
        accepted: { 'z-index': 'orbit z-2 — локальный оверлей ring-span; у seal кольцо (::after) и так поверх содержимого' },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    component: 'Tabs',
    orbitFile: 'components/Tabs.tsx',
    parts: [
      {
        part: 'List',
        anchors: [
          { file: 'components/ui/tabs.tsx', anchor: 'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1' },
          { file: 'components/Tabs.tsx', anchor: 'relative flex h-fit w-fit flex-row items-start gap-2 rounded-2xl bg-transparent ring-0' },
          { file: 'components/Tabs.tsx', anchor: 'md:flex-row md:items-center md:justify-start' },
        ],
        seal: { classes: ['seal-tabs-list'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Trigger (tab)',
        anchors: [
          { file: 'components/ui/tabs.tsx', anchor: 'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background' },
          { file: 'components/Tabs.tsx', anchor: 'dark:data-[state=active]:bg-polar-700 dark:hover:text-polar-50' },
        ],
        seal: { classes: ['seal-tabs-tab'] },
        accepted: {
          'padding-top': 'seal: height 32px + flex-центрирование вместо py-1.5 (визуально идентично)',
          'padding-bottom': 'seal: height 32px + flex-центрирование вместо py-1.5 (визуально идентично)',
          '@ring': 'focus-visible у seal — outline 2px + offset 2px (эквивалент ring-2 ring-offset-2)',
        },
        states: [
          S('light', { theme: 'light' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('light:active', { theme: 'light', orbitAttrs: { 'data-state': 'active' }, sealAttrs: { 'data-active': '' } }),
          S('dark', { theme: 'dark' }),
          S('dark:hover', { theme: 'dark', pseudo: 'hover' }),
          S('dark:active', { theme: 'dark', orbitAttrs: { 'data-state': 'active' }, sealAttrs: { 'data-active': '' } }),
          S('light:disabled', { theme: 'light', pseudo: 'disabled', sealAttrs: { 'data-disabled': '' } }),
        ],
      },
    ],
  },
  {
    component: 'SegmentedControl',
    orbitFile: 'components/SegmentedControl.tsx',
    parts: [
      {
        part: 'Root (default/md)',
        anchors: ['flex items-center gap-x-1 p-1', 'rounded-full', 'dark:bg-polar-800 bg-gray-50'],
        seal: { classes: ['seal-segmented'], attrs: { 'data-size': 'md', 'data-variant': 'default' } },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Root (tabs/md)',
        anchors: ['flex items-center gap-x-1 p-1', 'rounded-full', 'dark:bg-polar-950 w-full bg-gray-100'],
        seal: { classes: ['seal-segmented'], attrs: { 'data-size': 'md', 'data-variant': 'tabs' } },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Item (default/md, неактивный)',
        anchors: ['cursor-pointer font-medium transition-colors', 'px-3 py-1.5 text-xs', 'dark:text-polar-500 text-gray-500 hover:text-gray-900 dark:hover:text-white'],
        seal: { classes: ['seal-segmented-item'], ancestors: [{ classes: ['seal-segmented'], attrs: { 'data-size': 'md', 'data-variant': 'default' } }] },
        states: [
          S('light', { theme: 'light' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('dark', { theme: 'dark' }),
          S('dark:hover', { theme: 'dark', pseudo: 'hover' }),
        ],
      },
      {
        part: 'Item (default/md, активный)',
        anchors: ['cursor-pointer font-medium transition-colors', 'px-3 py-1.5 text-xs', 'dark:bg-polar-700 bg-white text-black shadow-lg dark:text-white'],
        seal: { classes: ['seal-segmented-item'], ancestors: [{ classes: ['seal-segmented'], attrs: { 'data-size': 'md', 'data-variant': 'default' } }] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'aria-pressed': 'true' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'aria-pressed': 'true' } }),
        ],
      },
      {
        part: 'Item (tabs/md, активный)',
        anchors: ['cursor-pointer font-medium transition-colors', 'px-3 py-1.5 text-xs', 'grow rounded-full', 'dark:bg-polar-800 bg-white text-black shadow-lg dark:text-white'],
        seal: { classes: ['seal-segmented-item'], ancestors: [{ classes: ['seal-segmented'], attrs: { 'data-size': 'md', 'data-variant': 'tabs' } }] },
        states: [
          S('light', { theme: 'light', sealAttrs: { 'aria-pressed': 'true' } }),
          S('dark', { theme: 'dark', sealAttrs: { 'aria-pressed': 'true' } }),
        ],
      },
    ],
  },
  {
    component: 'List',
    orbitFile: 'components/List.tsx',
    parts: [
      {
        part: 'List (панель, default)',
        anchors: ['dark:divide-polar-700 dark:border-polar-700 flex flex-col divide-y divide-gray-200 overflow-hidden border border-gray-200', 'rounded-4xl'],
        seal: { classes: ['seal-list'], attrs: { 'data-size': 'default' } },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    component: 'ListGroup',
    orbitFile: 'components/ListGroup.tsx',
    parts: [
      {
        part: 'Root',
        anchors: ['dark:ring-polar-700 w-full overflow-hidden rounded-2xl bg-transparent ring-1 ring-gray-200 dark:ring-1'],
        seal: { classes: ['seal-list-group'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Item',
        anchors: ['dark:border-polar-700 border-t border-gray-200 p-5 first:border-t-0'],
        seal: { classes: ['seal-list-group-item'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    component: 'Spinner',
    orbitFile: 'components/Spinner.tsx',
    parts: [
      {
        part: 'Spinner (md 20px)',
        anchors: ['mr-3 -ml-1 h-5 w-5 animate-spin'],
        seal: { classes: ['seal-spinner'], attrs: { 'data-size': 'md' } },
        accepted: {
          'margin-right': 'orbit Spinner несёт mr-3 -ml-1 (legacy); seal без встроенных отступов — как SpinnerNoMargin',
          'margin-left': 'orbit Spinner несёт mr-3 -ml-1 (legacy); seal без встроенных отступов — как SpinnerNoMargin',
        },
        states: [S('light', { theme: 'light' })],
      },
    ],
  },
  {
    component: 'Table',
    orbitFile: 'components/ui/table.tsx',
    parts: [
      {
        part: 'Обёртка (overflow)',
        anchors: ['relative w-full overflow-auto'],
        seal: { classes: ['seal-table-wrap'] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'table',
        anchors: ['w-full caption-bottom text-sm'],
        seal: { classes: ['seal-table'] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'row (tr)',
        anchors: ['hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors'],
        seal: { classes: ['seal-table-row'] },
        states: [
          S('light', { theme: 'light' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('light:selected', { theme: 'light', orbitAttrs: { 'data-state': 'selected' }, sealAttrs: { 'data-selected': '' } }),
          S('dark', { theme: 'dark' }),
        ],
      },
      {
        part: 'head (th)',
        anchors: ['text-muted-foreground h-12 px-4 text-left align-middle font-medium'],
        seal: { classes: ['seal-table-head'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'cell (td)',
        anchors: ['p-4 align-middle'],
        seal: { classes: ['seal-table-cell'] },
        states: [S('light', { theme: 'light' })],
      },
    ],
  },
  {
    component: 'DataTable',
    orbitFile: 'components/datatable/DataTable.tsx',
    parts: [
      {
        part: 'root',
        anchors: ['flex flex-col gap-6'],
        seal: { classes: ['seal-datatable'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'wrapper',
        anchors: ['dark:border-polar-700 overflow-hidden rounded-2xl border border-gray-200'],
        seal: { classes: ['seal-datatable-wrap'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'header row',
        anchors: [
          { file: 'components/ui/table.tsx', anchor: 'hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors' },
          'dark:bg-polar-800 group/row bg-gray-50',
        ],
        seal: { classes: ['seal-table-row'], ancestors: [{ classes: ['seal-datatable'] }, { classes: ['seal-table-header'] }] },
        states: [
          S('light', { theme: 'light' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('dark', { theme: 'dark' }),
          S('dark:hover', { theme: 'dark', pseudo: 'hover' }),
        ],
      },
      {
        part: 'status cell',
        anchors: [
          { file: 'components/ui/table.tsx', anchor: 'p-4 align-middle' },
          'h-24 text-center',
        ],
        seal: { classes: ['seal-table-cell'], ancestors: [{ classes: ['seal-datatable'], attrs: { 'data-status': '' } }, { classes: ['seal-table-body'] }] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'selection head',
        anchors: [{ file: 'components/datatable/DataTableSelectionColumn.tsx', anchor: 'flex h-12 cursor-pointer items-center pl-4' }],
        seal: { classes: ['seal-datatable-check', 'seal-datatable-check-head'] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'selection cell',
        anchors: [{ file: 'components/datatable/DataTableSelectionColumn.tsx', anchor: 'flex cursor-pointer items-center py-4 pl-4' }],
        seal: { classes: ['seal-datatable-check'] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'sort button',
        anchors: [
          { file: 'components/Button.tsx', anchor: 'relative inline-flex items-center cursor-pointer font-display' },
          { file: 'components/Button.tsx', anchor: 'bg-transparent hover:bg-gray-200 dark:hover:bg-polar-700 dark:bg-transparent text-black dark:text-white' },
          { file: 'components/Button.tsx', anchor: 'h-10 px-5 py-3 text-sm' },
          { file: 'components/datatable/DataTableColumnHeader.tsx', anchor: 'p-0 hover:bg-transparent dark:hover:bg-transparent' },
        ],
        seal: { classes: ['seal-button'], attrs: { 'data-variant': 'ghost', 'data-size': 'md' }, ancestors: [{ classes: ['seal-datatable-sort'] }] },
        states: [
          S('light', { theme: 'light' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('dark', { theme: 'dark' }),
          S('dark:hover', { theme: 'dark', pseudo: 'hover' }),
        ],
      },
      {
        part: 'pagination root',
        anchors: [{ file: 'components/datatable/DataTablePagination.tsx', anchor: 'flex flex-wrap items-center gap-x-6 gap-y-2 sm:flex-nowrap sm:justify-end sm:px-2 lg:gap-x-8' }],
        seal: { classes: ['seal-datatable-pagination'] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'rows-per-page label',
        anchors: [{ file: 'components/datatable/DataTablePagination.tsx', anchor: 'dark:text-polar-500 text-sm text-gray-700' }],
        seal: { classes: ['seal-datatable-pagination-text'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'count',
        anchors: [{ file: 'components/datatable/DataTablePagination.tsx', anchor: 'dark:text-polar-500 flex flex-1 items-center justify-start text-sm text-gray-700 sm:w-[160px] sm:flex-none sm:justify-center' }],
        seal: { classes: ['seal-datatable-pagination-text', 'seal-datatable-count'] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  },
  {
    // orbit/Select — донор на Radix (components/Select.tsx поверх ui/select.tsx).
    // Стили переносимы класс в класс; поведение (порталы/позиционер) — Base UI.
    component: 'Select',
    orbitFile: 'components/Select.tsx',
    parts: [
      {
        part: 'Trigger',
        anchors: [
          { file: 'components/ui/select.tsx', anchor: 'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 md:text-sm' },
          'dark:bg-polar-800 dark:hover:bg-polar-700 dark:hover:border-polar-700 dark:border-polar-700 flex cursor-pointer flex-row gap-x-2 rounded-xl border border-gray-200 bg-white px-3 shadow-xs transition-colors hover:border-gray-300 dark:text-white text-black',
        ],
        seal: { classes: ['seal-input', 'seal-select-trigger'] },
        accepted: {
          // [data-popup-open]:not(:hover) — фон открытого триггера; orbit open-state не стилизует.
          'background-color': 'seal: открытый триггер остаётся карточкой; orbit open-state не стилизует',
        },
        states: [
          S('light', { theme: 'light' }),
          S('dark', { theme: 'dark' }),
          S('light:hover', { theme: 'light', pseudo: 'hover' }),
          S('dark:hover', { theme: 'dark', pseudo: 'hover' }),
          S('light:focus', { theme: 'light', pseudo: 'focus' }),
          S('dark:focus', { theme: 'dark', pseudo: 'focus' }),
          S('light:disabled', { theme: 'light', pseudo: 'disabled' }),
        ],
      },
      {
        part: 'Popup (Content)',
        anchors: [
          { file: 'components/ui/select.tsx', anchor: 'bg-popover text-popover-foreground data-[state=open]:animate-in' },
          'dark:bg-polar-800 rounded-xl border-none',
        ],
        seal: { classes: ['seal-popup', 'seal-popup--pickers'] },
        accepted: {
          // Base UI ограничивает панель available-height; orbit — жёсткий max-h-96.
          'max-height': 'Base UI available-height cap поверх orbit max-h-96',
        },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'Viewport/List',
        anchors: [
          { file: 'components/ui/select.tsx', anchor: 'p-1' },
        ],
        seal: { classes: ['seal-popup-list'], ancestors: [{ classes: ['seal-popup'], attrs: {} }] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'Item',
        anchors: [
          { file: 'components/ui/select.tsx', anchor: 'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center' },
          'cursor-pointer rounded-lg',
        ],
        seal: { classes: ['seal-popup-item', 'seal-popup-item--indicator-start'] },
        states: [
          S('light', { theme: 'light' }),
          S('light:highlighted', { theme: 'light', pseudo: 'focus', sealAttrs: { 'data-highlighted': '' } }),
          S('dark:highlighted', { theme: 'dark', pseudo: 'focus', sealAttrs: { 'data-highlighted': '' } }),
        ],
      },
      {
        part: 'ItemIndicator',
        anchors: [{ file: 'components/ui/select.tsx', anchor: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center' }],
        seal: {
          classes: ['seal-popup-item-indicator', 'seal-popup-item-indicator--start'],
          ancestors: [{ classes: ['seal-popup-item--indicator-start'] }],
        },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'GroupLabel',
        anchors: [{ file: 'components/ui/select.tsx', anchor: 'py-1.5 pr-2 pl-8 text-sm font-semibold' }],
        seal: { classes: ['seal-popup-group-label'], ancestors: [{ classes: ['seal-popup'], attrs: {} }] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'Separator',
        anchors: [{ file: 'components/ui/select.tsx', anchor: 'bg-muted -mx-1 my-1 h-px' }],
        seal: { classes: ['seal-popup-separator'], ancestors: [{ classes: ['seal-popup'], attrs: {} }] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
      {
        part: 'ScrollArrow',
        anchors: [{ file: 'components/ui/select.tsx', anchor: 'flex cursor-default items-center justify-center py-1' }],
        seal: { classes: ['seal-popup-scroll-arrow'], ancestors: [{ classes: ['seal-popup'], attrs: {} }] },
        states: [S('light', { theme: 'light' })],
      },
      {
        part: 'Icon (chevron)',
        anchors: [{ file: 'components/ui/select.tsx', anchor: 'h-4 w-4 opacity-50' }],
        seal: { classes: [], tag: 'svg', ancestors: [{ classes: ['seal-select-icon'] }] },
        states: [S('light', { theme: 'light' }), S('dark', { theme: 'dark' })],
      },
    ],
  }
];

// ─── Извлечение строковых литералов из orbit-файла ─────────────────────────

function extractLiteral(source, anchor) {
  // Ищем строковый литерал (одинарные/двойные кавычки или backtick),
  // содержащий anchor. Сначала — точное совпадение (якорь 'p-1' не должен
  // поймать триггер из-за 'line-clamp-1').
  const re = /'([^']*)'|"([^"]*)"|`([^`]*)`/g;
  let first = null;
  let m;
  while ((m = re.exec(source))) {
    const literal = m[1] ?? m[2] ?? m[3];
    if (literal === anchor) return literal;
    if (!first && literal.includes(anchor)) first = literal;
  }
  return first;
}

// ─── Основной прогон ────────────────────────────────────────────────────────

function main() {
  const cssRaw = fs.readFileSync(TOKENS_CSS, 'utf8');
  const parsed = parseTokensCss(cssRaw);
  const resolvers = {
    light: makeVarResolver(parsed.tokenBlocks, 'light'),
    dark: makeVarResolver(parsed.tokenBlocks, 'dark'),
  };
  const resolvedTokens = {};
  for (const theme of ['light', 'dark']) {
    resolvedTokens[theme] = {};
    const base = { ...parsed.tokenBlocks.light, ...(theme === 'dark' ? parsed.tokenBlocks.dark : {}) };
    for (const name of Object.keys(base)) resolvedTokens[theme][name] = resolvers[theme](base[name]);
  }

  const themes = OPT.theme === 'both' ? ['light', 'dark'] : [OPT.theme];
  const report = [];
  const unmappedGlobal = new Set();
  let totals = { ok: 0, diff: 0, soft: 0, missing: 0 };

  for (const comp of COMPONENTS) {
    if (OPT.components && !OPT.components.includes(comp.component)) continue;
    const orbitSrc = fs.readFileSync(path.join(ORBIT_DIR, comp.orbitFile), 'utf8');
    const compReport = { component: comp.component, parts: [] };

    for (const part of comp.parts) {
      const literals = [];
      for (const anchorDef of part.anchors) {
        // Якорь — строка (файл компонента) или {file, anchor} (напр. ui/-донор + переопределение).
        const anchorFile = typeof anchorDef === 'object' ? anchorDef.file : null;
        const anchor = typeof anchorDef === 'object' ? anchorDef.anchor : anchorDef;
        const src2 = anchorFile ? fs.readFileSync(path.join(ORBIT_DIR, anchorFile), 'utf8') : orbitSrc;
        const literal = extractLiteral(src2, anchor);
        if (!literal) {
          compReport.parts.push({ part: part.part, error: `Не найден orbit-литерал по якорю: ${anchor}` });
          continue;
        }
        literals.push(literal);
      }
      const orbitClassStr = literals.join(' ');

      const partReport = { part: part.part, orbitClasses: orbitClassStr, states: [] };

      for (const state of part.states) {
        if (state.theme && !themes.includes(state.theme)) continue;
        const theme = state.theme || 'light';
        const bucket = {
          theme,
          attrs: { ...(state.orbitAttrs || {}) },
          pseudo: state.pseudo || null,
        };
        const unmapped = new Set();
        const orbitDecls = normalizeBorderDecls(tailwindToDecls(orbitClassStr, bucket, unmapped));
        for (const u of unmapped) unmappedGlobal.add(u);

        const desc = {
          classes: [...part.seal.classes],
          attrs: { ...(part.seal.attrs || {}), ...(state.sealAttrs || {}) },
          pseudos: state.pseudo ? [state.pseudo] : [],
          tag: part.seal.tag || null,
          ancestors: part.seal.ancestors
            ? part.seal.ancestors.map((a) => ({
                classes: [...a.classes],
                attrs: { ...(a.attrs || {}), ...(state.sealAncestorAttrs || {}) },
                pseudos: [],
              }))
            : [],
          contains: part.seal.contains || [],
        };
        const sealRaw = computeSealDecls(desc, parsed, theme);
        const sealDecls = canonSealDecls(sealRaw, resolvers[theme]);

        const rows = [];
        for (const [prop, want] of Object.entries(orbitDecls)) {
          if (prop.startsWith('@ring-') || prop === '@divide-y' || prop === '@divide-color') continue;
          if (part.skip && part.skip.includes(prop)) continue;
          const soft = SOFT_PROPS.has(prop);
          const got = sealDecls[prop];
          // Тени: сравниваем по ступени Polar-токена, а не по TW-литералу.
          if (prop === 'box-shadow' && String(want).startsWith('@shadow-')) {
            const tier = String(want).slice('@shadow-'.length);
            if (got) {
              const sealTier = shadowTier(got, resolvedTokens[theme]);
              if (sealTier === tier) { rows.push({ prop, want: `shadow-${tier}`, got: `--seal-shadow-${sealTier}`, status: 'ok' }); totals.ok += 1; continue; }
              rows.push({ prop, want: `shadow-${tier}`, got, status: 'soft', note: `seal: ступень ${sealTier || '—'}` });
              totals.soft += 1; continue;
            }
            rows.push({ prop, want: `shadow-${tier}`, got: '—', status: 'missing' });
            totals.missing += 1; continue;
          }
          if (got === undefined) {
            // Осознанное отклонение (seal сознательно не задаёт свойство).
            if (part.accepted && part.accepted[prop]) {
              rows.push({ prop, want: showValue(want), got: '—', status: 'accepted', note: part.accepted[prop] });
              continue;
            }
            // Значение == CSS-initial и seal его не задаёт → поведение то же.
            if (INITIAL_VALUES[prop] !== undefined && normalizeValue(prop, showValue(want)) === INITIAL_VALUES[prop]) {
              rows.push({ prop, want: showValue(want), got: '(initial)', status: 'ok' });
              totals.ok += 1;
              continue;
            }
            rows.push({ prop, want: showValue(want), got: '—', status: soft ? 'soft-missing' : 'missing' });
            if (soft) totals.soft += 1; else totals.missing += 1;
            continue;
          }
          // Осознанное отклонение из конфига части — только если значения различаются.
          if (part.accepted && part.accepted[prop] && !valuesEqual(prop, want, got)) {
            rows.push({ prop, want: showValue(want), got: showSeal(prop, got, sealRaw), status: 'accepted', note: part.accepted[prop] });
            continue;
          }
          if (valuesEqual(prop, want, got)) {
            rows.push({ prop, want: showValue(want), got: showSeal(prop, got, sealRaw), status: 'ok' });
            totals.ok += 1;
          } else {
            rows.push({ prop, want: showValue(want), got: showSeal(prop, got, sealRaw), status: soft ? 'soft' : 'diff' });
            if (soft) totals.soft += 1; else totals.diff += 1;
          }
        }
        partReport.states.push({
          name: state.name,
          theme,
          rows,
          sealOnly: Object.keys(sealDecls).filter((p) => orbitDecls[p] === undefined && !p.startsWith('@')),
        });
      }
      compReport.parts.push(partReport);
    }
    report.push(compReport);
  }

  if (OPT.json) {
    console.log(JSON.stringify({ viewport: OPT.viewport, totals, unmapped: [...unmappedGlobal], report }, null, 2));
  } else {
    printReport(report, totals, unmappedGlobal);
  }

  if (OPT.failOnDiff && (totals.diff > 0 || totals.missing > 0)) process.exitCode = 1;
}

function showValue(v) {
  if (v && typeof v === 'object' && v.alpha) return `${v.alpha.color} / ${Math.round(v.alpha.value * 100)}%`;
  return String(v);
}

function showSeal(prop, normalized, sealRaw) {
  const raw = sealRaw.get(prop);
  const orig = raw ? raw.value : normalized;
  if (orig !== normalized && orig.includes('var(')) return `${normalized}  ⟵ ${orig}`;
  return normalized;
}

function valuesEqual(prop, want, got) {
  const a = normalizeValue(prop, showValue(want));
  const b = normalizeValue(prop, got);
  if (a === b) return true;
  // font-family: orbit задаёт роль (@display/@sans/@mono) — сверяем семейство.
  if (prop === 'font-family' && a.startsWith('@')) {
    const role = a.slice(1);
    const expect = role === 'mono' ? 'geistmono' : 'pp neue montreal';
    return b.includes(expect);
  }
  // transition-property: у seal список может быть уже/шире — достаточно
  // пересечения (анимируется то же свойство).
  if (prop === 'transition-property') {
    const la = a.split(',').map((s) => s.trim());
    const lb = b.split(',').map((s) => s.trim());
    return la.some((x) => lb.includes(x));
  }
  // Альфа-цвета: color-mix в seal против «color / NN%» в orbit — допускаем
  // совпадение базового цвета и альфы.
  const alphaA = parseAlpha(a);
  const alphaB = parseAlpha(b);
  if (alphaA && alphaB) {
    return alphaA.color === alphaB.color && Math.abs(alphaA.value - alphaB.value) < 0.02;
  }
  // flex: «1 1 0%» vs «1»
  if (prop === 'flex') {
    const norm = (s) => s.replace(/\s+/g, ' ').trim();
    if (norm(a) === '1 1 0%' && norm(b) === '1') return true;
    if (norm(a) === '1' && norm(b) === '1 1 0%') return true;
  }
  // line-height: безразмерный vs px
  if (prop === 'line-height') {
    const pxA = a.endsWith('px') ? parseFloat(a) : null;
    const numA = pxA === null ? parseFloat(a) : null;
    const pxB = b.endsWith('px') ? parseFloat(b) : null;
    const numB = pxB === null ? parseFloat(b) : null;
    if (pxA !== null && numB !== null && FONT_SIZE_LH.has(numB)) return false; // разные формы — сравним ниже по font-size
    if (numA !== null && pxB !== null) return false;
  }
  // border-width: «1px» vs «thin/medium»
  if (prop === 'border-style' && (b === 'solid' || b === 'none')) return a === b;
  // ring: допускаем, что seal собрал то же кольцо своим порядком слоёв;
  // цвет слоя сравниваем и в разных формах альфы (alpha() против color-mix()).
  if (prop === '@ring' || prop === 'box-shadow') {
    const stripGeo = (l) => l.replace(/^0 0 0 [\d.]+px\s+/, '');
    const layerEq = (l, m) => {
      if (l === m) return true;
      const ca = stripGeo(l);
      const cb = stripGeo(m);
      if (ca === cb) return true;
      const pa = parseAlpha(ca);
      const pb = parseAlpha(cb);
      return !!pa && !!pb && pa.color === pb.color && Math.abs(pa.value - pb.value) < 0.02;
    };
    const layersA = splitTopLevel(a, ',').sort();
    const layersB = splitTopLevel(b, ',').sort();
    if (layersA.length === layersB.length && layersA.every((l, i2) => layerEq(l, layersB[i2]))) return true;
  }
  // transition-duration: «150ms» vs «0.15s»; seal хранит список (по одному
  // на свойство шортхенда) — достаточно совпадения любой длительности.
  if (prop === 'transition-duration' || prop === 'transition') {
    const toMs = (s) => s.replace(/([\d.]+)s\b/g, (_, n2) => `${round(parseFloat(n2) * 1000)}ms`).replace(/\s+/g, '');
    const setA = new Set(toMs(a).split(','));
    const setB = toMs(b).split(',');
    if (setB.some((d) => setA.has(d))) return true;
  }
  return false;
}

const FONT_SIZE_LH = new Set();

function parseAlpha(v) {
  const m = v.match(/^alpha\((.+),\s*([\d.]+)\)$/);
  if (m) return { color: m[1], value: parseFloat(m[2]) };
  const cm = v.match(/^color-mix\(in (\w+), (.+) ([\d.]+)%, transparent\)$/);
  if (cm) return { color: cm[2], value: parseFloat(cm[3]) / 100 };
  return null;
}

// ─── Печать отчёта ──────────────────────────────────────────────────────────

const ICON = { ok: '✓', diff: '✗', soft: '~', missing: '✗', 'soft-missing': '~', accepted: '⊘' };

function printReport(report, totals, unmapped) {
  console.log(`\n  sealui ⇄ polar-orbit CSS comparison  (viewport: ${OPT.viewport}, themes: ${OPT.theme})\n`);
  for (const comp of report) {
    console.log(`══ ${comp.component} ${'═'.repeat(Math.max(0, 60 - comp.component.length))}`);
    for (const part of comp.parts) {
      if (part.error) { console.log(`  ⚠ ${part.part}: ${part.error}`); continue; }
      console.log(`  ── ${part.part}`);
      if (OPT.verbose) console.log(`     orbit: ${part.orbitClasses}`);
      for (const state of part.states) {
        const bad = state.rows.filter((r) => r.status !== 'ok' && r.status !== 'accepted');
        const okCount = state.rows.filter((r) => r.status === 'ok').length;
        const accCount = state.rows.filter((r) => r.status === 'accepted').length;
        console.log(`     [${state.name}]  ✓ ${okCount}${accCount ? ` · ⊘ ${accCount}` : ''} · ✗ ${bad.filter((r) => r.status === 'diff' || r.status === 'missing').length} · ~ ${bad.filter((r) => r.status === 'soft' || r.status === 'soft-missing').length}`);
        for (const row of bad) {
          const note = row.note ? `   (${row.note})` : '';
          console.log(`       ${ICON[row.status]} ${row.prop.padEnd(22)} orbit: ${String(row.want).padEnd(38)} seal: ${row.got}${note}`);
        }
        if (OPT.verbose && state.sealOnly.length) {
          console.log(`       + только в seal: ${state.sealOnly.join(', ')}`);
        }
      }
    }
    console.log('');
  }
  console.log('── Итог ────────────────────────────────────────────────');
  console.log(`  ✓ совпало: ${totals.ok}   ✗ расхождений: ${totals.diff}   ✗ отсутствует: ${totals.missing}   ~ мягких: ${totals.soft}`);
  if (unmapped.size) {
    console.log(`  ⚠ Нераспознанные Tailwind-классы (${unmapped.size}) — дополните маппинг:`);
    console.log(`    ${[...unmapped].sort().join('  ')}`);
  }
  console.log('');
}

main();
