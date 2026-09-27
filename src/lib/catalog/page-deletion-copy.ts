/**
 * User-facing copy for page deletion.
 *
 * Kept in its own dependency-free module so client components can import the
 * confirmation text without pulling the catalog service (and zod) into the
 * browser bundle.
 */
export function pageDeletionConfirmation(pageName: string, stickerCount: number): string {
  if (stickerCount <= 0) {
    return `¿Eliminar la página vacía "${pageName}"?`;
  }
  const noun = stickerCount === 1 ? "lámina" : "láminas";
  const verb = stickerCount === 1 ? "pasará" : "pasarán";
  const article = stickerCount === 1 ? "la" : "las";
  return (
    `Esta página contiene ${stickerCount} ${noun}. ` +
    `Si la eliminas, ${article} ${noun} ${verb} a "Sin página asignada".\n\n` +
    `¿Eliminar la página "${pageName}"?`
  );
}
