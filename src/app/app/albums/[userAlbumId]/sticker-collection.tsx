"use client";

import { useState } from "react";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { EmptyState } from "@/components/ui/empty-state";
import { StickerCard } from "./sticker-card";
import { StickerSection } from "./sticker-section";
import { ViewToggle, type ViewMode } from "./view-toggle";

type Sticker = UserAlbumDetail["unassigned"][number];
type StickerGroup = { id: string; name: string; stickers: Sticker[] };

export function StickerCollection({ groups, userAlbumId }: { groups: StickerGroup[]; userAlbumId: string }) {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="stickers-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold" id="stickers-title">Láminas</h2>
        <ViewToggle onChange={setView} value={view} />
      </div>
      {groups.length === 0 ? (
        <EmptyState description="Este álbum todavía no tiene láminas disponibles." title="No hay láminas" />
      ) : groups.map((group) => {
        const owned = group.stickers.filter((sticker) => sticker.quantity > 0).length;
        return (
          <StickerSection key={group.id} name={group.name} owned={owned} total={group.stickers.length}>
            <ul className={view === "grid" ? "grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "divide-y divide-border"}>
              {group.stickers.map((sticker) => (
                <StickerCard key={sticker.id} sticker={sticker} userAlbumId={userAlbumId} view={view} />
              ))}
            </ul>
          </StickerSection>
        );
      })}
    </section>
  );
}
