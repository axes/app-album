"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

/**
 * Reusable destructive-action confirmation built on the native `<dialog>`.
 *
 * Why this exists (UI-06D, finding B3):
 *
 *   The admin destructive flows used `window.confirm`, a synchronous,
 *   main-thread-blocking dialog. The project rule is that destructive actions
 *   must use an inline/dialog two-step confirmation instead. This primitive
 *   centralises that pattern so every consumer shares the same semantics:
 *
 *     1. A `type="button"` trigger opens the modal on the same frame. The
 *        Server Action is NOT invoked yet.
 *     2. The confirm button is a `type="submit"` control. It submits the
 *        surrounding `<form>` (or the form referenced by `formId`), so the
 *        existing Server Action and its exact `FormData` payload are reused
 *        untouched. The parent owns the action and passes its `pending` flag.
 *     3. While `pending` is true the dialog stays open, both buttons are
 *        disabled and the optional `pendingLabel` is announced through a live
 *        region, so a second click cannot enqueue a second action.
 *     4. "Cancelar", Escape and a backdrop click close the modal and return
 *        focus to the trigger. Escape and the backdrop are ignored while
 *        pending.
 *
 * The component is deliberately domain-agnostic: it knows nothing about
 * albums, pages or stickers. It only receives copy, a trigger and the pending
 * flag, so it can be reused by every destructive flow without leaking business
 * rules into the UI layer.
 *
 * Touch targets: the trigger and both dialog buttons enforce a 44 px minimum
 * height (`min-h-11`).
 */
export type ConfirmActionProps = {
  /** Accessible dialog title. */
  title: string;
  /** Optional supporting copy shown under the title. */
  description?: ReactNode;
  /** Confirm button label (defaults to "Confirmar"). */
  confirmLabel?: string;
  /** Cancel button label (defaults to "Cancelar"). */
  cancelLabel?: string;
  /** Message shown while the action is in flight. */
  pendingLabel?: string;
  /** Visible content of the trigger button. */
  triggerLabel: ReactNode;
  /**
   * Optional leading icon for the trigger button. Forwarded to `Button`'s
   * `icon` slot so a destructive row action can carry the same glyph as its
   * non-destructive siblings.
   */
  triggerIcon?: ReactNode;
  /**
   * Button variant used by the trigger. Defaults to `ghost` so the trigger
   * stays visually consistent with the rest of the Button family while the
   * destructive emphasis lives on the solid `danger` confirm button.
   */
  triggerVariant?: ButtonVariant;
  /**
   * Button size used by the trigger. Defaults to `md` (44 px). Pass `sm` when
   * the trigger sits in a dense admin row alongside other compact controls.
   */
  triggerSize?: ButtonSize;
  /** Extra classes merged onto the trigger button. */
  triggerClassName?: string;
  /** Accessible name for the trigger when its visible label is not enough. */
  triggerAriaLabel?: string;
  /** Native tooltip for the trigger. */
  triggerTitle?: string;
  /** Test id applied to the trigger button. */
  triggerTestId?: string;
  /** Disables the trigger (e.g. while another action is in flight). */
  disabled?: boolean;
  /** Pending flag owned by the parent's `useActionState`. */
  pending?: boolean;
  /**
   * Id of the `<form>` the confirm button must submit. Use it when the trigger
   * lives inside a different form than the destructive action (bulk delete).
   * When omitted, the confirm button submits its closest ancestor form.
   */
  formId?: string;
  /** Extra classes merged onto the dialog element. */
  className?: string;
};

export function ConfirmAction({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  pendingLabel,
  triggerLabel,
  triggerIcon,
  triggerVariant = "ghost",
  triggerSize = "md",
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
  triggerTestId,
  disabled = false,
  pending = false,
  formId,
  className,
}: ConfirmActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [armed, setArmed] = useState(false);
  const sawPending = useRef(false);
  const submittedRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const busy = pending;

  // Open/close the native <dialog> as a side effect of React state so the
  // first click paints the modal on the same frame (showModal() is sync).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Close the modal once the parent's action has finished. We only close after
  // observing `pending === true` at least once, so a fast render cannot close
  // the dialog before the action has actually started.
  useEffect(() => {
    if (!armed) return;
    if (busy) {
      sawPending.current = true;
      return;
    }
    if (sawPending.current) {
      sawPending.current = false;
      submittedRef.current = false;
      setArmed(false);
      setIsOpen(false);
      queueMicrotask(() => triggerRef.current?.focus());
    }
  }, [armed, busy]);

  function open() {
    if (busy || disabled) return;
    setIsOpen(true);
  }

  function close() {
    if (busy) return;
    submittedRef.current = false;
    setArmed(false);
    setIsOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function onConfirmClick(event: React.MouseEvent<HTMLButtonElement>) {
    // Guard against a second native submit landing before `pending` flips.
    if (busy || submittedRef.current) {
      event.preventDefault();
      return;
    }
    submittedRef.current = true;
    setArmed(true);
  }

  function onCancelNative(event: React.SyntheticEvent<HTMLDialogElement>) {
    // Fired by the browser on Escape or a platform close. Block it while the
    // action is in flight; otherwise mirror React state.
    if (busy) {
      event.preventDefault();
      return;
    }
    if (isOpen) {
      submittedRef.current = false;
      setArmed(false);
      setIsOpen(false);
    }
    triggerRef.current?.focus();
  }

  function onBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (busy) return;
    if (event.target === dialogRef.current) close();
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant={triggerVariant}
        size={triggerSize}
        disabled={disabled || busy}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        icon={triggerIcon}
        onClick={open}
        data-testid={triggerTestId}
        className={triggerClassName}
      >
        {triggerLabel}
      </Button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onCancel={onCancelNative}
        onClick={onBackdropClick}
        data-component="confirm-action"
        className={[
          "w-[calc(100%_-_2rem)] max-w-md p-0 m-auto",
          "rounded-card border border-border bg-surface text-content shadow-lg",
          "backdrop:bg-[color:color-mix(in_oklab,var(--album-overlay)_60%,transparent)]",
          "backdrop:backdrop-blur-sm",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2
              id={titleId}
              className="text-base font-semibold leading-snug text-content"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="whitespace-pre-line text-sm leading-relaxed text-muted"
              >
                {description}
              </p>
            ) : null}
          </div>

          {busy && pendingLabel ? (
            <p
              role="status"
              aria-live="polite"
              data-component="confirm-action-pending"
              className="rounded-control border border-border bg-surface-muted px-3 py-2 text-sm text-content"
            >
              {pendingLabel}
            </p>
          ) : null}

          <div
            className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
            data-component="confirm-action-actions"
          >
            <Button
              type="button"
              variant="secondary"
              onClick={close}
              disabled={busy}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              form={formId}
              onClick={onConfirmClick}
              disabled={busy}
            >
              {busy && pendingLabel ? pendingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
