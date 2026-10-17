import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { LogoDefs } from "@/components/ui/logo-defs";
import { themeInitScript } from "@/lib/theme";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MiColección",
  description: "Catálogo maestro de álbumes, páginas y láminas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="min-h-screen bg-background text-content antialiased">
        {/* DESIGN v2 §14: the logo symbol and its gradients are declared
            exactly once per document, here, so every `<Logo>` anywhere in the
            tree can resolve `<use href="#mark"/>`. */}
        <LogoDefs />
        {children}
      </body>
    </html>
  );
}
