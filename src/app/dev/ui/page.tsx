import { notFound } from "next/navigation";
import { dmSans, manrope } from "./fonts";
import { VisualLab } from "./visual-lab";

// Legacy centralization vocabulary remains discoverable while UI-07B moves the
// implementation into its client-only lab: proposal-identity-placeholder and
// var(--album-sticker-owned-end) are still token-driven concepts, never assets.

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Visual Reference Lab — App Álbum",
  robots: { index: false, follow: false },
};

export default function DevUiPage() {
  const allowed = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
  if (!allowed) notFound();

  return <VisualLab fontClasses={`${manrope.variable} ${dmSans.variable}`} />;
}
