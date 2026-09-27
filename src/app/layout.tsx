import type { Metadata } from "next";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "App Album",
  description: "Catálogo maestro de álbumes, páginas y láminas",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="min-h-screen bg-background text-content antialiased">
        <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-4">
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-4">
          {children}
        </main>
      </body>
    </html>
  );
}
