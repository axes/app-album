"use client";

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useRef,
} from "react";
import { Icon, type IconName } from "./icons";

/**
 * DESIGN v2 §8 — Segmented control.
 *
 * Container: inline-flex, padding 4 px, surface-soft background, border, pill
 * radius. Items: 44 px high, padding-inline 16 px, 14/600, pill radius. The
 * selected item uses the `primary` background with `text-on`.
 *
 * Three render modes share the same visual shell:
 *
 *   - "toggle" (default): each option carries `aria-pressed`. This is the
 *     contract the existing ViewToggle (mosaic / list switch) depends on.
 *   - "radio": the group carries `role="radiogroup"` and the options
 *     `role="radio"` with `aria-checked`.
 *   - "tabs": the group carries `role="tablist"`, the options `role="tab"`
 *     with `aria-selected` / `aria-controls`, and a required `panel` renders
 *     as a `role="tabpanel"` sibling. Both `panelId` and `panel` are required
 *     in this mode so every tab has a stable `aria-controls` target that
 *     actually exists in the DOM. The tablist implements the WAI-ARIA tabs
 *     keyboard contract: ArrowLeft / ArrowRight move between tabs (wrapping),
 *     Home / End jump to the first / last tab, focus roves to the newly
 *     selected tab and activation is automatic through `onChange`.
 *
 * The selection always collapses to a single value, so the three modes are
 * interchangeable without changing the `value` / `onChange` contract.
 */
export type SegmentedControlItem = {
  value: string;
  label: string;
  icon?: IconName;
  /** Accessible label override. Falls back to `label`. */
  ariaLabel?: string;
};

export type SegmentedControlMode = "toggle" | "radio" | "tabs";

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
   * Render mode. See the component docblock for the semantics of each mode.
   */
  mode?: SegmentedControlMode;
  /**
   * Required in `tabs` mode: the id of the `role="tabpanel"` the tabs control.
   * Each tab receives `aria-controls={panelId}` and an id of
   * `${panelId}-tab-${value}`.
   */
  panelId?: string;
  /**
   * Required in `tabs` mode: the tabpanel content. It is rendered as a
   * `role="tabpanel"` sibling with `id={panelId}` and
   * `aria-labelledby` pointing at the selected tab, so `aria-controls` never
   * references a panel that does not exist.
   */
  panel?: ReactNode;
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

const panelClasses =
  "mt-2 rounded-card border border-border bg-surface p-4 text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export function SegmentedControl({
  items,
  value,
  onChange,
  ariaLabel,
  mode = "toggle",
  panelId,
  panel,
  className,
  children,
  ...rest
}: SegmentedControlProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (mode === "tabs" && (!panelId || !panel)) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "SegmentedControl with mode=\"tabs\" requires both a panelId and a panel so every tab references a rendered tabpanel.",
      );
    }
    console.error(
      "SegmentedControl with mode=\"tabs\" rendered without a panelId and panel. The tabs will not reference a tabpanel.",
    );
  }

  const container = [containerClasses, className].filter(Boolean).join(" ");

  if (mode === "tabs") {
    const hasPanel = Boolean(panelId && panel);
    const selectedTabId = hasPanel ? `${panelId}-tab-${value}` : undefined;

    const handleTabKeyDown = (
      event: KeyboardEvent<HTMLButtonElement>,
      index: number,
    ) => {
      const lastIndex = items.length - 1;
      let nextIndex: number;
      switch (event.key) {
        case "ArrowRight":
          nextIndex = index === lastIndex ? 0 : index + 1;
          break;
        case "ArrowLeft":
          nextIndex = index === 0 ? lastIndex : index - 1;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = lastIndex;
          break;
        default:
          return;
      }
      event.preventDefault();
      onChange(items[nextIndex].value);
      tabRefs.current[nextIndex]?.focus();
    };

    return (
      <>
        <div
          role="tablist"
          aria-label={ariaLabel}
          className={container}
          {...rest}
        >
          {items.map((item, index) => {
            const selected = item.value === value;
            const optionStateClasses = selected
              ? optionSelectedClasses
              : optionUnselectedClasses;
            return (
              <button
                key={item.value}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={hasPanel ? `${panelId}-tab-${item.value}` : undefined}
                aria-selected={selected}
                aria-controls={hasPanel ? panelId : undefined}
                tabIndex={selected ? 0 : -1}
                aria-label={item.ariaLabel ?? item.label}
                onClick={() => onChange(item.value)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={[optionBaseClasses, optionStateClasses].join(" ")}
              >
                {item.icon ? <Icon name={item.icon} size="sm" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
        {hasPanel ? (
          <div
            role="tabpanel"
            id={panelId}
            aria-labelledby={selectedTabId}
            tabIndex={0}
            className={panelClasses}
          >
            {panel}
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <div
      role={mode === "radio" ? "radiogroup" : "group"}
      aria-label={ariaLabel}
      className={container}
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
