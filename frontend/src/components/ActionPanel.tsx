"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { MarketMeta } from "@/config/contracts";

type ActionTab = "split" | "fixed" | "yield" | "earn";

interface ActionPanelProps {
  market: MarketMeta;
}

export function ActionPanel({ market }: ActionPanelProps) {
  const { isConnected } = useAccount();
  const [tab, setTab] = useState<ActionTab>("split");
  const [amount, setAmount] = useState("");

  const tabs: { id: ActionTab; label: string; desc: string; color: string }[] = [
    { id: "split", label: "Split", desc: "Get PT + YT", color: "#00ff88" },
    { id: "fixed", label: "Fixed Yield", desc: "Buy PT only", color: "#3b82f6" },
    { id: "yield", label: "Long Yield", desc: "Buy YT only", color: "#ff6b35" },
    { id: "earn", label: "Earn", desc: "LP for fees", color: "#a855f7" },
  ];

  const activeTab = tabs.find((t) => t.id === tab)!;

  return (
    <div className="glass-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-fission-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-4 px-2 text-center transition-all relative ${
              tab === t.id ? "text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            <div className="text-sm font-semibold">{t.label}</div>
            <div className="text-[10px] mt-0.5 opacity-60">{t.desc}</div>
            {tab === t.id && (
              <div
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                style={{ background: t.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Info banner */}
        <div
          className="rounded-xl p-4 mb-6 border"
          style={{
            background: `${activeTab.color}08`,
            borderColor: `${activeTab.color}20`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: `${activeTab.color}15`, color: activeTab.color }}
            >
              {tab === "split" ? "⚛" : tab === "fixed" ? "🛡" : tab === "yield" ? "🔥" : "💎"}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: activeTab.color }}>
                {tab === "split" && "Split into PT + YT"}
                {tab === "fixed" && "Lock in Fixed Rate"}
                {tab === "yield" && "Speculate on Yield"}
                {tab === "earn" && "Earn Swap Fees"}
              </div>
              <div className="text-xs text-white/40 mt-1 leading-relaxed">
                {tab === "split" &&
                  `Deposit ${market.asset} → receive equal PT-${market.asset} + YT-${market.asset}. PT redeemable 1:1 at maturity, YT receives all streaming yield.`}
                {tab === "fixed" &&
                  `Buy discounted PT-${market.asset}. At maturity, redeem 1:1 for ${market.asset}. The discount IS your fixed yield — guaranteed regardless of rate changes.`}
                {tab === "yield" &&
                  `Buy YT-${market.asset} to receive ALL streaming ${market.underlying} staking yield. If rates go up, your YT becomes more valuable. High risk, high reward.`}
                {tab === "earn" &&
                  `Provide liquidity to the PT/${market.asset} pool. Earn swap fees from traders. One-click: deposit ${market.asset} → auto-split → LP.`}
              </div>
            </div>
          </div>
        </div>

        {/* Amount input */}
        <div className="mb-4">
          <label className="text-xs text-white/40 font-medium mb-2 block">
            Amount ({market.asset})
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="glow-input w-full bg-fission-surface border border-fission-border rounded-xl px-4 py-4 text-xl font-display text-white placeholder:text-white/15 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => setAmount("100")}
                className="text-[10px] font-bold text-fission-accent/60 hover:text-fission-accent bg-fission-accent/10 px-2 py-1 rounded-md transition-all"
              >
                MAX
              </button>
              <span className="text-sm text-white/30 font-display">{market.asset}</span>
            </div>
          </div>
        </div>

        {/* Output preview */}
        <div className="bg-fission-bg/60 rounded-xl p-4 mb-6 space-y-3">
          <div className="text-xs text-white/30 font-medium">You receive</div>
          {tab === "split" && (
            <>
              <OutputRow label={`PT-${market.asset}`} value={amount || "0"} color="#00ff88" />
              <div className="text-center text-white/20 text-xs">+</div>
              <OutputRow label={`YT-${market.asset}`} value={amount || "0"} color="#ff6b35" />
            </>
          )}
          {tab === "fixed" && (
            <OutputRow
              label={`PT-${market.asset}`}
              value={amount ? (parseFloat(amount) * 1.012).toFixed(3) : "0"}
              color="#3b82f6"
              sublabel="Fixed yield at maturity"
            />
          )}
          {tab === "yield" && (
            <OutputRow
              label={`YT-${market.asset}`}
              value={amount ? (parseFloat(amount) * 0.985).toFixed(3) : "0"}
              color="#ff6b35"
              sublabel="Streaming yield exposure"
            />
          )}
          {tab === "earn" && (
            <OutputRow
              label="LP Tokens"
              value={amount ? (parseFloat(amount) * 0.498).toFixed(3) : "0"}
              color="#a855f7"
              sublabel="Earning swap fees"
            />
          )}
        </div>

        {/* Action button */}
        <button
          disabled={!isConnected || !amount || parseFloat(amount) <= 0}
          className="btn-accent w-full text-center"
          style={{
            background: isConnected
              ? `linear-gradient(135deg, ${activeTab.color} 0%, ${activeTab.color}cc 100%)`
              : undefined,
          }}
        >
          {!isConnected
            ? "Connect Wallet"
            : !amount || parseFloat(amount) <= 0
            ? "Enter Amount"
            : tab === "split"
            ? `Split ${amount} ${market.asset}`
            : tab === "fixed"
            ? `Get Fixed Yield`
            : tab === "yield"
            ? `Long Yield`
            : `Add Liquidity`}
        </button>

        {/* Tx details */}
        {amount && parseFloat(amount) > 0 && (
          <div className="mt-4 space-y-2 text-xs text-white/30">
            <div className="flex justify-between">
              <span>Slippage tolerance</span>
              <span className="text-white/50">0.5%</span>
            </div>
            <div className="flex justify-between">
              <span>Protocol fee</span>
              <span className="text-white/50">0.3%</span>
            </div>
            <div className="flex justify-between">
              <span>Network</span>
              <span className="text-fission-accent/60 font-display">Polkadot Hub</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OutputRow({
  label,
  value,
  color,
  sublabel,
}: {
  label: string;
  value: string;
  color: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium" style={{ color }}>
          {label}
        </div>
        {sublabel && <div className="text-[10px] text-white/25 mt-0.5">{sublabel}</div>}
      </div>
      <div className="text-right">
        <div className="text-lg font-display font-bold text-white/90">{value}</div>
      </div>
    </div>
  );
}
