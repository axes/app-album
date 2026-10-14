import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

/**
 * UI-06A — route-level loading boundary for `/admin/albums` and `/admin/users`.
 *
 * Both routes render a `PageHeader` followed by a bordered table, so one
 * boundary covers them. The column widths mirror the real tables closely enough
 * that the swap to real rows does not reflow the page.
 *
 * `/admin/albums/new` also inherits this boundary, but its page component is
 * synchronous and never suspends, so the fallback is not painted there.
 */
const ROW_COUNT = 8;

export default function AdminLoading() {
  return (
    <LoadingRegion label="Cargando la administración">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="overflow-x-auto rounded border border-border bg-surface">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2"><Skeleton className="h-4 w-24" /></th>
                <th className="p-2"><Skeleton className="h-4 w-20" /></th>
                <th className="p-2"><Skeleton className="h-4 w-28" /></th>
                <th className="p-2"><Skeleton className="h-4 w-16" /></th>
                <th className="p-2"><Skeleton className="h-4 w-16" /></th>
                <th className="p-2"><Skeleton className="h-4 w-20" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, index) => (
                <tr className="border-b border-border last:border-b-0" key={index}>
                  <td className="p-2"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-10" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-10" /></td>
                  <td className="p-2"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </LoadingRegion>
  );
}
