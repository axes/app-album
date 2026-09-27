import type { Progress } from "@/lib/collection/service";

export function ProgressSummary({ progress, detailed = false }: { progress: Progress; detailed?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium tabular-nums">
        {progress.owned} / {progress.total} láminas · {progress.percentage}%
      </p>
      <div
        aria-label={`${progress.percentage}% completado`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progress.percentage}
        className="h-2 overflow-hidden rounded bg-surface-muted"
        role="progressbar"
      >
        <div className="h-full bg-success" style={{ width: `${progress.percentage}%` }} />
      </div>
      {detailed ? (
        <p className="text-sm text-muted">
          {progress.missing} faltantes · {progress.duplicates} repetidas
        </p>
      ) : null}
    </div>
  );
}
