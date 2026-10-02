// Descriptions arrive as HTML from the dashboard's editor, sanitised by the
// API on save. Older ones are plain text, which is still valid here.
export function isRichText(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

// The words alone, for clamped previews on cards where headings and lists
// would only get in the way.
export function plainText(value: string): string {
  if (!isRichText(value)) return value;
  const doc = new DOMParser().parseFromString(value, 'text/html');
  // Block ends become spaces, or "Views</h2><p>Big" would read "ViewsBig".
  doc.body.querySelectorAll('p, h2, h3, li, blockquote, br').forEach((el) => el.after(' '));
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}
