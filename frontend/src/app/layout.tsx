import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Fission Protocol — Yield Tokenization for Polkadot Hub",
  description: "Split yield-bearing assets into Principal Tokens + Yield Tokens on Polkadot Hub.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-fission-green/5 rounded-full blur-[120px] -z-10 translate-x-1/2 translate-y-1/2" />
          <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-fission-orange/5 rounded-full blur-[100px] -z-10 -translate-x-1/2" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
