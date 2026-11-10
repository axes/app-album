import { productiveCanonicalColorTokens } from "./ui-tokens.ts";

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

/**
 * Mixes a foreground colour over a background colour in the sRGB colour space.
 * `foregroundPercent` follows the CSS `color-mix()` percentage contract.
 */
export function mixSrgb(
  foreground: string,
  background: string,
  foregroundPercent: number,
): string {
  if (foregroundPercent < 0 || foregroundPercent > 100) {
    throw new Error("foregroundPercent must be between 0 and 100");
  }

  const foregroundChannels = parseHexColor(foreground);
  const backgroundChannels = parseHexColor(background);
  const foregroundWeight = foregroundPercent / 100;
  const backgroundWeight = 1 - foregroundWeight;
  const channels = foregroundChannels.map((channel, index) =>
    Math.round(
      channel * foregroundWeight +
        backgroundChannels[index] * backgroundWeight,
    ),
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
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
    const token = (key: keyof typeof productiveCanonicalColorTokens) =>
      productiveCanonicalColorTokens[key][theme];
    const selectedRow = mixSrgb(token("primary"), token("surface"), 8);
    const dangerHover = mixSrgb(token("danger"), token("surface"), 12);
    const dangerHoverOnSelectedRow = mixSrgb(
      token("danger"),
      selectedRow,
      12,
    );
    const dangerHoverOnSurfaceSoft = mixSrgb(
      token("danger"),
      token("surfaceSoft"),
      12,
    );

    pairs.push(
      { name: `${theme} text/background`, fg: token("foreground"), bg: token("background") },
      { name: `${theme} text-muted/surface-soft`, fg: token("foregroundMuted"), bg: token("surfaceSoft") },
      { name: `${theme} on/primary`, fg: token("on"), bg: token("primary") },
      { name: `${theme} on/accent`, fg: token("on"), bg: token("accent") },
      { name: `${theme} on/success`, fg: token("on"), bg: token("success") },
      { name: `${theme} on/warning`, fg: token("on"), bg: token("warning") },
      { name: `${theme} on/danger`, fg: token("on"), bg: token("danger") },
      { name: `${theme} primary/background`, fg: token("primary"), bg: token("background") },
      { name: `${theme} focus/background`, fg: token("focus"), bg: token("background"), min: 3 },
      { name: `${theme} input-border/surface`, fg: token("inputBorder"), bg: token("surface"), min: 3 },
      { name: `${theme} white/owned-a`, fg: "#ffffff", bg: token("ownedA") },
      { name: `${theme} special-on/special-a`, fg: token("specialOn"), bg: token("specialA") },
      { name: `${theme} danger/surface`, fg: token("danger"), bg: token("surface") },
      { name: `${theme} danger/hover`, fg: token("danger"), bg: dangerHover },
      { name: `${theme} danger/selected-row`, fg: token("danger"), bg: selectedRow },
      {
        name: `${theme} danger/hover-on-selected-row`,
        fg: token("danger"),
        bg: dangerHoverOnSelectedRow,
      },
      {
        name: `${theme} danger/hover-on-surface-soft`,
        fg: token("danger"),
        bg: dangerHoverOnSurfaceSoft,
      },
    );
  }
  return pairs;
}
