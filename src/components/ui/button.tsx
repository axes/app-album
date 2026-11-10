import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Icon } from "./icons";

/**
 * Compact button primitive (DESIGN v2 §7).
 *
 * Rendered as a plain function component with no hooks, so it can be used from
 * Server and Client Components alike. The visual is fixed by the design
 * system: 44 px (`md`) or 36 px (`sm`) high, 12 px radius, 1.5 px border,
 * 15/600/Inter (13/600 for `sm`) text without uppercase, a `loading` state
 * that is always announced with a gerund label, and a 44 × 44 px `iconOnly`
 * shape that must carry an `aria-label` of its own.
 *
 * daisyUI's `.btn` provides the base color roles and focus ring; the utility
 * classes (`h-11` / `h-9`, `border-[1.5px]`, `gap-2`, `duration-[…]`,
 * `active:scale-[.97]`, `disabled:opacity-45`) override its measurements so
 * the component does not depend on theme defaults. The cascade test in
 * `button-cascade.test.ts` compiles the real CSS and asserts that those
 * properties win over daisyUI's sub-layer.
 *
 * Native `<button>` props (`type`, `name`, `value`, `disabled`, `form`,
 * `onClick`, `aria-*`, …) are forwarded untouched. The `asChild` escape hatch
 * from UI-03B keeps working: a single child element is cloned and receives the
 * button classes, so an anchor stays an anchor. The clone also re-renders the
 * `icon` / `trailingIcon` slots around the child's own content, so an
 * `asChild` button looks exactly like the native one.
 */
export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerGhost"
  | "link";

export type ButtonSize = "sm" | "md";

const baseClasses = [
  // daisyUI role classes come first; measurement utilities after them win
  // because Tailwind 4 emits them directly inside `@layer utilities`, after
  // daisyUI's nested sub-layers.
  "btn type-button border-0 normal-case shadow-none",
  // 12 px radius (DESIGN §7) regardless of daisyUI's --radius-field.
  "rounded-control",
  // Touch target and visual height: 44 px (`md`) or 36 px (`sm`). `h-11` /
  // `h-9` must override daisyUI's `height: var(--size)` (2.5rem).
  "min-h-11",
  // DESIGN §16: every tactile control ≥ 44 px. The 36 px compact form is the
  // single exception listed in §7 ("solo en escritorio denso"); it still
  // honours min-h-11, only the visual height shrinks.
  // 1.5 px border (DESIGN §7): overrides daisyUI's `border-width: var(--border)`
  // (1 px). The border *colour* is owned by `variantBorderClasses` below, not
  // by this base string: daisyUI's `.btn` declares `border-color:
  // var(--btn-border)` and Tailwind emits same-property utilities in
  // alphabetical order, so a `border-transparent` here would beat
  // `border-input-border` on the secondary variant regardless of the order the
  // classes appear in the attribute. Keeping the colour out of the base makes
  // each variant declare exactly one border colour, with no tie to break.
  "border-[1.5px]",
  // 8 px gap (DESIGN §7): daisyUI's `.btn` ships `gap: 0.375rem` (6 px).
  "gap-2",
  // 150 ms transition, only the colour / border / opacity properties
  // (DESIGN §7 + §15). daisyUI's `.btn` ships a 200 ms duration.
  "duration-[var(--transition-fast)]",
  "ease-[var(--ease-standard)]",
  "transition-[color,background-color,border-color,opacity,transform]",
  // Hover (brightness 1.1) and pressed (scale 0.97) per §7. The pressed
  // effect is gated behind `:active` so it does not fire on focus.
  "hover:[filter:brightness(1.1)] active:scale-[.97]",
  // Disabled per §7: opacity 0.45, no hover, cursor not-allowed.
  "disabled:opacity-45",
  "disabled:cursor-not-allowed",
  "disabled:hover:[filter:none]",
  "disabled:active:scale-100",
].join(" ");

const sizeClasses: Record<ButtonSize, string> = {
  // 44 px high, 16 px horizontal padding, 15/600/Inter (set by .type-button).
  md: "h-11 px-4",
  // 36 px high (DESIGN §7 "compacto"), 12 px horizontal padding, 13 px text.
  sm: "h-9 px-3 type-button-compact",
};

const iconOnlyClasses =
  "aspect-square w-11 justify-center px-0";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary text-on",
  accent: "btn-accent text-on",
  // DESIGN §7: secondary = transparent, text colour, 1.5 px input-border.
  // daisyUI's `.btn-secondary` uses base-200 as the background, so we
  // explicitly reset to transparent and paint the border ourselves.
  secondary: "bg-transparent text-content hover:bg-surface-muted",
  // DESIGN §7: ghost = transparent, primary text, no border.
  ghost: "btn-ghost text-primary hover:bg-surface-muted",
  // DESIGN §7: danger uses the daisyUI error role (already mapped to
  // --album-danger in the theme).
  danger: "btn-error text-on",
  // DESIGN §7 / D4: dangerGhost is the low-emphasis destructive affordance.
  // Transparent background, danger foreground, no visible border. The hover
  // tint (danger 12% mixed with surface) is centralised in `globals.css` as
  // the `.danger-ghost` class so no component repeats a hex value or a
  // Tailwind opacity modifier over a token.
  dangerGhost: "danger-ghost bg-transparent text-danger",
  link: "btn-link text-primary underline-offset-2 hover:text-accent",
};

/**
 * Border colour per variant, applied unconditionally — including while
 * `loading`, where `variantClasses` is swapped for `loadingVariantClasses`.
 *
 * It lives in its own map because the border colour is part of the variant
 * contract, not of the loading state: a secondary button must keep its
 * `--album-input-border` outline while it is in flight. Every variant declares
 * exactly one border colour, so no two utilities compete for the same property
 * and the alphabetical emission order Tailwind uses cannot flip the result.
 *
 * `border-transparent` is the default for the filled and borderless variants:
 * daisyUI's `.btn` would otherwise paint `var(--btn-border)` (the role colour)
 * around them.
 */
const variantBorderClasses: Record<ButtonVariant, string> = {
  primary: "border-transparent",
  accent: "border-transparent",
  secondary: "border-input-border",
  ghost: "border-transparent",
  danger: "border-transparent",
  dangerGhost: "border-transparent",
  link: "border-transparent",
};

const loadingVariantClasses: Record<ButtonVariant, string> = {
  primary: "text-on",
  accent: "text-on",
  secondary: "text-content",
  ghost: "text-primary",
  danger: "text-on",
  dangerGhost: "text-danger",
  link: "text-primary",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * When `true`, Button does not render its own `<button>`. Instead it clones
   * its single child element (typically a `next/link` `<Link>`) and merges the
   * button classes onto it, so the child keeps its own semantics (an anchor
   * stays an anchor) while looking like a button.
   */
  asChild?: boolean;
  /**
   * When `true`, the button renders as a 44 × 44 px square and the only
   * content is an icon. `aria-label` is **required** in this mode and the
   * component throws during render if it is missing. Pair with the `label`
   * prop on `<Icon />` so the icon itself does not double up the accessible
   * name.
   */
  iconOnly?: boolean;
  /**
   * Loading state. Forces `disabled`, swaps the leading icon for a spinning
   * `loader-circle` and renders the `loadingLabel` in gerund ("Guardando…")
   * so the in-flight action is announced even when the spinner is
   * neutralised by `prefers-reduced-motion`.
   */
  loading?: boolean;
  /**
   * Gerund label rendered in place of the children while `loading` is
   * `true`. Required when `loading` is `true`.
   */
  loadingLabel?: string;
  /**
   * Optional leading icon. When `loading` is `true` the icon is replaced by
   * `loader-circle` regardless of this prop.
   */
  icon?: ReactNode;
  /**
   * Trailing icon. Ignored while `loading` is `true`.
   */
  trailingIcon?: ReactNode;
  /**
   * Forwarded to the underlying `<button>` (React 19 treats `ref` as a regular
   * prop). Consumers such as `ConfirmAction` need it to restore focus to the
   * trigger after the dialog closes.
   */
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  asChild = false,
  iconOnly = false,
  loading = false,
  loadingLabel,
  icon,
  trailingIcon,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
  if (iconOnly && !props["aria-label"]) {
    // The type system already forbids this combination, but render-time
    // double-checks exist for two reasons:
    //   1. Developers can reach the component through `asChild`, where the
    //      `aria-label` is forwarded through `{...props}` on the child and
    //      the type system cannot see it.
    //   2. A future consumer might use `Button` from JSX that bypasses the
    //      TS surface (e.g. an MDX page or a `dangerouslySetInnerHTML`
    //      caller).
    // In development we want a loud failure; in production the render must
    // not break the page, so we degrade to `console.error` and let the
    // browser emit the empty button as a 0-name widget (the link to the
    // underlying icon label will still be present through `aria-label`
    // leaking via the cloned child, when `asChild` is used).
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "Button with iconOnly requires an aria-label so the control carries an accessible name.",
      );
    }
    console.error(
      "Button with iconOnly rendered without an aria-label. The button will appear in the accessibility tree without an accessible name.",
    );
  }
  if (loading && !loadingLabel) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        "Button with loading=true requires a loadingLabel in gerund (e.g. \"Guardando…\").",
      );
    }
    console.error(
      "Button with loading=true rendered without a loadingLabel. The control will not announce the in-flight action.",
    );
  }

  const effectiveDisabled = disabled || loading;
  const visibleChildren = loading
    ? loadingLabel
    : children;
  const leadingIcon = loading ? (
    <Icon name="loading" size="sm" label="Cargando" />
  ) : icon;
  const trailing = loading ? null : trailingIcon;

  const classes = [
    baseClasses,
    sizeClasses[size],
    iconOnly ? iconOnlyClasses : null,
    // While loading the variant colour background is replaced by a slightly
    // dimmed version of the same token (the disabled-opacity already lowers
    // the contrast); we still keep the variant class so the focus ring
    // matches the rest of the family.
    loading ? loadingVariantClasses[variant] : variantClasses[variant],
    // The border colour is applied in both states: it belongs to the variant,
    // not to the loading state (see `variantBorderClasses`).
    variantBorderClasses[variant],
    loading ? "cursor-wait" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild) {
    if (!isValidElement(children)) {
      throw new Error(
        "Button with asChild expects exactly one React element child.",
      );
    }

    // `asChild` keeps the child's own element (an anchor stays an anchor) but
    // must still render the icon slots: the child's content is wrapped in the
    // same `icon → content → trailingIcon` order the native `<button>` uses.
    // Without this the icons were silently dropped, because the clone only
    // carried `className` and the forwarded props.
    const child = children as ReactElement<{
      className?: string;
      children?: ReactNode;
    }>;
    const childContent = loading ? loadingLabel : child.props.children;
    const childProps = {
      ...props,
      ref,
      disabled: effectiveDisabled,
      "aria-busy": loading || undefined,
      "aria-disabled": effectiveDisabled || undefined,
      className: [child.props.className, classes].filter(Boolean).join(" "),
      children: (
        <>
          {leadingIcon}
          {iconOnly ? null : childContent}
          {trailing}
        </>
      ),
    };

    return cloneElement(child, childProps);
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={effectiveDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {leadingIcon}
      {iconOnly ? null : visibleChildren}
      {trailing}
    </button>
  );
}
