"use client";

import { SegmentedControl, type SegmentedControlItem } from "@/components/ui/segmented-control";
import type { IconName } from "@/components/ui/icons";

/**
 * View toggle (DESIGN v2 §8) — mosaic vs. list.
 *
 * Implemented on top of `SegmentedControl` so both controls share the same
 * container (padding 4 px, surface-soft, border, pill radius) and the same
 * 44 px / 16 px / 14/600 item look. The current options and their
 * `aria-pressed` contract are preserved so the existing tests in
 * `sticker-collection.test.tsx` keep passing.
 */
export type ViewMode = "grid" | "list";

const VIEW_ITEMS: SegmentedControlItem[] = [
  { value: "grid", label: "Mosaico", icon: "grid" as IconName },
  { value: "list", label: "Lista", icon: "list" as IconName },
];

export function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <SegmentedControl
      ariaLabel="Vista de láminas"
      items={VIEW_ITEMS}
      onChange={(next) => onChange(next as ViewMode)}
      value={value}
    />
  );
}
