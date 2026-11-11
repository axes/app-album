"use client";

import { useState } from "react";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import { announceAlbumCompleted } from "./album-completion";
import { StickerCard } from "./sticker-card";
import { StickerSection } from "./sticker-section";
import { ViewToggle, type ViewMode } from "./view-toggle";

type Sticker = UserAlbumDetail["unassigned"][number];
type StickerGroup = { id: string; name: string; stickers: Sticker[] };

export type StickerFilter = "all" | "missing" | "duplicates";

const FILTER_ITEMS: SegmentedControlItem[] = [
  { value: "all", label: "Todas" },
  { value: "missing", label: "Faltantes" },
  { value: "duplicates", label: "Repetidas" },
];

const EMPTY_FILTER_COPY: Record<Exclude<StickerFilter, "all">, { title: string; description: string }> = {
  missing: { title: "No te falta ninguna", description: "Ya tienes todas las láminas de este álbum." },
  duplicates: { title: "Sin repetidas", description: "Todavía no tienes láminas repetidas en este álbum." },
};

function matches(filter: StickerFilter, sticker: Sticker): boolean {
  if (filter === "missing") return sticker.quantity === 0;
  if (filter === "duplicates") return sticker.quantity > 1;
  return true;
}

/**
 * The filter is a snapshot, not a live query: the set of visible stickers is
 * computed when the filter is chosen and stays put while the user marks
 * stickers. Otherwise a tile would vanish the moment it stops matching and the
 * next one would slide under the finger, which invites wrong taps. Choosing
 * the filter again refreshes the snapshot.
 */
type FilterState = { filter: StickerFilter; ids: ReadonlySet<string> | null; version: number };

export function StickerCollection({ groups, userAlbumId }: { groups: StickerGroup[]; userAlbumId: string }) {
  const [view, setView] = useState<ViewMode>("grid");
  const [state, setState] = useState<FilterState>({ filter: "all", ids: null, version: 0 });

  function changeFilter(next: StickerFilter) {
    setState((previous) => ({
      filter: next,
      ids:
        next === "all"
          ? null
          : new Set(groups.flatMap((group) => group.stickers).filter((sticker) => matches(next, sticker)).map((sticker) => sticker.id)),
      version: previous.version + 1,
    }));
  }

  // The one sticker standing between the user and a complete album, if any.
  // It follows the authoritative quantities, so it only exists while exactly
  // one sticker is missing on the server.
  const missing = groups.flatMap((group) => group.stickers).filter((sticker) => sticker.quantity === 0);
  const lastMissingId = missing.length === 1 ? missing[0].id : null;

  const { filter, ids } = state;
  const visibleGroups = groups
    .map((group) => ({ group, stickers: ids ? group.stickers.filter((sticker) => ids.has(sticker.id)) : group.stickers }))
    .filter((entry) => ids === null || entry.stickers.length > 0);

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="stickers-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold" id="stickers-title">Láminas</h2>
        <ViewToggle onChange={setView} value={view} />
      </div>
      {groups.length === 0 ? (
        <EmptyState description="Este álbum todavía no tiene láminas disponibles." title="No hay láminas" />
      ) : (
        <>
          <SegmentedControl
            ariaLabel="Filtrar láminas"
            className="max-w-full self-start overflow-x-auto"
            items={FILTER_ITEMS}
            onChange={(next) => changeFilter(next as StickerFilter)}
            value={filter}
          />
          {filter !== "all" && visibleGroups.length === 0 ? (
            <EmptyState description={EMPTY_FILTER_COPY[filter].description} title={EMPTY_FILTER_COPY[filter].title} />
          ) : visibleGroups.map(({ group, stickers }, index) => {
            const owned = group.stickers.filter((sticker) => sticker.quantity > 0).length;
            return (
              <StickerSection
                // A filtered result opens every page that has a match; the
                // version remounts the sections so that default applies.
                key={`${group.id}:${state.version}`}
                name={group.name}
                owned={owned}
                total={group.stickers.length}
                defaultOpen={filter !== "all" || index === 0}
              >
                <ul className={view === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2 p-2 sm:grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] sm:gap-3 sm:p-3" : "divide-y divide-border"}>
                  {stickers.map((sticker) => (
                    <StickerCard
                      key={sticker.id}
                      lastMissing={sticker.id === lastMissingId}
                      onAlbumCompleted={announceAlbumCompleted}
                      sticker={sticker}
                      userAlbumId={userAlbumId}
                      view={view}
                    />
                  ))}
                </ul>
              </StickerSection>
            );
          })}
        </>
      )}
    </section>
  );
}
