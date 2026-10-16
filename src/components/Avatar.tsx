import type { ReactNode } from 'react';
import { Avatar as BaseAvatar } from '@base-ui/react';

type Sealed<Props> = Omit<Props, 'className' | 'style' | 'render'>;
type WithRef<Props, Element> = Sealed<Props> & { ref?: React.Ref<Element> };

export type AvatarSize = 'sm' | 'md' | 'lg';

/** Polar Orbit API: `name` seeds the initials and doubles as image alt text;
 * `src` replaces `avatar_url`. Base UI behavior (image/fallback swaps) is kept intact. */
export type AvatarRootProps = WithRef<BaseAvatar.Root.Props, HTMLSpanElement>;
export type AvatarImageProps = WithRef<BaseAvatar.Image.Props, HTMLImageElement>;
export type AvatarFallbackProps = WithRef<BaseAvatar.Fallback.Props, HTMLSpanElement>;
export type AvatarImageLoadingStatus = BaseAvatar.Root.State['imageLoadingStatus'];

export type AvatarProps = {
  /** Полное имя или e-mail: из него считаются инициалы и заполняется alt. */
  name: string;
  /** URL картинки (аналог avatar_url в Polar). */
  src?: string | null;
  /** Явные инициалы или иконка; по умолчанию считается из name. */
  fallback?: ReactNode;
  size?: AvatarSize;
  /** Нативная подсказка браузеру о загрузке картинки (Polar Avatar.loading, дефолт eager). */
  loading?: 'eager' | 'lazy';
};

/** Polar-style initials: first and last word character, e-mail local part supported.
 * Unicode-aware (letters of any script incl. Cyrillic); digits and symbols ignored. */
export function getInitials(fullName: string): string {
  const words = fullName
    .split('@')[0]
    .replace(/[^\p{L}' -]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0].charAt(0).toUpperCase();
  const last = words.length > 1 ? words[words.length - 1].charAt(0).toUpperCase() : '';
  return `${first}${last}`;
}

const SIZE_ALTS: Record<AvatarSize, Record<string, string | number>> = {
  sm: { height: 24, width: 24 },
  md: { height: 32, width: 32 },
  lg: { height: 48, width: 48 },
};

export function Avatar({ name, src, fallback, size = 'md', loading = 'eager', ...props }: AvatarProps) {
  return (
    <BaseAvatar.Root {...props} className="seal-avatar" data-size={size}>
      <BaseAvatar.Fallback className="seal-avatar-fallback">{fallback ?? getInitials(name)}</BaseAvatar.Fallback>
      {src ? (
        <BaseAvatar.Image
          src={src}
          alt={name}
          loading={loading}
          // Base UI: без keepMounted картинка рендерится только после загрузки,
          // из-за чего `loading="lazy"` никогда не срабатывает. Polar держит img
          // в DOM и прячет его до загрузки — стекинг описан в доке Avatar.
          keepMounted
          className="seal-avatar-image"
          {...SIZE_ALTS[size]}
        />
      ) : null}
    </BaseAvatar.Root>
  );
}
