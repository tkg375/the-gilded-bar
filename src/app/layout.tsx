import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import StorefrontShell from "@/components/StorefrontShell";

const fizzo = localFont({
  src: [
    { path: "./fonts/FizzoRegular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/FizzoMedium.ttf",  weight: "500", style: "normal" },
    { path: "./fonts/FizzoHeavy.ttf",   weight: "700", style: "normal" },
  ],
  variable: "--font-fizzo",
  display: "swap",
});

const bubbleBobble = localFont({
  src: "./fonts/BubbleBobble.ttf",
  variable: "--font-bubble",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Georgia Suds — Handcrafted Soaps",
  description: "Small-batch artisan soaps made from natural ingredients.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fizzo.variable} ${bubbleBobble.variable}`}>
      <body className="bg-peach-50 text-peach-900 antialiased">
        <Providers>
          <StorefrontShell>{children}</StorefrontShell>
        </Providers>
      </body>
    </html>
  );
}
