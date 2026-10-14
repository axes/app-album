"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ShareState } from "@/lib/collection/service";
import { InlineMessage } from "@/components/ui/inline-message";
import { disableSharingAction, enableSharingAction } from "../actions";

/**
 * How long the "Enlace copiado" confirmation stays on screen. Writing to the
 * clipboard produces no visible result of its own, so the panel confirms it
 * explicitly and then returns to its resting state.
 */
const COPY_FEEDBACK_MS = 2500;

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
 *
 * The copy trigger keeps a stable label so the target never moves or resizes;
 * the outcome is announced through an `InlineMessage` (`role="status"`, which
 * implies `aria-live="polite"`) that auto-hides after `COPY_FEEDBACK_MS`.
 */
export function ShareControls({ userAlbumId, sharing }: { userAlbumId: string; sharing: ShareState }) {
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const path = sharing.token ? `/share/${sharing.token}` : null;

  // Auto-hide the confirmation. The cleanup clears the pending timer on
  // unmount and whenever the window restarts, so no stale timeout can flip
  // the state after the panel is gone.
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [copied]);

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
    <section aria-label="Compartir colección" className="border-t border-border pt-4">
      <h2 className="text-sm font-semibold">Compartir colección</h2>
      {sharing.enabled && path ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-xs text-muted">Cualquier persona con este enlace puede ver tu progreso, faltantes y repetidas.</p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Enlace público"
              className="min-h-11 min-w-0 flex-1 rounded-control border border-input-border bg-input px-3 py-2 text-sm text-content focus-visible:outline focus-visible:outline-2"
              readOnly
              ref={input}
              value={path}
            />
            <button
              className="min-h-11 rounded-control border border-border bg-surface px-3 py-2 text-sm text-content hover:bg-surface-muted focus-visible:outline focus-visible:outline-2"
              onClick={copy}
              type="button"
            >
              Copiar enlace
            </button>
            <form action={disableSharingAction}>
              <input name="userAlbumId" type="hidden" value={userAlbumId} />
              <SubmitButton
                className="min-h-11 rounded-control border border-danger px-3 py-2 text-sm text-danger focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:text-muted"
                label="Desactivar enlace"
                pendingLabel="Desactivando…"
              />
            </form>
          </div>
          {copied ? (
            <InlineMessage variant="success">Enlace copiado</InlineMessage>
          ) : null}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted">Comparte tu colección con un enlace público.</p>
          <form action={enableSharingAction}>
            <input name="userAlbumId" type="hidden" value={userAlbumId} />
            <SubmitButton
              className="min-h-11 rounded-control bg-primary px-3 py-2 text-sm text-primary-text focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-muted"
              label="Activar enlace público"
              pendingLabel="Activando…"
            />
          </form>
        </div>
      )}
    </section>
  );
}
