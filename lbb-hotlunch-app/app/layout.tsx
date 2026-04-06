import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LBB Hot Lunch | Medina Academy",
  description: "Hot lunch preorders for Medina Academy by Local Bigger Burger.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
