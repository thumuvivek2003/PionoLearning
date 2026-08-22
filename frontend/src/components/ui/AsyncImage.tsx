import { useCallback, useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import styles from './ui.module.css';

type LoadState = 'loading' | 'ready' | 'failed';

interface AsyncImageProps {
  src: string;
  alt: string;
  /** Reserves the exact space up front, so nothing jumps when the file lands. */
  aspectRatio?: number;
  /** Candidate sources for responsive loading, e.g. "thumb.webp 800w, full.webp 1536w". */
  srcSet?: string;
  sizes?: string;
  /** Skip lazy loading for an image that is above the fold. */
  eager?: boolean;
  className?: string;
}

/**
 * An image that shows a placeholder until it has actually decoded.
 *
 * Three things make it worth a component rather than a bare <img>:
 * the box is sized from the aspect ratio before the bytes arrive, so the page
 * never reflows; a failure degrades to a readable panel instead of a broken
 * glyph; and cached images are caught via `complete` on the ref, because their
 * load event can fire before React attaches the handler.
 */
export function AsyncImage({
  src,
  alt,
  aspectRatio = 3 / 2,
  srcSet,
  sizes,
  eager = false,
  className,
}: AsyncImageProps) {
  const [state, setState] = useState<LoadState>('loading');

  const attach = useCallback((node: HTMLImageElement | null) => {
    // A cached image can already be done by the time the ref runs.
    if (node?.complete) setState(node.naturalWidth > 0 ? 'ready' : 'failed');
  }, []);

  return (
    <div
      className={cn(styles.media, className)}
      style={{ aspectRatio: `${aspectRatio}` }}
      data-state={state}
    >
      {state === 'loading' && <span className={styles.mediaSkeleton} aria-hidden="true" />}

      {state === 'failed' ? (
        <span className={styles.mediaFailed}>
          <Icon name="layers" size={22} />
          <span>Diagram unavailable</span>
        </span>
      ) : (
        <img
          ref={attach}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          className={cn(styles.mediaImg, state === 'ready' && styles.mediaImgReady)}
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}
