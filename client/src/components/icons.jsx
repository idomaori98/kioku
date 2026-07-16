const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function HeartIcon({ filled = false, size = 18 }) {
  return (
    <svg {...base} fill={filled ? 'currentColor' : 'none'} width={size} height={size}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

export function PinIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function CompassIcon({ size = 32 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

export function SearchIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 18 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 14 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function UsersIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function MessageCircleIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  )
}

export function BookmarkIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  )
}

export function BellIcon({ size = 20 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export function PlusIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

export function LockIcon({ size = 12 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function LogOutIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

export function ShareIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" x2="15.4" y1="10.5" y2="6.5" />
      <line x1="8.6" x2="15.4" y1="13.5" y2="17.5" />
    </svg>
  )
}

export function ClipboardIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  )
}

export function FlagIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  )
}

export function BanIcon({ size = 16 }) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

export function AlertIcon({ size = 36 }) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  )
}
