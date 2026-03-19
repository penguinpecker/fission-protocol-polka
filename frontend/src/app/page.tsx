"use client";

import { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, MARKETS, type MarketMeta } from "@/config/contracts";
import { FissionCoreABI, FissionRouterABI, FissionAMMABI, ERC20ABI, MockAssetABI, YieldTokenABI } from "@/abi";

const C = CONTRACTS[420420419];

// ═══════════════════════════════════════════════════════════
//                     HASH ROUTER
// ═══════════════════════════════════════════════════════════
type Route =
  | { page: "landing" }
  | { page: "markets" }
  | { page: "market"; id: string }
  | { page: "trade"; id: string; strategy: string }
  | { page: "dashboard" }
  | { page: "swap" };

function parseHash(hash: string): Route {
  const h = hash.replace("#", "");
  if (h.startsWith("market/") && h.includes("/")) {
    const parts = h.split("/");
    if (parts.length === 3) return { page: "trade", id: parts[1], strategy: parts[2] };
    return { page: "market", id: parts[1] };
  }
  if (h === "markets") return { page: "markets" };
  if (h === "dashboard") return { page: "dashboard" };
  if (h === "swap") return { page: "swap" };
  return { page: "landing" };
}

export default function App() {
  const [route, setRoute] = useState<Route>({ page: "landing" });

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const nav = (hash: string) => { window.location.hash = hash; };

  return (
    <>
      <Navbar route={route} nav={nav} />
      {route.page === "landing" && <LandingPage nav={nav} />}
      {route.page === "markets" && <MarketsPage nav={nav} />}
      {route.page === "market" && <MarketDetailPage marketId={route.id} nav={nav} />}
      {route.page === "trade" && <TradePage marketId={route.id} strategy={route.strategy} nav={nav} />}
      {route.page === "dashboard" && <DashboardPage nav={nav} />}
      {route.page === "swap" && <SwapPage nav={nav} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//                       NAVBAR
// ═══════════════════════════════════════════════════════════
function Navbar({ route, nav }: { route: Route; nav: (h: string) => void }) {
  const links = [
    { label: "Markets", hash: "markets" },
    { label: "Dashboard", hash: "dashboard" },
    { label: "Swap", hash: "swap" },
  ];
  return (
    <nav className="fixed top-0 w-full z-50 border-b" style={{ background: "rgba(19,19,24,0.6)", backdropFilter: "blur(20px)", borderColor: "rgba(0,255,136,0.15)" }}>
      <div className="flex justify-between items-center px-6 py-4 max-w-[1440px] mx-auto">
        <button onClick={() => nav("")} className="text-xl font-bold text-fission-green flex items-center gap-2 font-headline tracking-tighter">
          <span className="w-3 h-3 rounded-full bg-fission-green" /> Fission Protocol
        </button>
        <div className="hidden md:flex items-center gap-8 font-label uppercase tracking-wider text-xs">
          {links.map((l) => (
            <button key={l.hash} onClick={() => nav(l.hash)} className={`pb-1 transition-colors ${route.page === l.hash || (l.hash === "markets" && route.page === "market") ? "text-fission-green border-b-2 border-fission-green" : "text-slate-400 hover:text-white"}`}>{l.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-fission-surface-high border border-fission-outline-var/30 text-[10px] font-label uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-fission-green animate-pulse" /> Polkadot Hub
          </div>
          <ConnectButton.Custom>
            {({ account, chain, openConnectModal, openAccountModal, mounted }) => (
              <button onClick={mounted && account && chain ? openAccountModal : openConnectModal}
                className={`px-4 py-2 font-label font-bold text-xs uppercase tracking-widest transition-all ${mounted && account ? "frosted-console border border-fission-outline-var/30 text-fission-on-surface" : "bg-fission-green text-fission-on-primary hover:brightness-110"}`}>
                {mounted && account ? account.displayName : "Connect Wallet"}
              </button>
            )}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════
//              PAGE 1: LANDING (Informational)
// ═══════════════════════════════════════════════════════════
function LandingPage({ nav }: { nav: (h: string) => void }) {
  return (
    <div className="pt-24 pb-20 px-6 max-w-[1440px] mx-auto">
      {/* Hero */}
      <header className="mb-28 grid lg:grid-cols-2 gap-12 items-end">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fission-green/5 border border-fission-green/10 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-fission-green animate-pulse" />
            <span className="text-[10px] font-label uppercase tracking-widest text-fission-green">Live on Polkadot Hub Mainnet</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-bold leading-tight tracking-tighter mb-6">Split Your <br/><span className="text-fission-green">Yield</span></h1>
          <p className="text-slate-400 max-w-md text-lg font-light leading-relaxed mb-8">Separate yield-bearing assets into Principal + Yield tokens. Lock in fixed rates, speculate on yields, or earn swap fees on Polkadot.</p>
          <div className="flex gap-4">
            <button onClick={() => nav("markets")} className="bg-fission-green text-fission-on-primary px-8 py-4 font-label font-bold text-xs uppercase tracking-widest hover:brightness-110 pulse-glow">Launch App</button>
            <a href="https://github.com/penguinpecker/fission-protocol-polka" target="_blank" className="frosted-console border border-fission-outline-var/30 px-8 py-4 font-label text-xs uppercase tracking-widest text-slate-300 hover:text-white transition-all">GitHub</a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-fission-surface-low border border-fission-outline-var/15">
          {[{ l: "Protocol TVL", v: "$124M", c: "text-fission-green" }, { l: "Markets", v: "2", c: "" }, { l: "Integrations", v: "6 Native", c: "text-slate-300" }].map((s) => (
            <div key={s.l} className="bg-fission-bg p-6"><span className="text-[10px] font-label text-slate-500 uppercase tracking-widest block">{s.l}</span><span className={`text-2xl font-headline font-bold ${s.c}`}>{s.v}</span></div>
          ))}
        </div>
      </header>

      {/* How It Works */}
      <section className="mb-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-label text-fission-green uppercase tracking-[0.3em] block mb-3">The Mechanism</span>
          <h2 className="text-4xl font-headline font-bold tracking-tighter mb-4">How Yield Tokenization Works</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-1">
          {[
            { n: "01", t: "Deposit", d: "Deposit yield-bearing asset (vDOT or aUSDT) into Fission Protocol" },
            { n: "02", t: "Split", d: "Asset splits 1:1 into PT (Principal Token) + YT (Yield Token)" },
            { n: "03", t: "Trade", d: "Buy PT for fixed yield, YT for leveraged yield, or LP for fees" },
            { n: "04", t: "Redeem", d: "At maturity, PT redeems 1:1. YT holders claim all accrued yield" },
          ].map((s, i) => (
            <div key={s.n} className="p-8 bg-fission-surface-low border border-fission-outline-var/10 hover:border-fission-green/20 transition-all">
              <div className="w-12 h-12 bg-fission-green/10 border border-fission-green/20 flex items-center justify-center mb-6 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="font-headline font-bold text-fission-green">{s.n}</span>
              </div>
              <h3 className="font-headline font-bold text-lg mb-3">{s.t}</h3>
              <p className="text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Three Strategies */}
      <section className="mb-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-headline font-bold tracking-tighter mb-4">Three Ways to Win</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { t: "Fixed Yield", s: "Buy PT · Low Risk", c: "#00ff88", icon: "🛡", d: "Buy PT at a discount. Redeem 1:1 at maturity. The discount IS your guaranteed fixed rate.", ex: "+1.2 vDOT (≈14.8% APY)" },
            { t: "Long Yield", s: "Buy YT · High Risk", c: "#ff6b35", icon: "🔥", d: "Buy YT to receive ALL streaming yield. If rates rise, your YT becomes worth more.", ex: "+3.75 vDOT (312% ROI)" },
            { t: "Earn (LP)", s: "Provide Liquidity", c: "#a855f7", icon: "💎", d: "LP to the PT/Asset pool. Earn swap fees + underlying yield. Minimal IL at maturity.", ex: "~21.5% combined APY" },
          ].map((s) => (
            <div key={s.t} className="frosted-console border border-fission-outline-var/15 p-8" style={{ background: `radial-gradient(circle at top right, ${s.c}12, transparent 70%)` }}>
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="font-headline font-bold text-2xl mb-1" style={{ color: s.c }}>{s.t}</h3>
              <div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-4">{s.s}</div>
              <p className="text-slate-400 text-sm mb-6">{s.d}</p>
              <div className="p-3 bg-fission-bg/50 font-label text-xs"><span className="text-slate-500">Potential: </span><span style={{ color: s.c }}>{s.ex}</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* PT vs YT */}
      <section className="mb-28 frosted-console border border-fission-outline-var/15 p-12">
        <h2 className="text-3xl font-headline font-bold tracking-tighter mb-8 text-center">PT + YT = 1 Unit of Asset</h2>
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="p-6 bg-fission-green/5 border border-fission-green/15">
            <div className="text-3xl font-headline font-bold text-fission-green mb-2">PT</div>
            <div className="text-xs font-label text-slate-500 uppercase mb-4">Principal Token</div>
            <div className="text-sm text-slate-400 space-y-2">
              <div>• Redeemable 1:1 at maturity</div><div>• Trades at discount = your fixed yield</div><div>• Like a zero-coupon bond</div>
            </div>
          </div>
          <div className="text-center"><div className="text-5xl font-headline font-bold text-slate-600">=</div><div className="text-sm font-headline font-bold mt-2">1 Underlying</div></div>
          <div className="p-6 bg-fission-orange/5 border border-fission-orange/15">
            <div className="text-3xl font-headline font-bold text-fission-orange mb-2">YT</div>
            <div className="text-xs font-label text-slate-500 uppercase mb-4">Yield Token</div>
            <div className="text-sm text-slate-400 space-y-2">
              <div>• Receives ALL streaming yield</div><div>• Worth 0 at maturity</div><div>• Like an interest rate swap</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center mb-20">
        <button onClick={() => nav("markets")} className="bg-fission-green text-fission-on-primary px-12 py-5 font-headline font-bold text-lg uppercase tracking-widest hover:brightness-110 pulse-glow">
          Explore Markets →
        </button>
      </div>

      {/* Footer contracts */}
      <footer className="pt-12 border-t border-fission-outline-var/15 font-label text-[11px] space-y-2">
        {[["FissionCore", C.fissionCore], ["Router", C.router], ["AMM vDOT", C.ammVDOT], ["AMM aUSDT", C.ammAUSDT]].map(([n, a]) => (
          <div key={n} className="flex justify-between p-3 bg-fission-surface-low border-l-2 border-fission-outline-var">
            <span className="text-slate-500 uppercase">{n}</span>
            <a href={`https://blockscout.polkadot.io/address/${a}`} target="_blank" className="text-fission-on-surface hover:text-fission-green">{(a as string).slice(0, 10)}...{(a as string).slice(-6)}</a>
          </div>
        ))}
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//              PAGE 2: MARKETS (Choose Market)
// ═══════════════════════════════════════════════════════════
function MarketsPage({ nav }: { nav: (h: string) => void }) {
  return (
    <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-headline font-bold tracking-tighter mb-2">Markets</h1>
      <p className="text-slate-400 mb-12">Select a market to view strategies and trade yield tokens.</p>

      <div className="grid md:grid-cols-2 gap-8">
        {MARKETS.map((m) => (
          <button key={m.id} onClick={() => nav(`market/${m.id}`)} className="text-left frosted-console border border-fission-outline-var/15 p-1 overflow-hidden hover:border-fission-green/30 transition-all group">
            <div className={`p-8 ${m.id === "vDOT" ? "yield-gradient-green" : "yield-gradient-pink"}`}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-fission-surface-highest flex items-center justify-center text-2xl">{m.icon}</div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold">{m.asset}</h3>
                    <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest">{m.description}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="text-[10px] font-label text-slate-500 uppercase mb-1">Estimated APY</div>
                  <div className="text-5xl font-headline font-bold" style={{ color: m.color }}>{m.apy}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-label text-slate-500 uppercase mb-1">Maturity</div>
                  <div className="text-lg font-headline">Apr 19, 2026</div>
                </div>
              </div>
              <div className="bg-fission-green text-fission-on-primary py-4 text-center font-label font-bold uppercase tracking-widest text-xs group-hover:brightness-110 transition-all">
                View Strategies →
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//        PAGE 3: MARKET DETAIL (Choose Strategy + Info)
// ═══════════════════════════════════════════════════════════
function MarketDetailPage({ marketId, nav }: { marketId: string; nav: (h: string) => void }) {
  const m = MARKETS.find((x) => x.id === marketId) || MARKETS[0];
  const ammAddr = marketId === "vDOT" ? C.ammVDOT : C.ammAUSDT;

  const { data: ptPrice } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "getPTPrice" });
  const { data: ytPrice } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "getYTPrice" });
  const { data: impliedRate } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "getImpliedRate" });
  const { data: ttm } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "timeToMaturity" });
  const { data: resPT } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "reservePT" });
  const { data: resAsset } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "reserveAsset" });

  const ir = impliedRate ? (Number(formatEther(impliedRate as bigint)) * 100).toFixed(2) : "0";
  const ptp = ptPrice ? Number(formatEther(ptPrice as bigint)).toFixed(4) : "1.0000";
  const ytp = ytPrice ? Number(formatEther(ytPrice as bigint)).toFixed(4) : "0.0000";
  const days = ttm ? Math.floor(Number(ttm) / 86400) : 30;
  const tvl = resPT && resAsset ? Number(formatEther((resPT as bigint) + (resAsset as bigint))).toFixed(0) : "0";

  const strategies = [
    { id: "split", label: "Split", icon: "⚛", color: "#00ff88", desc: "Split asset into PT + YT. Get both tokens. Manage manually.", risk: "None" },
    { id: "fixed", label: "Fixed Yield", icon: "🛡", color: "#00ff88", desc: `Buy PT at ${ptp} → redeem 1:1 at maturity. Fixed ${ir}% APY guaranteed.`, risk: "Low" },
    { id: "long", label: "Long Yield", icon: "🔥", color: "#ff6b35", desc: `Buy YT at ${ytp} per token. Receive all streaming ${m.underlying} yield until maturity.`, risk: "High" },
    { id: "earn", label: "Earn (LP)", icon: "💎", color: "#a855f7", desc: "Provide liquidity to PT/Asset pool. Earn swap fees + underlying yield.", risk: "Medium" },
  ];

  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-label text-slate-500 mb-8">
        <button onClick={() => nav("markets")} className="hover:text-fission-green">Markets</button>
        <span>/</span>
        <span className="text-fission-on-surface">{m.asset}</span>
      </div>

      {/* Market Header */}
      <div className="flex items-start justify-between mb-12">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-fission-surface-highest flex items-center justify-center text-3xl">{m.icon}</div>
          <div>
            <h1 className="text-3xl font-headline font-bold">{m.asset} Market</h1>
            <span className="text-sm text-slate-400">{m.description}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-headline font-bold text-fission-green">{ir}%</div>
          <div className="text-xs font-label text-slate-500 uppercase">Implied APY</div>
        </div>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {[
          { l: "PT Price", v: ptp, c: "#00ff88" },
          { l: "YT Price", v: ytp, c: "#ff6b35" },
          { l: "TVL", v: `${tvl} ${m.asset}`, c: "" },
          { l: "Days Left", v: `${days}d`, c: "#00ff88" },
          { l: "Maturity", v: "Apr 19, 2026", c: "" },
        ].map((s) => (
          <div key={s.l} className="p-5 bg-fission-surface-low border border-fission-outline-var/10">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-1">{s.l}</div>
            <div className="text-xl font-headline font-bold" style={{ color: s.c || "#e4e1e9" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Yield Curve Visualization */}
      <div className="frosted-console border border-fission-outline-var/15 p-8 mb-12">
        <h3 className="font-headline font-bold text-lg mb-6">Yield Curve — PT Convergence to 1:1</h3>
        <div className="h-48 flex items-end gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const progress = i / 29;
            const ptVal = 0.95 + progress * 0.05;
            const ytVal = 0.05 - progress * 0.05;
            return (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                <div className="w-full rounded-sm transition-all" style={{ height: `${ptVal * 150}px`, background: `rgba(0,255,136,${0.3 + progress * 0.5})` }} />
                <div className="w-full rounded-sm" style={{ height: `${Math.max(ytVal * 150, 2)}px`, background: `rgba(255,107,53,${0.5 - progress * 0.4})` }} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-[10px] font-label text-slate-500 uppercase">
          <span>Now</span>
          <div className="flex gap-6">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-fission-green" /> PT Value</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-fission-orange" /> YT Value</span>
          </div>
          <span>Maturity</span>
        </div>
      </div>

      {/* Choose Strategy */}
      <h3 className="font-headline font-bold text-xl mb-6">Choose Your Strategy</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {strategies.map((s) => (
          <button key={s.id} onClick={() => nav(`market/${marketId}/${s.id}`)} className="text-left p-6 frosted-console border border-fission-outline-var/15 hover:border-opacity-50 transition-all group" style={{ borderColor: `${s.color}20` }}>
            <div className="flex items-start gap-4">
              <div className="text-3xl">{s.icon}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-headline font-bold text-lg" style={{ color: s.color }}>{s.label}</h4>
                  <span className="text-[10px] font-label px-2 py-1 uppercase" style={{ background: `${s.color}15`, color: s.color }}>{s.risk} Risk</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{s.desc}</p>
                <span className="text-xs font-label uppercase tracking-widest group-hover:text-fission-green transition-colors" style={{ color: s.color }}>Select Strategy →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//        PAGE 4: TRADE (Deposit into Strategy)
// ═══════════════════════════════════════════════════════════
function TradePage({ marketId, strategy, nav }: { marketId: string; strategy: string; nav: (h: string) => void }) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"approve" | "execute">("approve");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const m = MARKETS.find((x) => x.id === marketId) || MARKETS[0];
  const assetAddr = marketId === "vDOT" ? C.mockVDOT : C.mockAUSDT;
  const mId = marketId === "vDOT" ? C.marketIdVDOT : C.marketIdAUSDT;

  const { data: bal } = useReadContract({ address: assetAddr, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const balance = bal ? formatEther(bal as bigint) : "0";

  const strategyMeta: Record<string, { label: string; color: string; icon: string }> = {
    split: { label: "Split Asset", color: "#00ff88", icon: "⚛" },
    fixed: { label: "Lock Fixed Yield", color: "#00ff88", icon: "🛡" },
    long: { label: "Long Yield", color: "#ff6b35", icon: "🔥" },
    earn: { label: "Add Liquidity", color: "#a855f7", icon: "💎" },
  };
  const sm = strategyMeta[strategy] || strategyMeta.split;

  const handleApprove = () => {
    if (!amount) return;
    writeContract({ address: assetAddr, abi: ERC20ABI, functionName: "approve", args: [C.router, parseEther(amount)] });
    setStep("execute");
  };

  const handleExecute = () => {
    if (!amount) return;
    const fnMap: Record<string, string> = { split: "splitFromAsset", fixed: "splitAndSellYT", long: "splitAndSellPT", earn: "addLiquidityFromAsset" };
    const fn = fnMap[strategy] || "splitFromAsset";
    if (fn === "splitFromAsset") {
      writeContract({ address: C.router, abi: FissionRouterABI, functionName: "splitFromAsset", args: [mId as `0x${string}`, parseEther(amount)] });
    } else if (fn === "splitAndSellYT") {
      writeContract({ address: C.router, abi: FissionRouterABI, functionName: "splitAndSellYT", args: [mId as `0x${string}`, parseEther(amount), BigInt(0)] });
    } else if (fn === "splitAndSellPT") {
      writeContract({ address: C.router, abi: FissionRouterABI, functionName: "splitAndSellPT", args: [mId as `0x${string}`, parseEther(amount), BigInt(0)] });
    } else {
      writeContract({ address: C.router, abi: FissionRouterABI, functionName: "addLiquidityFromAsset", args: [mId as `0x${string}`, parseEther(amount), BigInt(0)] });
    }
  };

  const handleMint = () => {
    if (!address) return;
    writeContract({ address: assetAddr, abi: MockAssetABI, functionName: "mint", args: [address, parseEther("1000")] });
  };

  return (
    <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-label text-slate-500 mb-8">
        <button onClick={() => nav("markets")} className="hover:text-fission-green">Markets</button><span>/</span>
        <button onClick={() => nav(`market/${marketId}`)} className="hover:text-fission-green">{m.asset}</button><span>/</span>
        <span className="text-fission-on-surface">{sm.label}</span>
      </div>

      <div className="frosted-console border border-fission-outline-var/15 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-fission-outline-var/10 flex items-center gap-4" style={{ background: `${sm.color}08` }}>
          <span className="text-3xl">{sm.icon}</span>
          <div>
            <h1 className="font-headline font-bold text-xl" style={{ color: sm.color }}>{sm.label}</h1>
            <span className="text-xs text-slate-400">{m.asset} Market · Polkadot Hub</span>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Amount Input */}
          <div>
            <div className="flex justify-between mb-3">
              <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest">Deposit Amount</span>
              <span className="text-[10px] font-label text-slate-500">Balance: {parseFloat(balance).toFixed(2)} {m.asset}</span>
            </div>
            <div className="flex items-center gap-4 bg-fission-surface-high p-5 border border-transparent focus-within:border-fission-green/30 transition-all">
              <div className="flex items-center gap-2 pr-4 border-r border-fission-outline-var/20">
                <span className="text-xl">{m.icon}</span>
                <span className="font-headline font-bold">{m.asset}</span>
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-transparent border-none text-right font-headline text-2xl font-bold focus:ring-0 focus:outline-none placeholder:text-fission-surface-highest" placeholder="0.00" />
            </div>
            <button onClick={() => setAmount(balance)} className="text-[10px] font-label text-fission-green/60 hover:text-fission-green mt-2">Use Max</button>
          </div>

          {/* Output Preview */}
          <div className="bg-fission-bg/50 p-5 space-y-3">
            <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-3">You Will Receive</div>
            {strategy === "split" && <>
              <div className="flex justify-between"><span className="text-sm text-fission-green">PT-{m.asset}</span><span className="font-headline font-bold">{amount || "0"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-fission-orange">YT-{m.asset}</span><span className="font-headline font-bold">{amount || "0"}</span></div>
            </>}
            {strategy === "fixed" && <div className="flex justify-between"><span className="text-sm text-fission-green">PT-{m.asset}</span><span className="font-headline font-bold">{amount ? (parseFloat(amount) * 1.012).toFixed(2) : "0"}</span></div>}
            {strategy === "long" && <div className="flex justify-between"><span className="text-sm text-fission-orange">YT-{m.asset}</span><span className="font-headline font-bold">{amount ? (parseFloat(amount) * 0.985).toFixed(2) : "0"}</span></div>}
            {strategy === "earn" && <div className="flex justify-between"><span className="text-sm text-fission-purple">LP Tokens</span><span className="font-headline font-bold">{amount ? (parseFloat(amount) * 0.498).toFixed(2) : "0"}</span></div>}
          </div>

          {/* Action Buttons */}
          {step === "approve" ? (
            <button onClick={handleApprove} disabled={!isConnected || !amount || parseFloat(amount) <= 0 || isPending}
              className="w-full py-5 font-headline font-bold text-lg uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: sm.color, color: strategy === "long" ? "#fff" : "#003919" }}>
              {!isConnected ? "Connect Wallet" : isPending ? "Approving..." : `Approve ${m.asset}`}
            </button>
          ) : (
            <button onClick={handleExecute} disabled={!isConnected || isPending}
              className="w-full py-5 font-headline font-bold text-lg uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
              style={{ background: sm.color, color: strategy === "long" ? "#fff" : "#003919" }}>
              {isPending ? "Confirming..." : isSuccess ? "✓ Success!" : sm.label}
            </button>
          )}

          {hash && (
            <a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block text-center text-xs font-label text-fission-green/60 hover:text-fission-green underline">
              View on Blockscout →
            </a>
          )}

          {/* Metadata */}
          <div className="space-y-3 font-label text-[11px] uppercase tracking-wider pt-4 border-t border-fission-outline-var/10">
            <div className="flex justify-between"><span className="text-slate-500">Slippage</span><span>0.5%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Protocol Fee</span><span>0.3%</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Network</span><span className="text-fission-green">● Polkadot Hub</span></div>
          </div>

          {/* Mint Test Tokens */}
          <button onClick={handleMint} disabled={!isConnected || isPending}
            className="w-full py-3 bg-fission-green/10 border border-fission-green/20 text-fission-green text-xs font-label uppercase tracking-widest hover:bg-fission-green/15 disabled:opacity-40">
            {isPending ? "Minting..." : `Mint 1000 Test ${m.asset}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//              PAGE 5: DASHBOARD (Positions)
// ═══════════════════════════════════════════════════════════
function DashboardPage({ nav }: { nav: (h: string) => void }) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // vDOT balances
  const { data: vdotAsset } = useReadContract({ address: C.mockVDOT, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: vdotPT } = useReadContract({ address: C.ptVDOT as `0x${string}`, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: vdotYT } = useReadContract({ address: C.ytVDOT as `0x${string}`, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: vdotClaim } = useReadContract({ address: C.ytVDOT as `0x${string}`, abi: YieldTokenABI, functionName: "claimableYield", args: address ? [address] : undefined });

  // aUSDT balances
  const { data: ausdtAsset } = useReadContract({ address: C.mockAUSDT, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: ausdtPT } = useReadContract({ address: C.ptAUSDT as `0x${string}`, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: ausdtYT } = useReadContract({ address: C.ytAUSDT as `0x${string}`, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: ausdtClaim } = useReadContract({ address: C.ytAUSDT as `0x${string}`, abi: YieldTokenABI, functionName: "claimableYield", args: address ? [address] : undefined });

  const fmt = (v: any) => v ? parseFloat(formatEther(v as bigint)).toFixed(2) : "0.00";
  const fmtSmall = (v: any) => v ? parseFloat(formatEther(v as bigint)).toFixed(4) : "0.0000";

  const claimYield = (market: "vDOT" | "aUSDT") => {
    const mId = market === "vDOT" ? C.marketIdVDOT : C.marketIdAUSDT;
    writeContract({ address: C.fissionCore, abi: FissionCoreABI, functionName: "claimYield", args: [mId as `0x${string}`] });
  };

  if (!isConnected) return (
    <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto text-center">
      <div className="frosted-console border border-fission-outline-var/15 p-16">
        <div className="text-5xl mb-6">👀</div>
        <h2 className="text-2xl font-headline font-bold mb-4">Connect Wallet</h2>
        <p className="text-slate-400">Connect your wallet to view positions.</p>
      </div>
    </div>
  );

  return (
    <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-headline font-bold mb-2">Dashboard</h1>
          <span className="text-xs font-label text-slate-500">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
        </div>
        <div className="frosted-console border border-fission-outline-var/15 p-6 text-center min-w-[260px]">
          <div className="text-[10px] font-label text-slate-500 uppercase mb-2">Total Claimable</div>
          <div className="text-2xl font-headline font-bold text-fission-green mb-3">{fmtSmall(vdotClaim)} vDOT</div>
          <button onClick={() => claimYield("vDOT")} disabled={isPending} className="w-full py-2 bg-fission-green text-fission-on-primary font-label font-bold text-xs uppercase hover:brightness-110 disabled:opacity-40">
            {isPending ? "Claiming..." : "Claim All"}
          </button>
        </div>
      </div>

      {hash && <a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block mb-8 text-center text-xs font-label text-fission-green underline">View Tx on Blockscout →</a>}

      {/* vDOT Positions */}
      <PositionTable title="vDOT Market" icon="⚛️" rows={[
        { token: "vDOT", type: "ASSET", balance: fmt(vdotAsset), color: "#64748b" },
        { token: "PT-vDOT", type: "PRINCIPAL", balance: fmt(vdotPT), color: "#00ff88" },
        { token: "YT-vDOT", type: "YIELD", balance: fmt(vdotYT), color: "#ff6b35", claimable: fmtSmall(vdotClaim) },
      ]} onTrade={() => nav("market/vDOT")} />

      {/* aUSDT Positions */}
      <PositionTable title="aUSDT Market" icon="💵" rows={[
        { token: "aUSDT", type: "ASSET", balance: fmt(ausdtAsset), color: "#64748b" },
        { token: "PT-aUSDT", type: "PRINCIPAL", balance: fmt(ausdtPT), color: "#00ff88" },
        { token: "YT-aUSDT", type: "YIELD", balance: fmt(ausdtYT), color: "#ff6b35", claimable: fmtSmall(ausdtClaim) },
      ]} onTrade={() => nav("market/aUSDT")} />
    </div>
  );
}

function PositionTable({ title, icon, rows, onTrade }: { title: string; icon: string; rows: { token: string; type: string; balance: string; color: string; claimable?: string }[]; onTrade: () => void }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3"><span className="text-xl">{icon}</span><h3 className="font-headline font-bold text-lg">{title}</h3></div>
        <button onClick={onTrade} className="text-xs font-label text-fission-green uppercase hover:underline">Trade →</button>
      </div>
      <div className="border border-fission-outline-var/15 overflow-hidden">
        <div className="grid grid-cols-4 gap-4 p-4 bg-fission-surface-low text-[10px] font-label text-slate-500 uppercase tracking-widest">
          <span>Token</span><span>Type</span><span>Balance</span><span>Yield</span>
        </div>
        {rows.map((r) => (
          <div key={r.token} className="grid grid-cols-4 gap-4 p-4 items-center border-t border-fission-outline-var/10">
            <div className="flex items-center gap-2"><div className="w-2 h-6" style={{ background: r.color }} /><span className="font-headline font-bold text-sm">{r.token}</span></div>
            <span className="text-[10px] font-label uppercase" style={{ color: r.color }}>{r.type}</span>
            <span className="font-label text-sm">{r.balance}</span>
            <span className="font-label text-sm" style={{ color: r.claimable && parseFloat(r.claimable) > 0 ? "#00ff88" : "#64748b" }}>
              {r.claimable ? `+${r.claimable}` : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//              PAGE 6: SWAP (PT/YT Trading)
// ═══════════════════════════════════════════════════════════
function SwapPage({ nav }: { nav: (h: string) => void }) {
  const { address, isConnected } = useAccount();
  const [market, setMarket] = useState<"vDOT" | "aUSDT">("vDOT");
  const [direction, setDirection] = useState<"buyPT" | "buyYT">("buyPT");
  const [amount, setAmount] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  const ammAddr = market === "vDOT" ? C.ammVDOT : C.ammAUSDT;
  const assetAddr = market === "vDOT" ? C.mockVDOT : C.mockAUSDT;
  const ptAddr = market === "vDOT" ? C.ptVDOT : C.ptAUSDT;

  const { data: ptPrice } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "getPTPrice" });
  const { data: ytPrice } = useReadContract({ address: ammAddr, abi: FissionAMMABI, functionName: "getYTPrice" });
  const { data: bal } = useReadContract({ address: assetAddr, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });
  const { data: ptBal } = useReadContract({ address: ptAddr as `0x${string}`, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined });

  const ptp = ptPrice ? Number(formatEther(ptPrice as bigint)).toFixed(4) : "1.0000";
  const ytp = ytPrice ? Number(formatEther(ytPrice as bigint)).toFixed(4) : "0.0000";

  const handleApproveAndSwap = () => {
    if (!amount) return;
    const tokenIn = direction === "buyPT" ? assetAddr : ptAddr as `0x${string}`;
    writeContract({ address: tokenIn, abi: ERC20ABI, functionName: "approve", args: [ammAddr, parseEther(amount)] });
  };

  const handleSwap = () => {
    if (!amount) return;
    const tokenIn = direction === "buyPT" ? assetAddr : ptAddr as `0x${string}`;
    writeContract({ address: ammAddr, abi: FissionAMMABI, functionName: "swap", args: [tokenIn, parseEther(amount), BigInt(0)] });
  };

  return (
    <div className="pt-28 pb-20 px-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-headline font-bold tracking-tighter mb-2">Swap</h1>
      <p className="text-slate-400 text-sm mb-8">Trade PT and underlying assets on the Fission AMM.</p>

      {/* Market Selector */}
      <div className="flex gap-2 mb-6">
        {(["vDOT", "aUSDT"] as const).map((m) => (
          <button key={m} onClick={() => setMarket(m)} className={`flex-1 py-3 font-label text-xs uppercase tracking-widest transition-all ${market === m ? "bg-fission-green/10 border border-fission-green/20 text-fission-green" : "bg-fission-surface-low border border-fission-outline-var/10 text-slate-500"}`}>{m}</button>
        ))}
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-fission-surface-low border-l-2 border-fission-green">
          <div className="text-[10px] font-label text-slate-500 uppercase mb-1">PT Price</div>
          <div className="text-xl font-headline font-bold">{ptp}</div>
        </div>
        <div className="p-4 bg-fission-surface-low border-l-2 border-fission-orange">
          <div className="text-[10px] font-label text-slate-500 uppercase mb-1">YT Price</div>
          <div className="text-xl font-headline font-bold text-fission-orange">{ytp}</div>
        </div>
      </div>

      <div className="frosted-console border border-fission-outline-var/15 overflow-hidden">
        {/* Direction Toggle */}
        <div className="flex border-b border-fission-outline-var/10">
          <button onClick={() => setDirection("buyPT")} className={`flex-1 py-4 font-label text-xs uppercase tracking-widest ${direction === "buyPT" ? "text-fission-green border-b-2 border-fission-green bg-fission-green/5" : "text-slate-500"}`}>
            Buy PT (Asset → PT)
          </button>
          <button onClick={() => setDirection("buyYT")} className={`flex-1 py-4 font-label text-xs uppercase tracking-widest ${direction === "buyYT" ? "text-fission-orange border-b-2 border-fission-orange bg-fission-orange/5" : "text-slate-500"}`}>
            Sell PT (PT → Asset)
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Input */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-label text-slate-500 uppercase">You Pay</span>
              <span className="text-[10px] font-label text-slate-500">
                Balance: {direction === "buyPT" ? (bal ? parseFloat(formatEther(bal as bigint)).toFixed(2) : "0") : (ptBal ? parseFloat(formatEther(ptBal as bigint)).toFixed(2) : "0")}
              </span>
            </div>
            <div className="flex items-center gap-3 bg-fission-surface-high p-4">
              <span className="font-headline font-bold text-sm">{direction === "buyPT" ? market : `PT-${market}`}</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 bg-transparent border-none text-right font-headline text-xl font-bold focus:ring-0 focus:outline-none placeholder:text-fission-surface-highest" placeholder="0.00" />
            </div>
          </div>

          <div className="text-center text-fission-green text-lg">↓</div>

          {/* Output */}
          <div className="bg-fission-bg/50 p-4">
            <div className="text-[10px] font-label text-slate-500 uppercase mb-2">You Receive (est.)</div>
            <div className="flex justify-between items-center">
              <span className="font-headline font-bold text-sm">{direction === "buyPT" ? `PT-${market}` : market}</span>
              <span className="font-headline text-xl font-bold">{amount ? (parseFloat(amount) * 0.997).toFixed(4) : "0.00"}</span>
            </div>
          </div>

          {/* Approve */}
          <button onClick={handleApproveAndSwap} disabled={!isConnected || !amount || isPending}
            className="w-full py-4 font-headline font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
            style={{ background: direction === "buyPT" ? "#00ff88" : "#ff6b35", color: direction === "buyPT" ? "#003919" : "#fff" }}>
            {!isConnected ? "Connect Wallet" : isPending ? "Processing..." : isSuccess ? "✓ Done" : "Approve & Swap"}
          </button>

          {/* Then execute */}
          {isSuccess && (
            <button onClick={handleSwap} disabled={isPending}
              className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary hover:brightness-110 disabled:opacity-40">
              {isPending ? "Swapping..." : "Execute Swap"}
            </button>
          )}

          {hash && <a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block text-center text-xs font-label text-fission-green/60 hover:text-fission-green underline">View on Blockscout →</a>}
        </div>
      </div>
    </div>
  );
}
