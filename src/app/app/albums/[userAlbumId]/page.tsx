import { redirect } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionError, CollectionService, type UserAlbumDetail } from "@/lib/collection/service";
import { CollectionNav } from "../../collection-nav";
import { ProgressSummary } from "../../progress";
import { RemoveAlbumButton } from "../remove-button";
import { ShareControls } from "./share-controls";
import { StickerCollection } from "./sticker-collection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
          <ShareControls sharing={detail.sharing} userAlbumId={detail.id} />
          <div className="mt-auto"><RemoveAlbumButton userAlbumId={detail.id} /></div>
        </div>
      </header>
      <StickerCollection
        groups={[
          ...detail.sections.map((section) => ({ id: section.id, name: section.name, stickers: section.stickers })),
          ...(detail.unassigned.length > 0
            ? [{ id: "unassigned", name: "Sin página asignada", stickers: detail.unassigned }]
            : []),
        ]}
        userAlbumId={detail.id}
      />
    </section>
  );
}
