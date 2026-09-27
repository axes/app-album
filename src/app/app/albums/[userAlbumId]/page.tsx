import { redirect } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionError, CollectionService, type UserAlbumDetail } from "@/lib/collection/service";
import { CollectionNav } from "../../collection-nav";
import { ProgressSummary } from "../../progress";
import { adjustQuantityAction } from "../actions";
import { QuantityButton } from "../quantity-button";
import { RemoveAlbumButton } from "../remove-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Sticker = UserAlbumDetail["unassigned"][number];

function StickerRow({ sticker, userAlbumId }: { sticker: Sticker; userAlbumId: string }) {
  const status = sticker.quantity === 0 ? "Faltante" : sticker.quantity === 1 ? "Obtenida" : "Repetida";
  const statusClass = sticker.quantity === 0 ? "text-muted" : sticker.quantity === 1 ? "text-success" : "text-primary";
  return (
    <li className="grid grid-cols-[minmax(4rem,auto)_1fr_auto] items-center gap-3 border-t border-border px-3 py-2 first:border-t-0">
      <code className="text-sm font-semibold">{sticker.code}</code>
      <div className="min-w-0">
        <p className="truncate text-sm">{sticker.name || "—"}</p>
        <p className={`text-xs ${statusClass}`}>{status}</p>
      </div>
      <div className="flex items-center gap-2">
        <form action={adjustQuantityAction}>
          <input name="userAlbumId" type="hidden" value={userAlbumId} />
          <input name="stickerId" type="hidden" value={sticker.id} />
          <input name="change" type="hidden" value="decrement" />
          <QuantityButton disabled={sticker.quantity === 0} label={`Quitar copia de ${sticker.code}`}>−</QuantityButton>
        </form>
        <span aria-label={`${sticker.quantity} copias`} className="min-w-6 text-center font-semibold tabular-nums">{sticker.quantity}</span>
        <form action={adjustQuantityAction}>
          <input name="userAlbumId" type="hidden" value={userAlbumId} />
          <input name="stickerId" type="hidden" value={sticker.id} />
          <input name="change" type="hidden" value="increment" />
          <QuantityButton disabled={sticker.quantity >= 1000} label={`Añadir copia de ${sticker.code}`}>+</QuantityButton>
        </form>
      </div>
    </li>
  );
}

function StickerGroup({ name, stickers, userAlbumId }: { name: string; stickers: Sticker[]; userAlbumId: string }) {
  const owned = stickers.filter((sticker) => sticker.quantity > 0).length;
  return (
    <details className="rounded border border-border bg-surface">
      <summary className="cursor-pointer px-4 py-3 font-medium">
        {name} — {owned} / {stickers.length}
      </summary>
      <ul className="border-t border-border">
        {stickers.map((sticker) => <StickerRow key={sticker.id} sticker={sticker} userAlbumId={userAlbumId} />)}
      </ul>
    </details>
  );
}

export default async function UserAlbumPage({ params }: { params: Promise<{ userAlbumId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { userAlbumId } = await params;
  let detail: UserAlbumDetail;
  try {
    detail = await new CollectionService(new DrizzleCollectionRepository()).getAlbumDetail(user.id, userAlbumId);
  } catch (error) {
    if (error instanceof CollectionError && ["forbidden", "not_found", "invalid_input"].includes(error.code)) redirect("/app");
    throw error;
  }

  return (
    <section className="flex flex-col gap-6">
      <CollectionNav user={user} />
      <header className="grid gap-5 rounded border border-border bg-surface p-4 sm:grid-cols-[10rem_1fr]">
        <div className="mx-auto w-32 sm:w-full"><AlbumCover title={detail.album.title} url={detail.album.coverUrl} /></div>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{detail.album.title}</h1>
            <p className="text-sm text-muted">{[detail.album.publisher, detail.album.year].filter(Boolean).join(" · ") || "Sin datos editoriales"}</p>
          </div>
          <ProgressSummary detailed progress={detail.progress} />
          <div className="mt-auto"><RemoveAlbumButton userAlbumId={detail.id} /></div>
        </div>
      </header>
      <div className="flex flex-col gap-3">
        {detail.sections.map((section) => (
          <StickerGroup key={section.id} name={section.name} stickers={section.stickers} userAlbumId={detail.id} />
        ))}
        {detail.unassigned.length > 0 ? (
          <StickerGroup name="Sin página asignada" stickers={detail.unassigned} userAlbumId={detail.id} />
        ) : null}
      </div>
    </section>
  );
}
