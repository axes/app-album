import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Album",
  description: "M0 foundation: authentication skeleton",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
