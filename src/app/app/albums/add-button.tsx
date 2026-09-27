"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addAlbumAction, type CollectionActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="rounded bg-primary px-3 py-2 text-sm text-primary-text disabled:cursor-not-allowed" disabled={pending} type="submit">
      {pending ? "Añadiendo…" : "Añadir a mi colección"}
    </button>
  );
}

export function AddAlbumButton({ albumId }: { albumId: string }) {
  const [state, action] = useActionState<CollectionActionState, FormData>(addAlbumAction, {});
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input name="albumId" type="hidden" value={albumId} />
      <SubmitButton />
      {state.error ? <p className="text-sm text-danger" role="alert">{state.error}</p> : null}
    </form>
  );
}
