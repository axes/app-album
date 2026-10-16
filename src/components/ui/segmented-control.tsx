"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

/**
 * DESIGN v2 §8 — Segmented control.
 *
 * Container: inline-flex, padding 4 px, surface-soft background, border, pill
 * radius. Items: 44 px high, padding-inline 16 px, 14/600, pill radius. The
 * selected item uses the `primary` background with `text-on`.
 *
 * `aria-pressed` is used so the existing ViewToggle contract (mosaic / list
 * switch, one-or-zero active) is preserved, and so each option reads as a
 * toggle. A future radiogroup variant can be added by accepting a shared
 * `name` and switching to `role="radio"`, but that would change the
 * `aria-pressed` contract that sticker-collection depends on.
 */
export type SegmentedControlItem = {
  value: string;
  label: string;
  icon?: IconName;
  /** Accessible label override. Falls back to `label`. */
  ariaLabel?: string;
};

export type SegmentedControlProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange" | "defaultValue"
> & {
  items: SegmentedControlItem[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible label for the group container. */
  ariaLabel: string;
  /**
   * Render mode:
   *   - "toggle" (default): each option carries `aria-pressed`.
   *   - "radio": the group carries `role="radiogroup"` and the options
   *     `role="radio"` with `aria-checked`. The selection still collapses
   *     to a single value.
   */
  mode?: "toggle" | "radio";
  children?: ReactNode;
};

const containerClasses =
  "inline-flex items-center gap-1 rounded-pill border border-border bg-surface-muted p-1";

const optionBaseClasses = [
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-pill px-4 text-sm font-semibold",
  "transition-[color,background-color,opacity] duration-[var(--transition-fast)] ease-[var(--ease-standard)]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
].join(" ");

const optionSelectedClasses = "bg-primary text-on hover:[filter:brightness(1.1)]";

const optionUnselectedClasses =
  "bg-transparent text-content hover:bg-surface";

export function SegmentedControl({
  items,
  value,
  onChange,
  ariaLabel,
  mode = "toggle",
  className,
  children,
  ...rest
}: SegmentedControlProps) {
  return (
    <div
      role={mode === "radio" ? "radiogroup" : "group"}
      aria-label={ariaLabel}
      className={[containerClasses, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {items.map((item) => {
        const selected = item.value === value;
        const optionStateClasses = selected
          ? optionSelectedClasses
          : optionUnselectedClasses;

        if (mode === "radio") {
          return (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={item.ariaLabel ?? item.label}
              onClick={() => onChange(item.value)}
              className={[optionBaseClasses, optionStateClasses].join(" ")}
            >
              {item.icon ? <Icon name={item.icon} size="sm" /> : null}
              {item.label}
            </button>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={selected}
            aria-label={item.ariaLabel ?? item.label}
            onClick={() => onChange(item.value)}
            className={[optionBaseClasses, optionStateClasses].join(" ")}
          >
            {item.icon ? <Icon name={item.icon} size="sm" /> : null}
            {item.label}
          </button>
        );
      })}
      {children}
    </div>
  );
}
