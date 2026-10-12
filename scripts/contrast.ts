import { proposalColorTokens } from "./ui-tokens.ts";

export type ContrastPair = {
  name: string;
  fg: string;
  bg: string;
  min?: number;
};

export function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHexColor(hex);
  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

export function wcagRatio(fg: string, bg: string): number {
  const foreground = relativeLuminance(fg);
  const background = relativeLuminance(bg);
  return (Math.max(foreground, background) + 0.05) /
    (Math.min(foreground, background) + 0.05);
}

export function meetsMinRatio(fg: string, bg: string, min = 4.5): boolean {
  return wcagRatio(fg, bg) >= min;
}

export function assertMinRatio(pairs: ContrastPair[], min = 4.5): void {
  const failures = pairs.flatMap((pair) => {
    const threshold = pair.min ?? min;
    const ratio = wcagRatio(pair.fg, pair.bg);
    return ratio < threshold
      ? [`${pair.name}: ${pair.fg} on ${pair.bg} = ${ratio.toFixed(2)}:1 < ${threshold}:1`]
      : [];
  });
  if (failures.length > 0) {
    throw new Error(`WCAG contrast failures:\n${failures.join("\n")}`);
  }
}

export function buildProposalContrastPairs(): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  for (const theme of ["light", "dark"] as const) {
    const token = (key: keyof typeof proposalColorTokens) =>
      proposalColorTokens[key][theme];
    pairs.push(
      { name: `${theme} foreground/background`, fg: token("foreground"), bg: token("background") },
      { name: `${theme} foreground/surface`, fg: token("foreground"), bg: token("surface") },
      { name: `${theme} foreground-muted/surface-soft`, fg: token("foregroundMuted"), bg: token("surfaceSoft") },
      { name: `${theme} primary-foreground/primary`, fg: token("primaryForeground"), bg: token("primary") },
      { name: `${theme} secondary-foreground/secondary`, fg: token("secondaryForeground"), bg: token("secondary") },
      { name: `${theme} accent-foreground/accent`, fg: token("accentForeground"), bg: token("accent") },
      { name: `${theme} success-foreground/success`, fg: token("successForeground"), bg: token("success") },
      { name: `${theme} warning-foreground/warning`, fg: token("warningForeground"), bg: token("warning") },
      { name: `${theme} danger-foreground/danger`, fg: token("dangerForeground"), bg: token("danger") },
      { name: `${theme} primary/background`, fg: token("primary"), bg: token("background") },
      { name: `${theme} focus/background`, fg: token("focus"), bg: token("background"), min: 3 },
      { name: `${theme} sticker-owned/surface`, fg: token("stickerOwned"), bg: token("surface"), min: 3 },
      { name: `${theme} sticker-missing/surface`, fg: token("stickerMissing"), bg: token("surface"), min: 3 },
      { name: `${theme} sticker-duplicate/surface`, fg: token("stickerDuplicate"), bg: token("surface"), min: 3 },
      { name: `${theme} sticker-special/surface`, fg: token("stickerSpecial"), bg: token("surface"), min: 3 },
    );
  }
  return pairs;
}
