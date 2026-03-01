import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ChangelogKit — Embeddable Changelog Widget", description: "Show product updates inside your app." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body className="bg-gray-950 text-gray-100 antialiased">{children}</body></html>);
}
