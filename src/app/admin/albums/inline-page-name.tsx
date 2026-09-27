"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { renameSectionAction } from "./actions";

function PencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m4 14.5-.5 2 2-.5L15 6.5 13.5 5 4 14.5Z" />
      <path d="m12.5 6 1.5 1.5" />
    </svg>
  );
}

export function InlinePageName({
  albumId,
  pageId,
  name,
}: {
  albumId: string;
  pageId: string;
  name: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function cancel() {
    cancelRef.current = true;
    setDraft(name);
    setError(undefined);
    setEditing(false);
  }

  function save() {
    if (savingRef.current) return;
    const normalized = draft.trim();
    if (normalized === name) {
      setError(undefined);
      setEditing(false);
      return;
    }
    if (!normalized) {
      setError("El nombre de la página es obligatorio.");
      inputRef.current?.focus();
      return;
    }

    savingRef.current = true;
    const data = new FormData();
    data.set("albumId", albumId);
    data.set("sectionId", pageId);
    data.set("name", normalized);
    startTransition(async () => {
      const result = await renameSectionAction({}, data);
      savingRef.current = false;
      if (result.error) {
        setDraft(name);
        setError(result.error);
        setEditing(true);
        return;
      }
      setError(undefined);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded text-left hover:text-primary"
          onClick={() => {
            cancelRef.current = false;
            setDraft(name);
            setError(undefined);
            setEditing(true);
          }}
          aria-label={`Editar nombre de la página ${name}`}
          title="Editar nombre de página"
        >
          <span>{name}</span>
          <span className="invisible text-primary group-hover/row:visible group-focus-within/row:visible">
            <PencilIcon />
          </span>
        </button>
        {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        className="w-full min-w-40 rounded border border-input-border bg-input px-2 py-1 text-sm text-content"
        value={draft}
        maxLength={160}
        disabled={pending}
        aria-label={`Nombre de la página ${name}`}
        aria-invalid={Boolean(error)}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          } else if (event.key === "Escape") {
            event.preventDefault();
            cancel();
          }
        }}
        onBlur={() => {
          if (cancelRef.current) {
            cancelRef.current = false;
            return;
          }
          save();
        }}
      />
      {error ? <p className="mt-1 text-xs text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
