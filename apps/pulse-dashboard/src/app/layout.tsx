import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse Dashboard",
  description:
    "Read-only viewer over docs/pulse/ and .pulse/. Specs, ADRs, DB models, API design, design system, and the override audit log — one screen.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
