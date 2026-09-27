"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { removeAlbumAction } from "./actions";

function RemoveSubmit() {
  const { pending } = useFormStatus();
  return (
    <button className="rounded border border-danger px-3 py-2 text-sm text-danger disabled:cursor-not-allowed" disabled={pending} type="submit">
      {pending ? "Quitando…" : "Quitar de mi colección"}
    </button>
  );
}

export function RemoveAlbumButton({ userAlbumId }: { userAlbumId: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      action={removeAlbumAction}
      ref={form}
      onSubmit={(event) => {
        if (!window.confirm("Quitar este álbum eliminará todo el progreso registrado.")) event.preventDefault();
      }}
    >
      <input name="userAlbumId" type="hidden" value={userAlbumId} />
      <RemoveSubmit />
    </form>
  );
}
