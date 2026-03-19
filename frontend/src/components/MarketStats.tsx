"use client";

import { MarketMeta } from "@/config/contracts";

interface MarketStatsProps {
  market: MarketMeta;
}

export function MarketStats({ market }: MarketStatsProps) {
  // In production, these would be read from contracts
  const stats = {
    ptPrice: "0.988",
    ytPrice: "0.012",
    impliedRate: market.id === "vDOT" ? "14.8%" : "7.9%",
    tvl: market.id === "vDOT" ? "10,000" : "10,000",
    maturity: "Apr 07, 2026",
    daysLeft: "30",
    exchangeRate: market.id === "vDOT" ? "1.100" : "1.020",
    lpApy: market.id === "vDOT" ? "18.2%" : "11.4%",
  };

  return (
    <div className="space-y-4">
      {/* Implied Rate Card */}
      <div className="glass-card p-5">
        <div className="text-xs text-white/30 font-medium mb-3">Implied Rate</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-fission-accent">
            {stats.impliedRate}
          </span>
          <span className="text-xs text-white/30">APY</span>
        </div>
        <div className="text-[10px] text-white/20 mt-1">
          Fixed yield if buying PT now
        </div>
      </div>

      {/* Token Prices */}
      <div className="glass-card p-5">
        <div className="text-xs text-white/30 font-medium mb-3">Token Prices</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fission-pt" />
              <span className="text-sm text-white/60">PT-{market.asset}</span>
            </div>
            <span className="font-display font-bold text-sm">{stats.ptPrice}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-fission-yt" />
              <span className="text-sm text-white/60">YT-{market.asset}</span>
            </div>
            <span className="font-display font-bold text-sm">{stats.ytPrice}</span>
          </div>
        </div>
      </div>

      {/* Market Info */}
      <div className="glass-card p-5">
        <div className="text-xs text-white/30 font-medium mb-3">Market Info</div>
        <div className="space-y-2.5">
          <InfoRow label="TVL" value={`${stats.tvl} ${market.asset}`} />
          <InfoRow label="Maturity" value={stats.maturity} />
          <InfoRow label="Days Left" value={stats.daysLeft} highlight />
          <InfoRow label={`${market.asset} Rate`} value={`${stats.exchangeRate} ${market.underlying}`} />
          <InfoRow label="LP APY" value={stats.lpApy} highlight />
        </div>
      </div>

      {/* Faucet (testnet) */}
      <div className="glass-card p-5 border-dashed border-fission-accent/20">
        <div className="text-xs text-fission-accent/60 font-medium mb-2">🧪 Testnet</div>
        <p className="text-[11px] text-white/30 leading-relaxed mb-3">
          Mint test tokens to try the protocol. Mock {market.asset} accrues yield automatically.
        </p>
        <button className="w-full py-2.5 rounded-lg bg-fission-accent/10 border border-fission-accent/20 text-fission-accent text-xs font-semibold hover:bg-fission-accent/15 transition-all">
          Mint 1000 {market.asset}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/30">{label}</span>
      <span className={`text-xs font-display ${highlight ? "text-fission-accent" : "text-white/60"}`}>
        {value}
      </span>
    </div>
  );
}
