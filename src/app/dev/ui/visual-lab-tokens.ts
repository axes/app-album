import {
  colorTokens,
  cssNameByColorToken,
  proposalColorTokens,
  semanticColorKeys,
  type SemanticColorTokens,
  type ThemeName,
} from "../../../../scripts/ui-tokens";

export type LabDirection = "current" | "candidate";
export type LabTypography = "manrope" | "editorial";

const candidateDarkOverrides: Partial<Record<keyof SemanticColorTokens, string>> = {
  background: "#111013",
  surface: "#242228",
  surfaceSoft: "#302737",
  input: "#242228",
  border: "#5f5366",
  inputBorder: "#756779",
};

export function labTokenVariables(direction: LabDirection, theme: ThemeName): string {
  const source = direction === "current" ? colorTokens : proposalColorTokens;
  return semanticColorKeys
    .map((key) => {
      const candidateOverride = direction === "candidate" && theme === "dark"
        ? candidateDarkOverrides[key]
        : undefined;
      return `--album-${cssNameByColorToken[key]}:${candidateOverride ?? source[key][theme]};`;
    })
    .join("");
}

export function labTokenValue(
  direction: LabDirection,
  theme: ThemeName,
  key: keyof SemanticColorTokens,
): string {
  if (direction === "candidate" && theme === "dark" && candidateDarkOverrides[key]) {
    return candidateDarkOverrides[key] as string;
  }
  return (direction === "current" ? colorTokens : proposalColorTokens)[key][theme];
}
