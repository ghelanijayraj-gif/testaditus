import type { Metadata, Viewport } from "next";
import { fontVars } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ADITUS", template: "%s · ADITUS" },
  description: "ADITUS assessment and training portal",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={fontVars}>
      <body>{children}</body>
    </html>
  );
}
