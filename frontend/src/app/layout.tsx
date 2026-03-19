import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Fission Protocol — Yield Tokenization for Polkadot Hub",
  description: "Split yield-bearing assets into Principal Tokens + Yield Tokens. Trade fixed rates and speculate on yields.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="mesh-gradient" />
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
