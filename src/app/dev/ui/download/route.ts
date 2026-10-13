import { notFound } from "next/navigation";
import { buildReferenceZip, PACKAGE_FILENAME } from "../../../../../scripts/build-ui-reference.ts";

/**
 * `GET /dev/ui/download` — UI-04A.1.
 *
 * Streams the same ZIP that `npm run ui:export` produces to `artifacts/`.
 * The handler is fail-closed in the same way as `/dev/ui`: it is only
 * available when `NODE_ENV === "development"` or `VERCEL_ENV === "preview"`,
 * and returns `notFound()` everywhere else (including production).
 *
 * The body is generated on demand from the in-memory `buildReferencePackage()`
 * output. No file is read from disk at request time, so the response is
 * deterministic and contains no environment data.
 */

export const dynamic = "force-dynamic";

export function GET(): Response {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isPreview = process.env.VERCEL_ENV === "preview";
  if (!isDevelopment && !isPreview) {
    notFound();
  }

  const body = buildReferenceZip();
  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-length": String(body.length),
      "content-disposition": `attachment; filename="${PACKAGE_FILENAME}"`,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
