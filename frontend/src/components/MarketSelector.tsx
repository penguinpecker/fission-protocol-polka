"use client";

import { MARKETS, MarketMeta } from "@/config/contracts";

interface MarketSelectorProps {
  selected: MarketMeta;
  onSelect: (m: MarketMeta) => void;
}

export function MarketSelector({ selected, onSelect }: MarketSelectorProps) {
  return (
    <div className="flex gap-3">
      {MARKETS.map((market) => {
        const isActive = market.id === selected.id;
        return (
          <button
            key={market.id}
            onClick={() => onSelect(market)}
            className={`flex-1 p-4 rounded-xl border transition-all duration-200 ${
              isActive
                ? "border-fission-accent/40 bg-fission-accent/5 shadow-lg shadow-fission-accent/5"
                : "border-fission-border bg-fission-surface/50 hover:border-white/10 hover:bg-fission-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{market.icon}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">
                  <span className={isActive ? "text-fission-accent" : "text-white/80"}>
                    {market.asset}
                  </span>
                </div>
                <div className="text-xs text-white/40 mt-0.5">{market.underlying} yield</div>
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span
                className="text-xl font-display font-bold"
                style={{ color: isActive ? "#00ff88" : market.color }}
              >
                {market.apy}
              </span>
              <span className="text-xs text-white/30">APY</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
