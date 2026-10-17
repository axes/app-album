import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Icon, type IconName } from "./icons";

type FieldOwnProps = {
  label: string;
  /** Required so labels and optional messages always have stable associations. */
  name: string;
  hint?: string;
  error?: string;
  /**
   * Optional leading icon rendered inside the control. Only `input` and
   * `select` render it; the glyph is decorative (the visible label already
   * names the control) and comes from the DESIGN v2 §6 map.
   */
  icon?: IconName;
  id?: string;
  className?: string;
};

type InputFieldProps = FieldOwnProps &
  { as?: "input" } &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "name">;

type SelectFieldProps = FieldOwnProps &
  { as: "select" } &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "name">;

type TextareaFieldProps = FieldOwnProps &
  { as: "textarea" } &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "name">;

export type FieldProps =
  | InputFieldProps
  | SelectFieldProps
  | TextareaFieldProps;

type FieldFrameProps = Omit<FieldOwnProps, "className" | "icon"> & {
  control: React.ReactNode;
};

function describedBy(
  controlId: string,
  hint: string | undefined,
  error: string | undefined,
  external: string | undefined,
) {
  return [
    external,
    hint ? `${controlId}-hint` : undefined,
    error ? `${controlId}-error` : undefined,
  ]
    .filter(Boolean)
    .join(" ") || undefined;
}

function FieldFrame({ label, hint, error, id, name, control }: FieldFrameProps) {
  const controlId = id ?? name;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" htmlFor={controlId}>
        {label}
      </label>
      {control}
      {hint ? (
        <p id={`${controlId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${controlId}-error`}
          role="alert"
          className="flex items-center gap-1 text-sm text-content"
        >
          <Icon name="error" size="sm" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const sharedClasses = [
  "w-full rounded-control border bg-input px-3 text-content shadow-none",
  "transition-[border-color,background-color,color] duration-[var(--transition-fast)] ease-[var(--ease-standard)]",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

/**
 * Wraps a control with an optional leading icon. The icon is absolutely
 * positioned and `pointer-events-none`, so it never intercepts a click and the
 * control keeps its full hit area.
 *
 * `z-10` is required, not decorative: daisyUI's `.input` / `.select` declare
 * `position: relative`, which makes the control a positioned element too. With
 * both at `z-index: auto` the paint order falls back to DOM order, so the
 * control — which comes after the icon — would paint its opaque `bg-input`
 * background over the glyph and hide it. A positive `z-index` on the icon puts
 * it back on top.
 */
function withLeadingIcon(icon: IconName | undefined, control: React.ReactNode) {
  if (!icon) return control;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted">
        <Icon name={icon} size="sm" />
      </span>
      {control}
    </div>
  );
}

function InputField(props: InputFieldProps) {
  const {
    label,
    name,
    hint,
    error,
    icon,
    id,
    className,
    as: _as,
    "aria-describedby": externalDescription,
    "aria-invalid": externalInvalid,
    ...nativeProps
  } = props;
  void _as;
  const controlId = id ?? name;
  const control = withLeadingIcon(
    icon,
    <input
      {...nativeProps}
      id={controlId}
      name={name}
      className={`input h-11 min-h-0 ${sharedClasses} ${icon ? "pl-9" : ""} ${error ? "border-danger" : "border-input-border"} ${className ?? ""}`}
      aria-invalid={error ? true : externalInvalid}
      aria-errormessage={error ? `${controlId}-error` : undefined}
      aria-describedby={describedBy(controlId, hint, error, externalDescription)}
    />,
  );
  return <FieldFrame {...{ label, name, hint, error, id, control }} />;
}

function SelectField(props: SelectFieldProps) {
  const {
    label,
    name,
    hint,
    error,
    icon,
    id,
    className,
    as: _as,
    "aria-describedby": externalDescription,
    "aria-invalid": externalInvalid,
    ...nativeProps
  } = props;
  void _as;
  const controlId = id ?? name;
  const control = withLeadingIcon(
    icon,
    <select
      {...nativeProps}
      id={controlId}
      name={name}
      className={`select h-11 min-h-0 ${sharedClasses} ${icon ? "pl-9" : ""} ${error ? "border-danger" : "border-input-border"} ${className ?? ""}`}
      aria-invalid={error ? true : externalInvalid}
      aria-errormessage={error ? `${controlId}-error` : undefined}
      aria-describedby={describedBy(controlId, hint, error, externalDescription)}
    />,
  );
  return <FieldFrame {...{ label, name, hint, error, id, control }} />;
}

function TextareaField(props: TextareaFieldProps) {
  const {
    label,
    name,
    hint,
    error,
    id,
    className,
    as: _as,
    "aria-describedby": externalDescription,
    "aria-invalid": externalInvalid,
    ...nativeProps
  } = props;
  void _as;
  const controlId = id ?? name;
  const control = (
    <textarea
      {...nativeProps}
      id={controlId}
      name={name}
      className={`textarea min-h-20 py-2 ${sharedClasses} ${error ? "border-danger" : "border-input-border"} ${className ?? ""}`}
      aria-invalid={error ? true : externalInvalid}
      aria-errormessage={error ? `${controlId}-error` : undefined}
      aria-describedby={describedBy(controlId, hint, error, externalDescription)}
    />
  );
  return <FieldFrame {...{ label, name, hint, error, id, control }} />;
}

/**
 * Compact daisyUI-backed input/select/textarea wrapper. Native attributes are
 * forwarded to the matching element through a discriminated TypeScript union.
 *
 * Inputs and selects render at a real 44 px (`h-11`) so the touch target
 * matches DESIGN v2 §16; the optional `icon` adds a decorative leading glyph.
 */
export function Field(props: FieldProps) {
  if (props.as === "select") return <SelectField {...props} />;
  if (props.as === "textarea") return <TextareaField {...props} />;
  return <InputField {...props} />;
}
