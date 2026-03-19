"use client";

import { useState } from "react";
import { Hero } from "@/components/Hero";
import { MarketSelector } from "@/components/MarketSelector";
import { ActionPanel } from "@/components/ActionPanel";
import { MarketStats } from "@/components/MarketStats";
import { Dashboard } from "@/components/Dashboard";
import { MARKETS, MarketMeta } from "@/config/contracts";

export default function Home() {
  const [selectedMarket, setSelectedMarket] = useState<MarketMeta>(MARKETS[0]);
  const [view, setView] = useState<"trade" | "dashboard">("trade");

  return (
    <div>
      <Hero />

      {/* View Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-fission-surface border border-fission-border rounded-xl p-1">
          <button
            onClick={() => setView("trade")}
            className={`tab-btn ${view === "trade" ? "active" : ""}`}
          >
            Trade
          </button>
          <button
            onClick={() => setView("dashboard")}
            className={`tab-btn ${view === "dashboard" ? "active" : ""}`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {view === "trade" ? (
        <>
          {/* Market Selector */}
          <div className="mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <MarketSelector selected={selectedMarket} onSelect={setSelectedMarket} />
          </div>

          {/* Main Layout: Action Panel + Stats */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="lg:col-span-2">
              <ActionPanel market={selectedMarket} />
            </div>
            <div>
              <MarketStats market={selectedMarket} />
            </div>
          </div>
        </>
      ) : (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <Dashboard />
        </div>
      )}

      {/* Integration badges */}
      <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <div className="text-xs text-white/15 mb-4">Powered by Polkadot-native integrations</div>
        <div className="flex justify-center gap-4 flex-wrap">
          {[
            "XCM Precompile",
            "Bifrost SLPx",
            "Hyperbridge",
            "0xGasless",
            "Dual VM (EVM+PVM)",
            "Native Assets",
          ].map((name) => (
            <span
              key={name}
              className="px-3 py-1.5 rounded-lg bg-fission-surface/50 border border-fission-border/50 text-[10px] text-white/25 font-display"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
