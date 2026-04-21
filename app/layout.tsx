import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LBB Hot Lunch | Medina Academy",
  description: "Hot lunch preorders for Medina Academy by Local Bigger Burger.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#15803d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
