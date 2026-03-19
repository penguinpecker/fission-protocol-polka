"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Navbar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const links = ["markets", "trade", "dashboard"];

  return (
    <nav className="fixed top-0 w-full z-50 border-b shadow-lg" style={{ background: "rgba(19,19,24,0.6)", backdropFilter: "blur(20px)", borderColor: "rgba(0,255,136,0.15)", boxShadow: "0 0 20px rgba(0,255,136,0.05)" }}>
      <div className="flex justify-between items-center px-6 py-4 max-w-[1440px] mx-auto">
        <button onClick={() => setPage("markets")} className="text-xl font-bold text-fission-green flex items-center gap-2 font-headline tracking-tighter">
          <span className="w-3 h-3 rounded-full bg-fission-green" />
          Fission Protocol
        </button>
        <div className="hidden md:flex items-center gap-8 font-label uppercase tracking-wider text-xs">
          {links.map((l) => (
            <button key={l} onClick={() => setPage(l)} className={`pb-1 transition-colors ${page === l ? "text-fission-green border-b-2 border-fission-green" : "text-slate-400 hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-fission-surface-high border border-fission-outline-var/30 text-xs font-label uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-fission-green animate-pulse" />
            Polkadot Hub
          </div>
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <button
                  onClick={connected ? openAccountModal : openConnectModal}
                  className={`px-5 py-2 font-label font-bold text-xs uppercase tracking-widest transition-all ${connected ? "frosted-console border border-fission-outline-var/30 text-fission-on-surface" : "bg-fission-green text-fission-on-primary pulse-glow hover:brightness-110"}`}
                >
                  {connected ? account.displayName : "Connect Wallet"}
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  );
}
