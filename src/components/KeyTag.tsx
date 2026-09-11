export function KeyTag({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={(size * 36) / 48}
      height={size}
      viewBox="0 0 36 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="30" height="42" rx="15" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="13" r="3.2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="25" r="2.8" fill="currentColor" />
      <path d="M18 28v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 33h3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
