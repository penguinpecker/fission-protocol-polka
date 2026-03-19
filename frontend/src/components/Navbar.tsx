"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-fission-border/50 bg-fission-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fission-accent to-fission-accent-dim flex items-center justify-center text-fission-bg font-bold text-sm font-display">
                ⚛
              </div>
              <div className="absolute inset-0 rounded-full bg-fission-accent/20 animate-pulse-glow" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              <span className="text-fission-accent">Fission</span>
              <span className="text-white/60 ml-1 text-sm font-normal">Protocol</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Markets", href: "/" },
              { label: "Split", href: "/#split" },
              { label: "Trade", href: "/#trade" },
              { label: "Earn", href: "/#earn" },
              { label: "Dashboard", href: "/#dashboard" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/50 hover:text-white/90 rounded-lg hover:bg-white/5 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fission-surface border border-fission-border text-xs font-display">
              <div className="w-2 h-2 rounded-full bg-fission-accent animate-pulse" />
              <span className="text-white/50">Polkadot Hub</span>
            </div>
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <button
                    onClick={connected ? openAccountModal : openConnectModal}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      connected
                        ? "bg-fission-surface border border-fission-border text-white/80 hover:border-fission-accent/30"
                        : "btn-accent"
                    }`}
                  >
                    {connected
                      ? `${account.displayName}`
                      : "Connect Wallet"}
                  </button>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  );
}
