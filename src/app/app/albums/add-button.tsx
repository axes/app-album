"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { InlineMessage } from "@/components/ui/inline-message";
import { addAlbumAction, type CollectionActionState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="md" disabled={pending} className="w-full">
      {pending ? "Añadiendo…" : "Añadir a mi colección"}
    </Button>
  );
}

export function AddAlbumButton({ albumId }: { albumId: string }) {
  const [state, action] = useActionState<CollectionActionState, FormData>(addAlbumAction, {});
  return (
    <form action={action} className="flex flex-col items-stretch gap-2">
      <input name="albumId" type="hidden" value={albumId} />
      <SubmitButton />
      {state.error ? (
        <InlineMessage variant="error" data-testid="add-album-error">
          {state.error}
        </InlineMessage>
      ) : null}
    </form>
  );
}