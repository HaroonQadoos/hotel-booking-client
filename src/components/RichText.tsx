import { isRichText } from '../richText';

// A room or venue description at full length. The HTML is trusted because the
// API sanitises it on the way in (src/common/rich-text.ts in the API) down to
// headings, emphasis, lists, quotes and links.
export function RichText({ value, className = '' }: { value: string; className?: string }) {
  if (!isRichText(value)) return <p className={`whitespace-pre-line ${className}`}>{value}</p>;
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: value }} />;
}
