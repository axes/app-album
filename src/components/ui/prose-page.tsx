import type { ReactNode } from "react";

/**
 * Layout for the long-form public pages (FAQ, terms). It keeps a comfortable
 * reading measure and a consistent rhythm between sections, using only theme
 * tokens.
 */
export function ProsePage({ children }: { children: ReactNode }) {
  return <article className="prose-page flex w-full max-w-3xl flex-col gap-8">{children}</article>;
}

export function ProseSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3" aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="text-xl font-semibold text-content">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-content">{children}</div>
    </section>
  );
}
