import type { SVGProps } from 'react';

/**
 * Inline icon set — no icon package, no network request, and every glyph
 * inherits currentColor so themes just work.
 */
const PATHS = {
  'music-note': 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  chords: 'M4 19V6m5 13V6m5 13V6m5 13V6M2 10h20M2 15h20',
  practice: 'M4 4h16v16H4z M9 9h6v6H9z',
  test: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  history: 'M12 8v4l3 2M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5',
  stats: 'M4 20V10m6 10V4m6 16v-7m-12 7h18',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.1l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.9-1.1L14.6 2h-4l-.4 2.8c-.7.3-1.3.6-1.9 1.1l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.2l-2 1.6 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.8h4l.4-2.8c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.6c.1-.4.1-.7.1-1.1Z',
  about: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14h.01M11 12h1v5h1',
  'sound-on': 'M11 5 6 9H2v6h4l5 4V5Zm4.5 3a5 5 0 0 1 0 8m3-11a9 9 0 0 1 0 14',
  'sound-off': 'M11 5 6 9H2v6h4l5 4V5Zm5 4 5 6m0-6-5 6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 18v-2M4.2 4.2l1.5 1.5m12.6 12.6 1.5 1.5M3 12h2m14 0h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  play: 'M6 4l14 8-14 8V4Z',
  pause: 'M9 4v16M15 4v16',
  stop: 'M6 6h12v12H6z',
  reset: 'M3 12a9 9 0 1 1 3 6.7M3 21v-5h5',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  check: 'M4 12.5 9.5 18 20 6.5',
  x: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.5l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.8l6-.9L12 3.5Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2',
  crown: 'M3 7l4.5 4L12 4l4.5 7L21 7l-1.8 11H4.8L3 7Z',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  keyboard: 'M3 6h18v12H3z M7 6v7M11 6v7M15 6v7M19 6v7',
  layers: 'M12 3 2 8l10 5 10-5-10-5ZM2 13l10 5 10-5M2 18l10 5 10-5',
  lock: 'M6 11h12v10H6V11ZM9 11V7a3 3 0 0 1 6 0v4',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  'sidebar-collapse': 'M4 4h16v16H4zM10 4v16M15 9l-2 3 2 3',
  'sidebar-expand': 'M4 4h16v16H4zM10 4v16M13 9l2 3-2 3',
  menu: 'M4 7h16M4 12h16M4 17h16',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName | string;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const path = PATHS[name as IconName] ?? PATHS.about;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}
