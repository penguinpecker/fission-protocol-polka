"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { useMarketData, useTokenBalances, useFissionActions } from "@/hooks/useFission";

type Tab = "split" | "fixed" | "long" | "earn";
const C = CONTRACTS[420420419];

export function TradePage() {
  const { address, isConnected } = useAccount();
  const [market, setMarket] = useState<"vDOT" | "aUSDT">("vDOT");
  const [tab, setTab] = useState<Tab>("split");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "approve" | "execute">("input");

  const mData = useMarketData(market);
  const balances = useTokenBalances(market);
  const actions = useFissionActions();

  const tabConfig: Record<Tab, { label: string; color: string; btnLabel: string }> = {
    split: { label: "Split", color: "#00ff88", btnLabel: "Split Asset ⚛" },
    fixed: { label: "Fixed Yield", color: "#00ff88", btnLabel: "Lock Fixed Yield 🛡" },
    long: { label: "Long Yield", color: "#ff6b35", btnLabel: "Long Yield 🔥" },
    earn: { label: "Earn", color: "#a855f7", btnLabel: "Add Liquidity 💎" },
  };

  const handleApprove = () => {
    if (!amount || !address) return;
    actions.approveAsset(market, C.router, amount);
    setStep("execute");
  };

  const handleExecute = () => {
    if (!amount) return;
    if (tab === "split") actions.splitFromAsset(market, amount);
    else if (tab === "fixed") actions.splitAndSellYT(market, amount);
    else if (tab === "long") actions.splitAndSellPT(market, amount);
    else actions.addLiquidityFromAsset(market, amount);
  };

  const handleMint = () => {
    if (!address) return;
    actions.mintMockTokens(market, address, "1000");
  };

  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left: Stats */}
      <div className="lg:w-1/3 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fission-green/5 border border-fission-green/10 rounded-full mb-4">
            <span className="w-2 h-2 rounded-full bg-fission-green animate-pulse" />
            <span className="text-[10px] font-label uppercase tracking-widest text-fission-green">Polkadot Hub Mainnet</span>
          </div>
          <h1 className="text-4xl font-headline font-bold mb-4 tracking-tighter">Precision <span className="text-fission-green">Trade</span></h1>
        </div>

        {/* Market Selector */}
        <div className="flex gap-2">
          {(["vDOT", "aUSDT"] as const).map((m) => (
            <button key={m} onClick={() => setMarket(m)} className={`flex-1 py-3 font-label text-xs uppercase tracking-widest transition-all ${market === m ? "bg-fission-green/10 border border-fission-green/20 text-fission-green" : "bg-fission-surface-low border border-fission-outline-var/10 text-slate-500"}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Market Stats */}
        <div className="space-y-4">
          <div className="p-6 bg-fission-surface-low border-l-2 border-fission-green">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-1">Implied Rate</div>
            <div className="text-3xl font-headline font-semibold text-fission-green">{mData.impliedRate}%</div>
          </div>
          <div className="p-6 bg-fission-surface-low border-l-2 border-fission-orange">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-1">PT Price</div>
            <div className="text-xl font-headline font-semibold">{parseFloat(mData.ptPrice).toFixed(4)}</div>
          </div>
          <div className="p-6 bg-fission-surface-low border-l-2 border-fission-purple">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-1">YT Price</div>
            <div className="text-xl font-headline font-semibold text-fission-orange">{parseFloat(mData.ytPrice).toFixed(4)}</div>
          </div>
          <div className="p-6 bg-fission-surface-low border-l-2 border-slate-600">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-[0.2em] mb-1">Time to Maturity</div>
            <div className="text-xl font-headline font-semibold">{Math.floor(mData.timeToMaturity / 86400)}d {Math.floor((mData.timeToMaturity % 86400) / 3600)}h</div>
          </div>
        </div>

        {/* Your Balances */}
        <div className="p-6 bg-fission-surface-low border border-fission-outline-var/10">
          <div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-4">Your Balances</div>
          <div className="space-y-3 text-sm font-label">
            <div className="flex justify-between"><span className="text-slate-500">{market}</span><span>{parseFloat(balances.assetBalance).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-fission-green">PT-{market}</span><span>{parseFloat(balances.ptBalance).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-fission-orange">YT-{market}</span><span>{parseFloat(balances.ytBalance).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-fission-purple">Claimable</span><span>{parseFloat(balances.claimableYield).toFixed(4)}</span></div>
          </div>
        </div>

        {/* Mint Testnet Tokens */}
        <button onClick={handleMint} disabled={!isConnected || actions.isPending} className="w-full py-3 bg-fission-green/10 border border-fission-green/20 text-fission-green text-xs font-label uppercase tracking-widest hover:bg-fission-green/15 transition-all disabled:opacity-40">
          {actions.isPending ? "Minting..." : `Mint 1000 ${market} (Test)`}
        </button>

        {/* Contract Links */}
        <div className="space-y-2 font-label text-[10px] text-slate-500 uppercase tracking-widest">
          <div className="flex justify-between"><span>AMM</span>
            <a href={`https://blockscout.polkadot.io/address/${market === "vDOT" ? C.ammVDOT : C.ammAUSDT}`} target="_blank" className="text-fission-on-surface hover:text-fission-green">
              {(market === "vDOT" ? C.ammVDOT : C.ammAUSDT).slice(0, 8)}...
            </a>
          </div>
        </div>
      </div>

      {/* Right: Trade Console */}
      <div className="lg:w-2/3">
        <div className="frosted-console border border-fission-outline-var/15 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-fission-outline-var/10">
            {(["split", "fixed", "long", "earn"] as Tab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setStep("input"); }} className={`flex-1 py-5 px-4 font-label text-xs uppercase tracking-widest transition-colors ${tab === t ? "border-b-2 bg-opacity-5" : "text-slate-500 hover:text-fission-on-surface"}`} style={{ color: tab === t ? tabConfig[t].color : undefined, borderColor: tab === t ? tabConfig[t].color : "transparent", background: tab === t ? `${tabConfig[t].color}08` : undefined }}>
                {tabConfig[t].label}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12 space-y-8">
            {/* Input */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-label uppercase tracking-widest text-slate-500">Asset Selection</span>
                <span className="text-[10px] font-label text-slate-500">Balance: {parseFloat(balances.assetBalance).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-4 bg-fission-surface-high p-6 rounded-lg border border-transparent focus-within:border-fission-green/30 transition-all">
                <div className="flex items-center gap-3 pr-6 border-r border-fission-outline-var/20">
                  <div className="w-10 h-10 rounded-full bg-fission-green/20 border border-fission-green/40 flex items-center justify-center">⚛</div>
                  <div>
                    <div className="font-headline font-bold text-lg">{market}</div>
                    <div className="text-[10px] font-label text-slate-500">{market === "vDOT" ? "Voucher DOT" : "Aave USDT"}</div>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent border-none text-right font-headline text-3xl font-bold p-0 focus:ring-0 focus:outline-none placeholder:text-fission-surface-highest" placeholder="0.00" />
                  <button onClick={() => setAmount(balances.assetBalance)} className="text-[10px] font-label text-fission-green/60 hover:text-fission-green mt-1">MAX</button>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-fission-surface border border-fission-outline-var/30 flex items-center justify-center rotate-45"><span className="-rotate-45 text-fission-green">↓</span></div>
            </div>

            {/* Output */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-lg bg-fission-surface-low border border-fission-outline-var/10">
                <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-4">Receive PT</div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-headline font-bold">{amount ? (tab === "fixed" ? (parseFloat(amount) * 1.012).toFixed(2) : parseFloat(amount).toFixed(2)) : "0.00"}</span>
                  <span className="text-xs font-label bg-fission-surface-highest px-2 py-1">PT-{market}</span>
                </div>
              </div>
              <div className="p-6 rounded-lg bg-fission-surface-low border border-fission-orange/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-fission-orange/15 blur-xl" />
                <div className="text-[10px] font-label text-fission-orange uppercase tracking-widest mb-4">Receive YT</div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-headline font-bold text-fission-orange">{amount ? (tab === "long" ? (parseFloat(amount) * 0.985).toFixed(2) : tab === "fixed" ? "0.00" : parseFloat(amount).toFixed(2)) : "0.00"}</span>
                  <span className="text-xs font-label bg-fission-orange/10 text-fission-orange border border-fission-orange/20 px-2 py-1">YT-{market}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {step === "input" || step === "approve" ? (
              <button onClick={handleApprove} disabled={!isConnected || !amount || parseFloat(amount) <= 0 || actions.isPending} className="w-full py-5 font-headline font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: tabConfig[tab].color, color: tab === "long" ? "#fff" : "#003919" }}>
                {!isConnected ? "Connect Wallet" : actions.isPending ? "Approving..." : `Approve ${market}`}
              </button>
            ) : (
              <button onClick={handleExecute} disabled={!isConnected || !amount || actions.isPending} className="w-full py-5 font-headline font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40" style={{ background: tabConfig[tab].color, color: tab === "long" ? "#fff" : "#003919" }}>
                {actions.isPending ? "Confirming..." : actions.isSuccess ? "✓ Success!" : tabConfig[tab].btnLabel}
              </button>
            )}

            {/* Tx Hash */}
            {actions.hash && (
              <div className="text-center">
                <a href={`https://blockscout.polkadot.io/tx/${actions.hash}`} target="_blank" className="text-xs font-label text-fission-green/60 hover:text-fission-green underline">
                  View on Blockscout →
                </a>
              </div>
            )}

            {/* Tx Metadata */}
            <div className="bg-fission-bg/50 p-6 space-y-4 font-label text-[11px] uppercase tracking-wider">
              <div className="flex justify-between"><span className="text-slate-500">Slippage Tolerance</span><span>0.5%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Protocol Fee</span><span>0.3%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-fission-green flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-fission-green" />Polkadot Hub Mainnet</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
