// The calm counterpart of FormError: confirms something happened. Brass
// rather than green so it stays inside the palette — the page has no other
// green and one would read as foreign.
export function FormNotice({ children }: { children: string }) {
  return (
    <p
      className="mb-[18px] rounded-r-card border-l-[3px] border-brass bg-brass/10 px-3 py-[10px] text-[13.5px] text-brass-ink"
      role="status"
    >
      {children}
    </p>
  );
}
