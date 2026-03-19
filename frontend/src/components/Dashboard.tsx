"use client";

import { useAccount } from "wagmi";

export function Dashboard() {
  const { isConnected, address } = useAccount();

  if (!isConnected) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl mb-4">👀</div>
        <div className="text-white/50 text-sm">Connect your wallet to view positions</div>
      </div>
    );
  }

  // Placeholder data — in production, reads from contracts
  const positions = [
    {
      market: "vDOT",
      icon: "⚛️",
      pt: "0",
      yt: "0",
      lp: "0",
      claimable: "0",
      color: "#E6007A",
    },
    {
      market: "aUSDT",
      icon: "💵",
      pt: "0",
      yt: "0",
      lp: "0",
      claimable: "0",
      color: "#26A17B",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg">Your Positions</h2>
        <div className="text-xs text-white/30 font-display">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      </div>

      {/* Position cards */}
      {positions.map((pos) => (
        <div key={pos.market} className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">{pos.icon}</span>
            <span className="font-semibold text-sm">{pos.market} Market</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <PositionStat label={`PT-${pos.market}`} value={pos.pt} color="#00ff88" />
            <PositionStat label={`YT-${pos.market}`} value={pos.yt} color="#ff6b35" />
            <PositionStat label="LP Tokens" value={pos.lp} color="#a855f7" />
          </div>

          {parseFloat(pos.claimable) > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-fission-accent/5 border border-fission-accent/15">
              <div>
                <div className="text-xs text-white/40">Claimable Yield</div>
                <div className="text-sm font-display font-bold text-fission-accent">
                  {pos.claimable} {pos.market}
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-fission-accent/15 text-fission-accent text-xs font-semibold hover:bg-fission-accent/25 transition-all">
                Claim
              </button>
            </div>
          )}

          {parseFloat(pos.pt) === 0 && parseFloat(pos.yt) === 0 && parseFloat(pos.lp) === 0 && (
            <div className="text-center text-white/20 text-xs py-2">
              No positions yet — split some {pos.market} to get started
            </div>
          )}
        </div>
      ))}

      {/* Quick actions */}
      <div className="glass-card p-5">
        <div className="text-xs text-white/30 font-medium mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 gap-2">
          <QuickAction label="Merge PT+YT" desc="Recombine to asset" />
          <QuickAction label="Redeem PT" desc="After maturity" />
          <QuickAction label="Claim Yield" desc="From YT holdings" />
          <QuickAction label="Remove LP" desc="Exit liquidity" />
        </div>
      </div>
    </div>
  );
}

function PositionStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] text-white/30">{label}</div>
      <div className="text-sm font-display font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function QuickAction({ label, desc }: { label: string; desc: string }) {
  return (
    <button className="p-3 rounded-lg bg-fission-surface border border-fission-border text-left hover:border-white/10 transition-all">
      <div className="text-xs font-semibold text-white/70">{label}</div>
      <div className="text-[10px] text-white/25 mt-0.5">{desc}</div>
    </button>
  );
}
