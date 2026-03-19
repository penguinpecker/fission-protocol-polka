"use client";

import { useAccount } from "wagmi";
import { useTokenBalances, useFissionActions, useMarketData } from "@/hooks/useFission";

export function DashboardPage() {
  const { address, isConnected } = useAccount();
  const vdotBal = useTokenBalances("vDOT");
  const ausdtBal = useTokenBalances("aUSDT");
  const vdotData = useMarketData("vDOT");
  const ausdtData = useMarketData("aUSDT");
  const actions = useFissionActions();

  if (!isConnected) {
    return (
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto text-center">
        <div className="frosted-console border border-fission-outline-var/15 p-16">
          <div className="text-5xl mb-6">👀</div>
          <h2 className="text-2xl font-headline font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-slate-400">Connect your wallet to view your Fission Protocol positions.</p>
        </div>
      </div>
    );
  }

  const totalClaimable = parseFloat(vdotBal.claimableYield) + parseFloat(ausdtBal.claimableYield);

  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-headline font-bold mb-2">Portfolio</h1>
          <p className="text-slate-400">Real-time surveillance of your yield assets across the Polkadot ecosystem.</p>
        </div>
        <div className="p-6 text-center frosted-console border border-fission-outline-var/15 min-w-[280px]">
          <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-2">Total Claimable Yield</div>
          <div className="text-3xl font-headline font-bold text-fission-green mb-4">{totalClaimable.toFixed(4)}</div>
          <button onClick={() => actions.claimYield("vDOT")} disabled={totalClaimable <= 0 || actions.isPending} className="w-full py-3 bg-fission-green text-fission-on-primary font-label font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all disabled:opacity-40">
            {actions.isPending ? "Claiming..." : "Claim All Yield"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12">
        <div className="p-6 bg-fission-surface-low border border-fission-outline-var/10">
          <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest block mb-2">Wallet</span>
          <span className="text-sm font-label text-fission-on-surface">{address?.slice(0, 8)}...{address?.slice(-6)}</span>
        </div>
        <div className="p-6 bg-fission-surface-low border border-fission-outline-var/10">
          <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest block mb-2">Active Positions</span>
          <span className="text-2xl font-headline font-bold">
            {[vdotBal.ptBalance, vdotBal.ytBalance, ausdtBal.ptBalance, ausdtBal.ytBalance].filter((b) => parseFloat(b) > 0).length}
          </span>
        </div>
        <div className="p-6 bg-fission-surface-low border border-fission-outline-var/10">
          <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest block mb-2">Implied APY (vDOT)</span>
          <span className="text-2xl font-headline font-bold text-fission-green">{vdotData.impliedRate}%</span>
        </div>
      </div>

      {/* vDOT Positions */}
      <PositionTable
        market="vDOT"
        sub="Maturity: Apr 19, 2026 • Settlement: Polkadot Hub"
        balances={vdotBal}
        onClaim={() => actions.claimYield("vDOT")}
        isPending={actions.isPending}
      />

      {/* aUSDT Positions */}
      <PositionTable
        market="aUSDT"
        sub="Maturity: Apr 19, 2026 • Settlement: Hydration"
        balances={ausdtBal}
        onClaim={() => actions.claimYield("aUSDT")}
        isPending={actions.isPending}
      />

      {/* Tx Hash */}
      {actions.hash && (
        <div className="mt-8 text-center">
          <a href={`https://blockscout.polkadot.io/tx/${actions.hash}`} target="_blank" className="text-xs font-label text-fission-green/60 hover:text-fission-green underline">
            View Transaction on Blockscout →
          </a>
        </div>
      )}
    </div>
  );
}

function PositionTable({ market, sub, balances, onClaim, isPending }: {
  market: string; sub: string;
  balances: { assetBalance: string; ptBalance: string; ytBalance: string; claimableYield: string };
  onClaim: () => void; isPending: boolean;
}) {
  const hasPositions = parseFloat(balances.ptBalance) > 0 || parseFloat(balances.ytBalance) > 0;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xl">{market === "vDOT" ? "⚛️" : "💵"}</span>
        <div>
          <h3 className="font-headline font-bold text-lg">{market} Market</h3>
          <span className="text-[10px] font-label text-slate-500">{sub}</span>
        </div>
      </div>

      <div className="overflow-hidden border border-fission-outline-var/15">
        <div className="grid grid-cols-5 gap-4 p-4 text-[10px] font-label text-slate-500 uppercase tracking-widest bg-fission-surface-low">
          <span>Asset Type</span><span>Balance</span><span>Token</span><span>Yield</span><span>Actions</span>
        </div>

        {/* Asset Balance */}
        <Row label={market} sub="UNDERLYING" balance={balances.assetBalance} token={market} yield_="" color="#64748b" actions={[]} />

        {/* PT */}
        <Row label={`PT-${market}`} sub="PRINCIPAL TOKEN" balance={balances.ptBalance} token={`PT-${market}`} yield_="Fixed" color="#00ff88" actions={[{ label: "REDEEM", disabled: true }]} />

        {/* YT */}
        <Row label={`YT-${market}`} sub="YIELD TOKEN" balance={balances.ytBalance} token={`YT-${market}`}
          yield_={parseFloat(balances.claimableYield) > 0 ? `+${parseFloat(balances.claimableYield).toFixed(4)}` : "0"}
          color="#ff6b35"
          actions={[
            { label: "CLAIM", onClick: onClaim, highlight: true, disabled: isPending || parseFloat(balances.claimableYield) <= 0 },
          ]}
        />

        {!hasPositions && (
          <div className="p-6 text-center text-slate-500 text-xs font-label">
            No positions yet — split some {market} on the Trade page to get started
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, sub, balance, token, yield_, color, actions }: {
  label: string; sub: string; balance: string; token: string; yield_: string; color: string;
  actions: { label: string; onClick?: () => void; highlight?: boolean; disabled?: boolean }[];
}) {
  return (
    <div className="grid grid-cols-5 gap-4 p-4 items-center border-t border-fission-outline-var/10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 rounded-sm" style={{ background: color }} />
        <div>
          <div className="font-headline font-bold text-sm">{label}</div>
          <div className="text-[9px] font-label uppercase" style={{ color }}>{sub}</div>
        </div>
      </div>
      <span className="font-label text-sm">{parseFloat(balance).toFixed(2)}</span>
      <span className="font-label text-xs bg-fission-surface-highest px-2 py-1 inline-block w-fit">{token}</span>
      <span className="font-label text-sm" style={{ color: yield_.startsWith("+") ? "#00ff88" : "#64748b" }}>{yield_}</span>
      <div className="flex gap-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.onClick} disabled={a.disabled}
            className="px-3 py-1 text-[10px] font-label uppercase tracking-wider transition-all hover:brightness-125 disabled:opacity-30"
            style={{ border: `1px solid ${a.highlight ? "#00ff88" : "rgba(59,75,61,0.3)"}`, color: a.highlight ? "#00ff88" : "#e4e1e9", background: a.highlight ? "rgba(0,255,136,0.1)" : "transparent" }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
