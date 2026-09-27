"use client";

import { useActionState } from "react";
import type { CatalogActionState } from "./actions";

type Action = (state: CatalogActionState, data: FormData) => Promise<CatalogActionState>;

export function ActionForm({
  action,
  children,
  className = "",
  confirmText,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {children}
      {state.error ? (
        <p className="text-xs text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
      {pending ? <p className="text-xs text-muted">Procesando…</p> : null}
    </form>
  );
}

/**
 * Collapsible block used to keep the editor compact: creation and edit forms
 * stay hidden until the admin opens them.
 */
export function Collapsible({
  title,
  hint,
  children,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm">
        <span className="font-medium">{title}</span>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </summary>
      <div className="border-t border-border p-3">{children}</div>
    </details>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded border border-border bg-surface" open={defaultOpen || undefined}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          <span className="text-muted transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
        </div>
      </summary>
      <div className="flex flex-col gap-3 border-t border-border p-4">{children}</div>
    </details>
  );
}
