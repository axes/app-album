"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ShareState } from "@/lib/collection/service";
import { disableSharingAction, enableSharingAction } from "../actions";

function SubmitButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * Compact sharing panel for the collection header. The link is rendered as a
 * relative path so the server never needs to know the public origin; the copy
 * button resolves it against `window.location.origin` and the readonly input
 * remains as a manual fallback when the Clipboard API is unavailable.
 */
export function ShareControls({ userAlbumId, sharing }: { userAlbumId: string; sharing: ShareState }) {
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const path = sharing.token ? `/share/${sharing.token}` : null;

  async function copy() {
    if (!path) return;
    const absolute = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; select the readonly input so the user
      // can copy manually instead of losing the link.
      input.current?.select();
      setCopied(false);
    }
  }

  return (
    <section aria-label="Compartir colección" className="rounded border border-border bg-surface-muted p-3">
      <h2 className="text-sm font-semibold">Compartir colección</h2>
      {sharing.enabled && path ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs text-muted">Cualquier persona con este enlace puede ver tu progreso, faltantes y repetidas.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Enlace público"
              className="min-w-0 flex-1 rounded border border-input-border bg-input px-2 py-1 text-sm text-content"
              readOnly
              ref={input}
              value={path}
            />
            <button
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-content hover:bg-surface-muted"
              onClick={copy}
              type="button"
            >
              {copied ? "Copiado" : "Copiar enlace"}
            </button>
            <form action={disableSharingAction}>
              <input name="userAlbumId" type="hidden" value={userAlbumId} />
              <SubmitButton
                className="rounded border border-danger px-3 py-2 text-sm text-danger disabled:cursor-not-allowed"
                label="Desactivar enlace"
                pendingLabel="Desactivando…"
              />
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted">Comparte tu colección con un enlace público.</p>
          <form action={enableSharingAction}>
            <input name="userAlbumId" type="hidden" value={userAlbumId} />
            <SubmitButton
              className="rounded bg-primary px-3 py-2 text-sm text-primary-text disabled:opacity-50"
              label="Activar enlace público"
              pendingLabel="Activando…"
            />
          </form>
        </div>
      )}
    </section>
  );
}
