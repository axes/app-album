import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionError, CollectionService, type UserAlbumDetail } from "@/lib/collection/service";
import { AlbumDetailHero } from "./album-detail-hero";
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
      <AlbumDetailHero album={detail.album} id={detail.id} progress={detail.progress} sharing={detail.sharing} />
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
