"use client";

import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icons";

/**
 * Disclosure for the secondary collection actions (sharing and removal).
 *
 * Marking stickers is the primary task of the detail page, so the actions a
 * user reaches for only occasionally stay collapsed behind one control and the
 * sticker grid starts higher on the screen. The panel opens by default while a
 * public link is active, because that is when the link needs to be at hand.
 *
 * Accessibility contract (same as `CollapsibleSurfaceCard`): the trigger is a
 * native `<button>` with `aria-expanded` / `aria-controls`, and the panel is
 * always mounted and hidden with the native `hidden` attribute.
 */
export function AlbumOptions({
  defaultOpen = false,
  children,
}: {
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${useId()}-panel`;

  return (
    <div data-component="album-options" className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-control px-2 text-sm font-medium text-primary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2"
      >
        <Icon name="share" size="sm" />
        <span>Compartir y opciones</span>
        <Icon
          name="chevronDown"
          size="sm"
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>
      <div id={panelId} hidden={!open} className="flex flex-col gap-4 pt-2">
        {children}
      </div>
    </div>
  );
}
