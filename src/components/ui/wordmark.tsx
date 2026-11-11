/**
 * The product wordmark: "MiColección" plus the ".cl" of the official domain.
 *
 * It is plain text set in the display face, independent from the graphic
 * mark (`Logo`), so it can be used on its own wherever the name is needed:
 * footer, legal pages, headings. Colours come from theme tokens, so it follows
 * light and dark mode; the size is inherited from the surrounding text unless
 * `size` is given.
 */
export const WORDMARK_SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
} as const;

export type WordmarkSize = keyof typeof WORDMARK_SIZES;

export type WordmarkProps = {
  size?: WordmarkSize;
  className?: string;
};

export function Wordmark({ size, className }: WordmarkProps) {
  return (
    <span
      data-component="wordmark"
      translate="no"
      className={["wordmark font-semibold text-content", size ? WORDMARK_SIZES[size] : null, className]
        .filter(Boolean)
        .join(" ")}
    >
      MiColección<span className="text-primary">.cl</span>
    </span>
  );
}
