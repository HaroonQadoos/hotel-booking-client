// Directive, not apologetic: says what went wrong and what to do. Rendered
// with role="alert" so screen readers announce it the moment it appears.
export function FormError({ children }: { children: string }) {
  return (
    <p
      className="mb-[18px] rounded-r-card border-l-[3px] border-rust bg-rust/10 px-3 py-[10px] text-[13.5px] text-rust-ink"
      role="alert"
    >
      {children}
    </p>
  );
}
