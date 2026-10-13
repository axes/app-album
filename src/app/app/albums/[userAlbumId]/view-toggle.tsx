"use client";

export type ViewMode = "grid" | "list";

export function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (value: ViewMode) => void }) {
  const option = (mode: ViewMode, label: string) => (
    <button
      aria-pressed={value === mode}
      className={`min-h-11 rounded-control px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 ${value === mode ? "bg-primary text-primary-text" : "text-content hover:bg-surface-muted"}`}
      onClick={() => onChange(mode)}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div aria-label="Vista de láminas" className="inline-flex rounded-control border border-border bg-surface p-1" role="group">
      {option("grid", "▦ Mosaico")}
      {option("list", "☷ Lista")}
    </div>
  );
}
