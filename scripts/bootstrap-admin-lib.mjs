export function normalizeBootstrapIdentifier(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized || normalized.length > 254) {
    throw new Error("Debes indicar un username o email válido.");
  }
  return normalized;
}
