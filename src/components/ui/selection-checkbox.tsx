import type { InputHTMLAttributes } from "react";

/**
 * Selection checkbox (Commit 2 — admin foundation).
 *
 * A 20 px checkbox with a 44 px hit target, used by the admin bulk-selection
 * flows. The native `<input type="checkbox">` keeps its semantics and native
 * props; the wrapper `<label>` provides the touch target and, when a visible
 * `label` is given, the accessible name.
 *
 * Contract: the control must carry an accessible name, either through the
 * visible `label` prop or through `aria-label`. The component throws in
 * development when neither is present.
 */
export type SelectionCheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  /** Optional visible label rendered next to the box. */
  label?: string;
  className?: string;
};

export function SelectionCheckbox({
  label,
  className,
  disabled,
  ...props
}: SelectionCheckboxProps) {
  if (!label && !props["aria-label"]) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "SelectionCheckbox requires a visible label or an aria-label so the control carries an accessible name.",
      );
    }
    console.error(
      "SelectionCheckbox rendered without a label or aria-label. The checkbox will appear in the accessibility tree without an accessible name.",
    );
  }

  return (
    <label
      className={[
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        className="h-5 w-5 accent-primary"
        disabled={disabled}
        {...props}
      />
      {label ? <span className="text-sm text-content">{label}</span> : null}
    </label>
  );
}
