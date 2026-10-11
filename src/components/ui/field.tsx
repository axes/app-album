import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type FieldOwnProps = {
  label: string;
  /** Required so labels and optional messages always have stable associations. */
  name: string;
  hint?: string;
  error?: string;
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

type FieldFrameProps = Omit<FieldOwnProps, "className"> & {
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
        <p id={`${controlId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${controlId}-error`} role="alert" className="text-sm text-content">
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

function InputField(props: InputFieldProps) {
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
    <input
      {...nativeProps}
      id={controlId}
      name={name}
      className={`input h-10 min-h-0 ${sharedClasses} ${error ? "border-danger" : "border-input-border"} ${className ?? ""}`}
      aria-invalid={error ? true : externalInvalid}
      aria-errormessage={error ? `${controlId}-error` : undefined}
      aria-describedby={describedBy(controlId, hint, error, externalDescription)}
    />
  );
  return <FieldFrame {...{ label, name, hint, error, id, control }} />;
}

function SelectField(props: SelectFieldProps) {
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
    <select
      {...nativeProps}
      id={controlId}
      name={name}
      className={`select h-10 min-h-0 ${sharedClasses} ${error ? "border-danger" : "border-input-border"} ${className ?? ""}`}
      aria-invalid={error ? true : externalInvalid}
      aria-errormessage={error ? `${controlId}-error` : undefined}
      aria-describedby={describedBy(controlId, hint, error, externalDescription)}
    />
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
 */
export function Field(props: FieldProps) {
  if (props.as === "select") return <SelectField {...props} />;
  if (props.as === "textarea") return <TextareaField {...props} />;
  return <InputField {...props} />;
}
