import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/**
 * Admin data table primitive (Commit 2 — admin foundation).
 *
 * A composable, presentational shell around a semantic `<table>`. It owns no
 * business logic: the consumer renders the `<thead>` / `<tbody>` and the rows,
 * and this module only guarantees the shared structure and tokens.
 *
 * Accessibility contract (D2):
 *   - the scroll wrapper is a `role="region"` with a **required** `aria-label`,
 *     `tabIndex={0}` and a visible focus ring, so a keyboard user can scroll a
 *     wide table horizontally;
 *   - the table keeps native `<table>` / `<thead>` / `<tbody>` / `<tr>` /
 *     `<th>` / `<td>` semantics;
 *   - header cells are `scope="col"` by default and read 12/600 muted;
 *   - rows are 56 px high with 12 × 16 px cells, a bottom border and a
 *     surface-soft hover; a `selected` row applies the centralised
 *     `.admin-row-selected` tint (primary 8% + surface, defined in
 *     `globals.css`).
 *
 * `minWidth` sets the table's minimum width (e.g. `"48rem"`) so the wrapper
 * scrolls instead of squeezing the columns; `className` is merged on the
 * wrapper for one-off layout tweaks.
 */
export type DataTableProps = {
  /** Required accessible name for the scroll region. */
  ariaLabel: string;
  /** Optional minimum width for the table (any CSS length, e.g. `"48rem"`). */
  minWidth?: string;
  className?: string;
  children: ReactNode;
};

export function DataTable({
  ariaLabel,
  minWidth,
  className,
  children,
}: DataTableProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      data-component="data-table"
      className={[
        "overflow-x-auto rounded-card border border-border",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <table
        className="w-full border-collapse text-sm"
        style={minWidth ? { minWidth } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={["bg-surface-muted", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </thead>
  );
}

export function DataTableBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

export type DataTableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Applies the centralised primary-8% selected tint. */
  selected?: boolean;
};

export function DataTableRow({
  selected = false,
  className,
  children,
  ...rest
}: DataTableRowProps) {
  return (
    <tr
      className={[
        "h-14 border-b border-border transition-colors hover:bg-surface-muted",
        selected ? "admin-row-selected" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function DataTableHeaderCell({
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={[
        "px-4 py-3 text-left text-xs font-semibold text-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </th>
  );
}

export function DataTableCell({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={["px-4 py-3 align-middle text-content", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </td>
  );
}
