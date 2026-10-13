import type { Progress } from "@/lib/collection/service";
import { AlbumProgress, deriveProgressState } from "@/components/albums/album-progress";

/**
 * UI-05B: progress block consumed by the migrated `/app` page.
 *
 * The public API `{ progress, detailed }` is preserved (consumed by
 * other productive surfaces outside this phase), but the internals now
 * delegate to the token-driven `<AlbumProgress>`. The exposed
 * `deriveProgressState` helper keeps parity with the one shipped by
 * the same module for downstream callers.
 */
export function ProgressSummary({ progress, detailed = false }: { progress: Progress; detailed?: boolean }) {
  return <AlbumProgress progress={progress} detailed={detailed} />;
}

export { deriveProgressState };