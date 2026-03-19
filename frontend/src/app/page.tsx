"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { parseEther, formatEther } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { FissionCoreABI, FissionRouterABI, FissionAMMABI, ERC20ABI, MockAssetABI, YieldTokenABI } from "@/abi";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, Line } from "recharts";

const CC = CONTRACTS[420420419];

// ── Chart generators ──
const mkYield = (b: number, v: number, n = 60) => Array.from({ length: n }, (_, i) => ({ d: i, underlying: +(b + Math.sin(i * 0.2) * v + (Math.random() - 0.5) * v * 0.6).toFixed(2), implied: +(b + 0.8 + Math.sin(i * 0.15) * v * 0.5 + (Math.random() - 0.5) * v * 0.4).toFixed(2), fixed: b - 0.7 }));
const mkPT = (s: number, n = 60) => Array.from({ length: n }, (_, i) => ({ d: i, price: +Math.min(s + (1 - s) * (i / n) ** 0.55 + (Math.random() - 0.5) * 0.004, 1).toFixed(4), target: 1.0 }));
const mkMini = (b: number, v: number, n = 30) => Array.from({ length: n }, (_, i) => ({ d: i, v: +(b + Math.sin(i * 0.3) * v + (Math.random() - 0.5) * v * 0.5).toFixed(2) }));
const ptMini = (s: number, n = 30) => Array.from({ length: n }, (_, i) => ({ d: i, price: +Math.min(s + (1 - s) * (i / n) ** 0.5 + (Math.random() - 0.5) * 0.003, 1).toFixed(4) }));
const YIELD_DATA = [mkYield(7.2, 2.5), mkYield(4.8, 1.8)];
const PT_DATA = [mkPT(0.938), mkPT(0.961)];

// ── Market defs ──
interface MktDef { idx: number; sym: string; name: string; protocol: string; maturity: string; tag: string; accent: string; assetAddr: `0x${string}`; ptAddr: `0x${string}`; ytAddr: `0x${string}`; ammAddr: `0x${string}`; marketId: `0x${string}`; }
const MKTS: MktDef[] = [
  { idx: 0, sym: "vDOT", name: "Bifrost Liquid Staked DOT", protocol: "Bifrost", maturity: "Apr 19, 2026", tag: "DOT", accent: "#E6007A", assetAddr: CC.mockVDOT, ptAddr: CC.ptVDOT, ytAddr: CC.ytVDOT, ammAddr: CC.ammVDOT, marketId: CC.marketIdVDOT },
  { idx: 1, sym: "aUSDT", name: "Hydration Aave v3 USDT", protocol: "Hydration", maturity: "Apr 19, 2026", tag: "Stable", accent: "#26A17B", assetAddr: CC.mockAUSDT, ptAddr: CC.ptAUSDT, ytAddr: CC.ytAUSDT, ammAddr: CC.ammAUSDT, marketId: CC.marketIdAUSDT },
];
const STRATS = [
  { id: "split", title: "Split", subtitle: "Mint PT + YT", color: "#00ff88", risk: "None", horizon: "Any", desc: "Split asset 1:1 into PT + YT. Works always, no AMM needed.", icon: "⚛" },
  { id: "fixed", title: "Fixed Yield", subtitle: "Buy PT", color: "#00ff88", risk: "Low", horizon: "Hold to maturity", desc: "Lock in fixed APY. Splits + sells YT on AMM for more PT.", icon: "🛡" },
  { id: "long", title: "Long Yield", subtitle: "Buy YT", color: "#ff6b35", risk: "High", horizon: "Active", desc: "Leveraged yield bet. Splits + sells PT on AMM for more YT.", icon: "🔥" },
  { id: "earn", title: "Earn (LP)", subtitle: "Add Liquidity", color: "#a855f7", risk: "Medium", horizon: "Maturity", desc: "Provide LP to PT/Asset pool. Earn swap fees. Seeds the AMM.", icon: "💎" },
];

function ChartTip({ active, payload }: any) { if (!active || !payload?.length) return null; return <div className="bg-fission-surface p-2 border border-fission-outline-var/30 font-label text-xs">{payload.map((p: any, i: number) => <div key={i} style={{ color: p.color || "#e4e1e9" }}>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>)}</div>; }

// ── Hooks ──
function useAMM(addr: `0x${string}`) {
  const { data: ptp } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "getPTPrice" });
  const { data: ytp } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "getYTPrice" });
  const { data: ir } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "getImpliedRate" });
  const { data: rPT } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "reservePT" });
  const { data: rA } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "reserveAsset" });
  const { data: ttm } = useReadContract({ address: addr, abi: FissionAMMABI, functionName: "timeToMaturity" });
  const tvlRaw = rPT && rA ? Number(formatEther((rPT as bigint) + (rA as bigint))) : 0;
  return {
    ptPrice: ptp ? Number(formatEther(ptp as bigint)).toFixed(4) : "0.9700",
    ytPrice: ytp ? Number(formatEther(ytp as bigint)).toFixed(4) : "0.0300",
    impliedRate: ir ? (Number(formatEther(ir as bigint)) * 100).toFixed(1) : "7.2",
    tvl: tvlRaw.toFixed(0),
    tvlRaw,
    hasLiquidity: tvlRaw > 0,
    daysLeft: ttm ? Math.floor(Number(ttm) / 86400) : 30,
  };
}
function useBal(t: `0x${string}`) { const { address } = useAccount(); const { data } = useReadContract({ address: t, abi: ERC20ABI, functionName: "balanceOf", args: address ? [address] : undefined }); return data ? formatEther(data as bigint) : "0"; }

// ── Connect Button (native MetaMask) ──
function WalletBtn() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  if (isConnected) return <button onClick={() => disconnect()} className="frosted-console border border-fission-outline-var/30 px-4 py-2 font-label font-bold text-[10px] uppercase tracking-widest text-fission-on-surface">{short}</button>;
  return <button onClick={() => connect({ connector: injected() })} className="bg-fission-green text-fission-on-primary px-4 py-2 font-label font-bold text-[10px] uppercase tracking-widest hover:brightness-110">Connect MetaMask</button>;
}

// ── Router ──
type Route = { page: "landing" } | { page: "markets" } | { page: "strategy"; mi: number } | { page: "trade"; mi: number; st: string } | { page: "swap" } | { page: "dashboard" };
function parseHash(h: string): Route {
  const s = h.replace("#", "");
  if (s.startsWith("trade/")) { const p = s.split("/"); return { page: "trade", mi: +p[1] || 0, st: p[2] || "split" }; }
  if (s.startsWith("strategy/")) return { page: "strategy", mi: +(s.split("/")[1] || 0) };
  if (s === "markets") return { page: "markets" }; if (s === "swap") return { page: "swap" }; if (s === "dashboard") return { page: "dashboard" };
  return { page: "landing" };
}

export default function App() {
  const [route, setRoute] = useState<Route>({ page: "landing" });
  useEffect(() => { const fn = () => setRoute(parseHash(window.location.hash)); fn(); window.addEventListener("hashchange", fn); return () => window.removeEventListener("hashchange", fn); }, []);
  const nav = (h: string) => { window.location.hash = h; };
  return (<>{route.page !== "landing" && <Nav route={route} nav={nav} />}{route.page === "landing" && <Landing nav={nav} />}{route.page === "markets" && <Markets nav={nav} />}{route.page === "strategy" && <Strategy mi={route.mi} nav={nav} />}{route.page === "trade" && <Trade mi={route.mi} st={route.st} nav={nav} />}{route.page === "swap" && <Swap nav={nav} />}{route.page === "dashboard" && <Dash nav={nav} />}</>);
}

// ═══════ NAVBAR ═══════
function Nav({ route, nav }: { route: Route; nav: (h: string) => void }) {
  const isMk = route.page === "markets" || route.page === "strategy" || route.page === "trade";
  return (<nav className="fixed top-0 w-full z-50 border-b" style={{ background: "rgba(19,19,24,0.85)", backdropFilter: "blur(20px)", borderColor: "rgba(0,255,136,0.1)" }}><div className="flex justify-between items-center px-4 md:px-6 h-14 max-w-[1440px] mx-auto"><div className="flex items-center gap-5"><button onClick={() => nav("")} className="text-lg font-bold text-fission-green flex items-center gap-2 font-headline tracking-tighter"><span className="w-2.5 h-2.5 rounded-full bg-fission-green" /> Fission</button><div className="flex gap-0.5">{([["Markets","markets",isMk],["Swap","swap",route.page==="swap"],["Dashboard","dashboard",route.page==="dashboard"]] as const).map(([l,h,a])=>(<button key={h} onClick={()=>nav(h)} className={`px-3 py-1.5 text-xs font-label tracking-wider transition-all ${a?"text-fission-on-surface bg-fission-surface-high":"text-slate-500 hover:text-slate-300"}`}>{l}</button>))}</div></div><div className="flex items-center gap-3"><div className="hidden md:flex items-center gap-1.5 text-[10px] font-label text-slate-500 tracking-widest uppercase"><span className="w-1.5 h-1.5 rounded-full bg-fission-green animate-pulse"/>Polkadot Hub</div><WalletBtn /></div></div></nav>);
}

// ═══════ LANDING ═══════
function Landing({ nav }: { nav: (h: string) => void }) {
  return (<div className="min-h-screen" style={{background:"#131318"}}><header className="flex items-center justify-between px-6 h-16 border-b border-fission-outline-var/10"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-fission-green"/><span className="text-lg font-headline font-bold text-fission-green tracking-tighter">Fission</span></div><button onClick={()=>nav("markets")} className="bg-fission-green text-fission-on-primary px-5 py-2.5 font-label font-bold text-[10px] uppercase tracking-widest hover:brightness-110">Launch App →</button></header><div style={{background:"radial-gradient(ellipse at 50% 0%,rgba(0,255,136,0.06)0%,transparent 60%)"}}><div className="max-w-[900px] mx-auto px-6 pt-20 pb-16 text-center"><div className="inline-flex items-center gap-2 px-3 py-1 bg-fission-green/5 border border-fission-green/10 rounded-full mb-6"><span className="w-1.5 h-1.5 rounded-full bg-fission-green animate-pulse"/><span className="text-[10px] font-label uppercase tracking-widest text-fission-green">Live on Polkadot Hub · EVM Track</span></div><h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight tracking-tighter mb-5">Split your yield.<br/><span className="text-fission-green">Trade your future.</span></h1><p className="text-slate-400 max-w-xl mx-auto text-base font-light leading-relaxed mb-8">Fission tokenizes yield-bearing DOT and stablecoin positions into tradeable Principal Tokens and Yield Tokens on Polkadot Hub.</p><button onClick={()=>nav("markets")} className="bg-fission-green text-fission-on-primary px-10 py-4 font-label font-bold text-xs uppercase tracking-widest hover:brightness-110 pulse-glow">Start Trading</button><div className="flex justify-center gap-12 mt-16 pt-8 border-t border-fission-outline-var/10 flex-wrap">{[["2","Markets"],["Apr 2026","Maturity"],["Polkadot Hub","Network"],["6","Native Integrations"]].map(([v,l])=>(<div key={l} className="text-center"><div className="text-xl md:text-2xl font-headline font-bold">{v}</div><div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mt-1">{l}</div></div>))}</div></div></div>
  <div className="max-w-[1000px] mx-auto px-6 py-16"><div className="text-center mb-12"><span className="text-[10px] font-label text-fission-green uppercase tracking-[0.3em] block mb-2">How it works</span><h2 className="text-3xl font-headline font-bold tracking-tighter">Four steps to yield mastery</h2></div><div className="grid md:grid-cols-4 gap-1">{[{n:"01",t:"Deposit",d:"Deposit yield-bearing tokens (vDOT or aUSDT)"},{n:"02",t:"Split",d:"Split into Principal Token (PT) and Yield Token (YT)"},{n:"03",t:"Trade",d:"Buy PT for fixed yield or YT for leveraged exposure"},{n:"04",t:"Redeem",d:"Redeem PT 1:1 at maturity, claim yield from YT anytime"}].map((s,i)=>(<div key={s.n} className="p-7 bg-fission-surface-low border border-fission-outline-var/10" style={{borderTop:i===0?"2px solid rgba(0,255,136,0.3)":undefined}}><div className="w-10 h-10 bg-fission-green/10 border border-fission-green/20 flex items-center justify-center mb-5 animate-float" style={{animationDelay:`${i*0.3}s`}}><span className="font-headline font-bold text-fission-green text-sm">{s.n}</span></div><h3 className="font-headline font-bold text-base mb-2">{s.t}</h3><p className="text-sm text-slate-400 leading-relaxed">{s.d}</p></div>))}</div></div>
  <div className="max-w-[1000px] mx-auto px-6 pb-20"><div className="text-center mb-12"><h2 className="text-3xl font-headline font-bold tracking-tighter">Choose your strategy</h2></div><div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">{STRATS.map(s=>(<button key={s.id} onClick={()=>nav("markets")} className="text-left frosted-console border border-fission-outline-var/15 overflow-hidden" style={{borderColor:`${s.color}15`}}><div className="h-0.5" style={{background:`linear-gradient(90deg,${s.color},transparent)`}}/><div className="p-5"><span className="text-2xl block mb-3">{s.icon}</span><h3 className="font-headline font-bold text-base mb-0.5" style={{color:s.color}}>{s.title}</h3><div className="text-[10px] font-label uppercase tracking-widest mb-3" style={{color:s.color}}>{s.subtitle}</div><p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p></div></button>))}</div></div>
  <footer className="border-t border-fission-outline-var/10 px-6 py-6"><div className="max-w-[1000px] mx-auto flex justify-between items-center text-[10px] font-label text-slate-500 flex-wrap gap-2"><span className="font-bold text-slate-400">Fission Protocol</span><a href="https://github.com/penguinpecker/fission-protocol-polka" target="_blank" className="hover:text-fission-green">GitHub</a><span>Chain 420420419</span></div></footer></div>);
}

// ═══════ MARKETS ═══════
function Markets({ nav }: { nav: (h: string) => void }) {
  const a0 = useAMM(CC.ammVDOT); const a1 = useAMM(CC.ammAUSDT); const ad = [a0,a1];
  return (<div className="pt-20 pb-20 px-6 max-w-[900px] mx-auto"><h1 className="text-3xl font-headline font-bold tracking-tighter mb-1">Markets</h1><p className="text-slate-400 text-sm mb-8">Select a yield-bearing market to trade</p><div className="grid md:grid-cols-2 gap-4">{MKTS.map((m,i)=>{const a=ad[i];return(<button key={m.idx} onClick={()=>nav(`strategy/${m.idx}`)} className="text-left bg-fission-surface-low border border-fission-outline-var/10 p-6 hover:border-fission-green/20 transition-all"><div className="flex justify-between items-start mb-5"><div className="flex gap-3 items-center"><div className="w-11 h-11 bg-fission-surface-highest flex items-center justify-center text-xl font-headline font-bold" style={{color:m.accent}}>{m.sym[0]}</div><div><div className="text-lg font-headline font-bold">{m.sym}</div><div className="text-[10px] font-label text-slate-500 uppercase tracking-widest">{m.protocol} · {m.name}</div></div></div><span className="text-[9px] font-label px-2 py-1 uppercase tracking-wider" style={{background:`${m.accent}12`,color:m.accent,border:`1px solid ${m.accent}20`}}>{m.tag}</span></div><div className="grid grid-cols-4 gap-3">{([["Implied APY",`${a.impliedRate}%`,"#00ff88"],["TVL",a.hasLiquidity?`${a.tvl} ${m.sym}`:"No LP yet","#e4e1e9"],["Maturity",`${a.daysLeft}d`,"#E97880"],["Status",a.hasLiquidity?"Active":"Needs LP","#ff6b35"]] as const).map(([l,v,c])=>(<div key={l}><div className="text-[9px] font-label text-slate-600 uppercase tracking-widest mb-1">{l}</div><div className="text-sm font-headline font-bold" style={{color:c}}>{v}</div></div>))}</div></button>);})}</div></div>);
}

// ═══════ STRATEGY ═══════
function Strategy({ mi, nav }: { mi: number; nav: (h: string) => void }) {
  const m = MKTS[mi]||MKTS[0]; const amm = useAMM(m.ammAddr);
  const charts: Record<string,any[]> = { split: mkMini(7, 2), fixed: ptMini(0.94), long: mkMini(15, 6), earn: mkMini(10, 3) };
  return (<div className="pt-20 pb-20 px-6 max-w-[1020px] mx-auto"><button onClick={()=>nav("markets")} className="text-xs font-label text-slate-500 hover:text-fission-green mb-6 block">← Back to Markets</button><div className="flex items-center gap-3 mb-1"><div className="w-9 h-9 bg-fission-surface-highest flex items-center justify-center font-headline font-bold" style={{color:m.accent}}>{m.sym[0]}</div><h1 className="text-2xl font-headline font-bold tracking-tighter">{m.sym} Market</h1></div><p className="text-sm text-slate-400 mb-2">Implied APY: <span className="text-fission-green font-label font-bold">{amm.impliedRate}%</span> · Maturity: <span className="text-[#E97880] font-label">{m.maturity}</span></p>
  {!amm.hasLiquidity && <div className="mb-6 p-3 bg-fission-orange/10 border border-fission-orange/20 text-xs text-fission-orange font-label">⚠ AMM has no liquidity yet. Use <strong>Split</strong> first to get PT+YT, then <strong>Earn LP</strong> to seed the pool. Fixed/Long strategies need AMM liquidity.</div>}
  <div className="text-[10px] font-label text-fission-green uppercase tracking-[0.2em] mb-4 font-bold">Choose Your Strategy</div><div className="grid md:grid-cols-2 gap-4">{STRATS.map(s=>{
    const needsAMM = s.id === "fixed" || s.id === "long";
    const disabled = needsAMM && !amm.hasLiquidity;
    return(<button key={s.id} onClick={()=>!disabled && nav(`trade/${mi}/${s.id}`)} className={`text-left bg-fission-surface-low border border-fission-outline-var/10 overflow-hidden transition-all ${disabled?"opacity-40 cursor-not-allowed":"hover:border-opacity-30"}`} style={{borderColor:`${s.color}15`}}><div className="h-0.5" style={{background:`linear-gradient(90deg,${s.color},transparent)`}}/><div className="p-5"><div className="flex items-center gap-3 mb-2"><span className="text-xl">{s.icon}</span><div className="flex-1"><div className="font-headline font-bold" style={{color:s.color}}>{s.title}</div><div className="text-[10px] font-label" style={{color:s.color}}>{s.subtitle}</div></div>{disabled && <span className="text-[9px] font-label px-2 py-0.5 bg-fission-orange/10 text-fission-orange uppercase">Needs LP</span>}</div><p className="text-xs text-slate-400 leading-relaxed mb-3">{s.desc}</p><div className="flex gap-2"><span className="text-[9px] font-label px-2 py-0.5 uppercase" style={{background:`${s.color}12`,color:s.color}}>{s.risk} Risk</span></div></div><div className="h-14 opacity-50"><ResponsiveContainer width="100%" height="100%"><AreaChart data={charts[s.id]}><defs><linearGradient id={`gS${s.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.2}/><stop offset="100%" stopColor={s.color} stopOpacity={0}/></linearGradient></defs><Area dataKey={s.id==="fixed"?"price":"v"} stroke={s.color} fill={`url(#gS${s.id})`} strokeWidth={1.5} dot={false}/></AreaChart></ResponsiveContainer></div></button>);})}</div></div>);
}

// ═══════ TRADE — approve then execute, smart AMM fallback ═══════
function Trade({ mi, st, nav }: { mi: number; st: string; nav: (h: string) => void }) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const m = MKTS[mi]||MKTS[0]; const s = STRATS.find(x=>x.id===st)||STRATS[0];
  const amm = useAMM(m.ammAddr); const chartData = st==="fixed"?PT_DATA[mi]:YIELD_DATA[mi];
  const apv = amm.impliedRate;

  const [amt, setAmt] = useState("");
  const [phase, setPhase] = useState<"idle"|"approving"|"approved"|"executing"|"done">("idle");

  // Separate writeContract hooks for approve and execute
  const { writeContract: doApproveWrite, data: approveHash, isPending: approvePending, error: approveError } = useWriteContract();
  const { isSuccess: approveOk } = useWaitForTransactionReceipt({ hash: approveHash });
  const { writeContract: doExecWrite, data: execHash, isPending: execPending, error: execError } = useWriteContract();
  const { isSuccess: execOk } = useWaitForTransactionReceipt({ hash: execHash });

  // Mint uses its own hook
  const { writeContract: doMintWrite } = useWriteContract();

  const asBal = useBal(m.assetAddr); const ptB = useBal(m.ptAddr); const ytB = useBal(m.ytAddr);
  const rate = st==="fixed"?1/parseFloat(amm.ptPrice||"0.97"):st==="long"?1/parseFloat(amm.ytPrice||"0.03"):1;
  const out = amt?(parseFloat(amt)*(st==="split"?1:rate)).toFixed(4):"0.0000";
  const rcv = st==="fixed"?`PT-${m.sym}`:st==="long"?`YT-${m.sym}`:st==="split"?`PT + YT`:"LP Tokens";

  // Phase transitions
  useEffect(() => { if (approveOk && phase === "approving") setPhase("approved"); }, [approveOk, phase]);
  useEffect(() => { if (execOk && phase === "executing") setPhase("done"); }, [execOk, phase]);

  const handleApprove = () => {
    if (!amt || !isConnected) return;
    setPhase("approving");
    doApproveWrite({ address: m.assetAddr, abi: ERC20ABI, functionName: "approve", args: [CC.router, parseEther(amt)] });
  };

  const handleExecute = () => {
    if (!amt) return;
    setPhase("executing");
    const mId = m.marketId;
    const a = parseEther(amt);
    if (st === "split") {
      doExecWrite({ address: CC.router, abi: FissionRouterABI, functionName: "splitFromAsset", args: [mId, a] });
    } else if (st === "fixed") {
      doExecWrite({ address: CC.router, abi: FissionRouterABI, functionName: "splitAndSellYT", args: [mId, a, BigInt(0)] });
    } else if (st === "long") {
      doExecWrite({ address: CC.router, abi: FissionRouterABI, functionName: "splitAndSellPT", args: [mId, a, BigInt(0)] });
    } else {
      doExecWrite({ address: CC.router, abi: FissionRouterABI, functionName: "addLiquidityFromAsset", args: [mId, a, BigInt(0)] });
    }
  };

  const handleMint = () => {
    if (!address) return;
    doMintWrite({ address: m.assetAddr, abi: MockAssetABI, functionName: "mint", args: [address, parseEther("1000")] });
  };

  const hash = execHash || approveHash;
  const error = execError || approveError;

  return (<div className="pt-20 pb-20 px-6 max-w-[1100px] mx-auto"><button onClick={()=>nav(`strategy/${mi}`)} className="text-xs font-label text-slate-500 hover:text-fission-green mb-5 block">← Back to Strategies</button>
  <div className="flex gap-6 flex-wrap">
    {/* LEFT — Charts + Details */}
    <div className="flex-1 min-w-[320px] space-y-4">
      <div className="frosted-console border border-fission-outline-var/15 p-5"><div className="flex justify-between items-center mb-4"><div className="flex gap-3 items-center"><div className="w-8 h-8 bg-fission-surface-highest flex items-center justify-center font-headline font-bold text-sm" style={{color:m.accent}}>{m.sym[0]}</div><div><div className="font-headline font-bold">{m.sym}</div><div className="text-[10px] font-label text-slate-500">{m.protocol}</div></div></div><div className="text-right"><div className="text-xl font-headline font-bold" style={{color:s.color}}>{apv}%</div><div className="text-[10px] font-label text-slate-500">Implied APY</div></div></div>
      <div className="text-[10px] font-label text-slate-500 uppercase tracking-widest mb-2">{st==="fixed"?"PT Price Convergence":"Yield Rate History"}</div>
      <ResponsiveContainer width="100%" height={200}>{st==="fixed"?(<ComposedChart data={chartData}><defs><linearGradient id="gTr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity={0.12}/><stop offset="100%" stopColor={s.color} stopOpacity={0}/></linearGradient></defs><XAxis dataKey="d" tick={false} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#54516A",fontSize:10}} axisLine={false} tickLine={false} width={36} domain={[0.93,1.01]}/><Tooltip content={<ChartTip/>}/><Line dataKey="target" stroke="#54516A" strokeWidth={1} strokeDasharray="4 3" dot={false}/><Area dataKey="price" stroke={s.color} fill="url(#gTr)" strokeWidth={1.5} dot={false}/></ComposedChart>):(<ComposedChart data={chartData}><defs><linearGradient id="gTu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5C94FF" stopOpacity={0.12}/><stop offset="100%" stopColor="#5C94FF" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="d" tick={false} axisLine={false} tickLine={false}/><YAxis tick={{fill:"#54516A",fontSize:10}} axisLine={false} tickLine={false} width={28} unit="%"/><Tooltip content={<ChartTip/>}/><Area dataKey="underlying" name="Underlying" stroke="#5C94FF" fill="url(#gTu)" strokeWidth={1.5} dot={false}/><Area dataKey="implied" name="Implied" stroke="#ff6b35" fill="none" strokeWidth={1.5} dot={false}/><Line dataKey="fixed" name="Fixed" stroke="#00ff88" strokeWidth={1} strokeDasharray="4 3" dot={false}/></ComposedChart>)}</ResponsiveContainer></div>
      
      <div className="frosted-console border border-fission-outline-var/15 p-5"><div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-3 font-bold">Market Details</div><div className="grid grid-cols-3 gap-3">{([["Implied APY",`${amm.impliedRate}%`,"#5C94FF"],["PT Price",amm.ptPrice,"#00ff88"],["YT Price",amm.ytPrice,"#ff6b35"],["Maturity",`${amm.daysLeft}d left`,"#E97880"],["TVL",amm.hasLiquidity?`${amm.tvl} ${m.sym}`:"Empty","#e4e1e9"],["Protocol",m.protocol,"#908DA0"]] as [string,string,string][]).map(([l,v,c])=>(<div key={l}><div className="text-[9px] font-label text-slate-600 uppercase tracking-widest mb-0.5">{l}</div><div className="text-xs font-headline font-bold" style={{color:c}}>{v}</div></div>))}</div></div>

      {isConnected&&(parseFloat(ptB)>0||parseFloat(ytB)>0)&&(<div className="frosted-console border border-fission-outline-var/15 p-5"><div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-3 font-bold">Your Positions</div>{[{t:`PT-${m.sym}`,v:ptB,c:"#00ff88"},{t:`YT-${m.sym}`,v:ytB,c:"#ff6b35"}].filter(p=>parseFloat(p.v)>0).map(p=>(<div key={p.t} className="flex justify-between py-2 border-b border-fission-outline-var/10"><span className="text-sm font-headline font-bold" style={{color:p.c}}>{p.t}</span><span className="font-label text-sm">{parseFloat(p.v).toFixed(4)}</span></div>))}</div>)}
      
      {isConnected&&(<div className="frosted-console border border-fission-outline-var/15 p-4 flex justify-between items-center"><div><div className="text-xs font-label text-slate-400 font-bold">Need test tokens?</div><div className="text-[10px] font-label text-slate-600">Mint 1000 {m.sym}</div></div><button onClick={handleMint} className="bg-fission-green text-fission-on-primary px-4 py-2 font-label font-bold text-[10px] uppercase tracking-widest hover:brightness-110">Mint</button></div>)}
    </div>

    {/* RIGHT — Trade Panel */}
    <div className="w-full md:w-[380px] flex-shrink-0"><div className="frosted-console border border-fission-outline-var/15 sticky top-20 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-fission-outline-var/10" style={{background:`${s.color}08`}}><span className="text-xl">{s.icon}</span><span className="font-headline font-bold" style={{color:s.color}}>{s.title}</span><span className="font-label text-xs font-bold ml-auto" style={{color:s.color}}>{apv}% APY</span></div>
      <div className="p-5 space-y-3">
        {/* Input */}
        <div className="bg-fission-surface-high p-4"><div className="flex justify-between mb-2 text-[10px] font-label text-slate-500 uppercase tracking-wider"><span>You pay</span><span className="cursor-pointer" onClick={()=>setAmt(asBal)}>Bal: <span className="text-slate-400">{parseFloat(asBal).toFixed(2)}</span> <span className="text-fission-green font-bold">MAX</span></span></div><div className="flex items-center gap-2"><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent border-none text-xl font-headline font-bold focus:ring-0 focus:outline-none placeholder:text-fission-surface-highest"/><div className="px-3 py-1.5 bg-fission-bg font-headline font-bold text-sm" style={{color:m.accent}}>{m.sym}</div></div></div>

        <div className="text-center text-fission-green text-lg">↓</div>

        {/* Output */}
        <div className="bg-fission-bg/50 p-4"><div className="text-[10px] font-label text-slate-500 uppercase mb-2">You receive</div><div className="flex items-center gap-2"><span className="font-headline text-xl font-bold" style={{color:s.color}}>{out}</span><span className="ml-auto px-3 py-1 font-label text-xs font-bold" style={{color:s.color,background:`${s.color}12`}}>{rcv}</span></div></div>

        {/* Details */}
        <div className="text-xs">{([["APY",`${apv}%`,s.color],["Price Impact","<0.01%","#00ff88"],["Route",`${m.sym} → Router → ${rcv}`,"#908DA0"],["Fee","0.30%","#908DA0"]] as [string,string,string][]).map(([l,v,c],i)=>(<div key={l} className="flex justify-between py-2" style={{borderBottom:i<3?"1px solid rgba(59,75,61,0.2)":"none"}}><span className="text-slate-500">{l}</span><span className="font-label font-bold" style={{color:c}}>{v}</span></div>))}</div>

        {/* Action Buttons */}
        {!isConnected ? (
          <button onClick={()=>connect({connector:injected()})} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary hover:brightness-110">Connect MetaMask</button>
        ) : phase === "idle" || phase === "approving" ? (
          <button onClick={handleApprove} disabled={!amt||parseFloat(amt)<=0||approvePending} className="w-full py-4 font-headline font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40" style={{background:s.color,color:"#003919"}}>{approvePending?"Approving...":phase==="approving"?"Waiting...":`1/2 — Approve ${m.sym}`}</button>
        ) : phase === "approved" || phase === "executing" ? (
          <button onClick={handleExecute} disabled={execPending} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary hover:brightness-110 disabled:opacity-40">{execPending?"Confirming...":phase==="executing"?"Waiting...":s.id==="fixed"?"2/2 — Lock Fixed Yield":s.id==="long"?"2/2 — Long Yield":s.id==="earn"?"2/2 — Add LP":"2/2 — Split → PT + YT"}</button>
        ) : (
          <button onClick={()=>{setPhase("idle");setAmt("");}} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary hover:brightness-110">✓ Success — Trade Again</button>
        )}

        {/* Error display */}
        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-label break-all">{(error as any)?.shortMessage || (error as any)?.message?.slice(0, 150) || "Transaction failed"}</div>}

        {/* Tx link */}
        {hash && <a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block text-center text-[10px] font-label text-fission-green/60 hover:text-fission-green">View on Blockscout →</a>}

        {/* Explanation */}
        <div className="p-3 bg-fission-green/5 border border-fission-green/10 text-[10px] text-slate-400 leading-relaxed">
          {st==="split" ? `Step 1: Approve ${m.sym} → Step 2: Router.splitFromAsset → you receive equal PT + YT. No AMM needed.` :
           st==="fixed" ? `Step 1: Approve ${m.sym} → Step 2: Router.splitAndSellYT → splits, sells YT on AMM, you receive maximum PT.` :
           st==="long" ? `Step 1: Approve ${m.sym} → Step 2: Router.splitAndSellPT → splits, sells PT on AMM, you receive maximum YT.` :
           `Step 1: Approve ${m.sym} → Step 2: Router.addLiquidityFromAsset → splits half, adds PT + asset to AMM. Seeds liquidity.`}
        </div>
      </div>
    </div></div>
  </div></div>);
}

// ═══════ SWAP ═══════
function Swap({ nav }: { nav: (h: string) => void }) {
  const { address, isConnected } = useAccount(); const { connect } = useConnect();
  const [mki,setMki] = useState(0); const [dir,setDir] = useState<"buyPT"|"sellPT">("buyPT"); const [amt,setAmt] = useState("");
  const [phase,setPhase] = useState<"idle"|"approving"|"approved"|"swapping"|"done">("idle");
  const { writeContract: wA, data: aH, isPending: aP } = useWriteContract(); const { isSuccess: aOk } = useWaitForTransactionReceipt({ hash: aH });
  const { writeContract: wS, data: sH, isPending: sP, error: sErr } = useWriteContract(); const { isSuccess: sOk } = useWaitForTransactionReceipt({ hash: sH });
  useEffect(()=>{ if(aOk && phase==="approving") setPhase("approved"); },[aOk,phase]);
  useEffect(()=>{ if(sOk && phase==="swapping") setPhase("done"); },[sOk,phase]);
  const m = MKTS[mki]; const amm = useAMM(m.ammAddr); const asBal = useBal(m.assetAddr); const ptBal = useBal(m.ptAddr);
  const fBal = dir==="buyPT"?asBal:ptBal; const fSym = dir==="buyPT"?m.sym:`PT-${m.sym}`; const tSym = dir==="buyPT"?`PT-${m.sym}`:m.sym;
  const outAmt = amt?(parseFloat(amt)*0.997).toFixed(4):"0.0000";
  const doApprove = () => { if(!amt) return; setPhase("approving"); const t = dir==="buyPT"?m.assetAddr:m.ptAddr; wA({address:t,abi:ERC20ABI,functionName:"approve",args:[m.ammAddr,parseEther(amt)]}); };
  const doSwap = () => { if(!amt) return; setPhase("swapping"); const t = dir==="buyPT"?m.assetAddr:m.ptAddr; wS({address:m.ammAddr,abi:FissionAMMABI,functionName:"swap",args:[t,parseEther(amt),BigInt(0)]}); };
  const hash = sH || aH;
  return (<div className="pt-20 pb-20 px-6 max-w-xl mx-auto"><h1 className="text-2xl font-headline font-bold tracking-tighter mb-1">Swap</h1><p className="text-slate-400 text-sm mb-6">Trade yield tokens on Fission AMM</p>
  {!amm.hasLiquidity && <div className="mb-4 p-3 bg-fission-orange/10 border border-fission-orange/20 text-xs text-fission-orange font-label">⚠ AMM has no liquidity. Seed it first via Markets → Earn LP.</div>}
  <div className="flex gap-2 mb-4">{MKTS.map((mk,i)=>(<button key={i} onClick={()=>setMki(i)} className={`flex-1 py-2.5 font-label text-[10px] uppercase tracking-widest transition-all ${mki===i?"bg-fission-green/10 border border-fission-green/20 text-fission-green":"bg-fission-surface-low border border-fission-outline-var/10 text-slate-500"}`}>{mk.sym}</button>))}</div>
  <div className="grid grid-cols-2 gap-3 mb-4"><div className="p-3 bg-fission-surface-low border-l-2 border-fission-green"><div className="text-[9px] font-label text-slate-500 uppercase mb-0.5">PT Price</div><div className="text-lg font-headline font-bold">{amm.ptPrice}</div></div><div className="p-3 bg-fission-surface-low border-l-2 border-fission-orange"><div className="text-[9px] font-label text-slate-500 uppercase mb-0.5">YT Price</div><div className="text-lg font-headline font-bold text-fission-orange">{amm.ytPrice}</div></div></div>
  <div className="frosted-console border border-fission-outline-var/15 overflow-hidden"><div className="flex border-b border-fission-outline-var/10">{(["buyPT","sellPT"] as const).map(d=>(<button key={d} onClick={()=>setDir(d)} className={`flex-1 py-3 font-label text-[10px] uppercase tracking-widest ${dir===d?(d==="buyPT"?"text-fission-green border-b-2 border-fission-green bg-fission-green/5":"text-fission-orange border-b-2 border-fission-orange bg-fission-orange/5"):"text-slate-500"}`}>{d==="buyPT"?`Buy PT (${m.sym}→PT)`:`Sell PT (PT→${m.sym})`}</button>))}</div>
  <div className="p-6 space-y-4"><div><div className="flex justify-between mb-2 text-[10px] font-label text-slate-500 uppercase"><span>You sell</span><span className="cursor-pointer" onClick={()=>setAmt(fBal)}>Bal: {parseFloat(fBal).toFixed(2)} <span className="text-fission-green font-bold">MAX</span></span></div><div className="flex items-center gap-2 bg-fission-surface-high p-4"><span className="font-headline font-bold text-sm">{fSym}</span><input type="number" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent border-none text-right text-xl font-headline font-bold focus:ring-0 focus:outline-none placeholder:text-fission-surface-highest"/></div></div><div className="text-center text-fission-green">↓</div><div className="bg-fission-bg/50 p-4"><div className="text-[10px] font-label text-slate-500 uppercase mb-2">You receive</div><div className="flex justify-between"><span className="font-headline font-bold text-sm">{tSym}</span><span className="font-headline text-xl font-bold">{outAmt}</span></div></div>
  {!isConnected ? <button onClick={()=>connect({connector:injected()})} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary">Connect MetaMask</button>
  : phase==="idle"||phase==="approving" ? <button onClick={doApprove} disabled={!amt||aP} className="w-full py-4 font-headline font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40" style={{background:dir==="buyPT"?"#00ff88":"#ff6b35",color:dir==="buyPT"?"#003919":"#fff"}}>{aP?"Approving...":"1/2 — Approve"}</button>
  : phase==="approved"||phase==="swapping" ? <button onClick={doSwap} disabled={sP} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary hover:brightness-110 disabled:opacity-40">{sP?"Swapping...":"2/2 — Execute Swap"}</button>
  : <button onClick={()=>{setPhase("idle");setAmt("");}} className="w-full py-4 font-headline font-bold uppercase tracking-widest bg-fission-green text-fission-on-primary">✓ Done — Swap Again</button>}
  {sErr && <div className="p-2 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-label">{(sErr as any)?.shortMessage || "Swap failed"}</div>}
  {hash&&<a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block text-center text-[10px] font-label text-fission-green/60 hover:text-fission-green">View on Blockscout →</a>}</div></div></div>);
}

// ═══════ DASHBOARD ═══════
function Dash({ nav }: { nav: (h: string) => void }) {
  const { address, isConnected } = useAccount(); const { connect } = useConnect(); const { data: dotBal } = useBalance({ address });
  const { writeContract, data: hash } = useWriteContract();
  const vb = useBal(CC.mockVDOT); const ab = useBal(CC.mockAUSDT); const p1 = useBal(CC.ptVDOT); const y1 = useBal(CC.ytVDOT); const p2 = useBal(CC.ptAUSDT); const y2 = useBal(CC.ytAUSDT);
  const { data: cl1 } = useReadContract({address:CC.ytVDOT,abi:YieldTokenABI,functionName:"claimableYield",args:address?[address]:undefined});
  const { data: cl2 } = useReadContract({address:CC.ytAUSDT,abi:YieldTokenABI,functionName:"claimableYield",args:address?[address]:undefined});
  const claim = (mId:`0x${string}`) => writeContract({address:CC.fissionCore,abi:FissionCoreABI,functionName:"claimYield",args:[mId]});
  if(!isConnected) return (<div className="pt-20 pb-20 px-6 max-w-[900px] mx-auto text-center" style={{paddingTop:"140px"}}><div className="text-4xl mb-4">🛡</div><h2 className="text-2xl font-headline font-bold mb-2">Connect Your Wallet</h2><p className="text-slate-400 mb-6">View your positions and accrued yield.</p><button onClick={()=>connect({connector:injected()})} className="bg-fission-green text-fission-on-primary px-8 py-3 font-headline font-bold uppercase tracking-widest hover:brightness-110">Connect MetaMask</button></div>);
  const pos = [{t:"PT-vDOT",v:p1,d:"Fixed yield · redeemable 1:1",c:"#00ff88"},{t:"YT-vDOT",v:y1,d:"Variable yield · earns staking rewards",c:"#ff6b35",cl:cl1?formatEther(cl1 as bigint):"0",mId:CC.marketIdVDOT},{t:"PT-aUSDT",v:p2,d:"Fixed yield · redeemable 1:1",c:"#00ff88"},{t:"YT-aUSDT",v:y2,d:"Variable yield · earns lending rewards",c:"#26A17B",cl:cl2?formatEther(cl2 as bigint):"0",mId:CC.marketIdAUSDT}].filter(p=>parseFloat(p.v)>0);
  return (<div className="pt-20 pb-20 px-6 max-w-[900px] mx-auto"><h1 className="text-2xl font-headline font-bold tracking-tighter mb-6">Dashboard</h1><div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">{([["DOT",dotBal?Number(dotBal.formatted).toFixed(4):"0","#E6007A"],["vDOT",parseFloat(vb).toFixed(4),"#00ff88"],["aUSDT",parseFloat(ab).toFixed(4),"#26A17B"],["PT-vDOT",parseFloat(p1).toFixed(4),"#00ff88"],["YT-vDOT",parseFloat(y1).toFixed(4),"#ff6b35"]] as [string,string,string][]).map(([l,v,c])=>(<div key={l} className="p-4 bg-fission-surface-low border border-fission-outline-var/10"><div className="text-[9px] font-label text-slate-600 uppercase tracking-widest mb-1">{l}</div><div className="text-sm font-headline font-bold" style={{color:c}}>{v}</div></div>))}</div><div className="frosted-console border border-fission-outline-var/15 p-5 mb-4"><div className="font-headline font-bold mb-4">Active Positions</div>{pos.length===0&&<div className="text-center py-8 text-slate-500">No positions yet. Go to Markets → Split to get started.</div>}{pos.map(p=>(<div key={p.t} className="flex justify-between items-center py-3 border-b border-fission-outline-var/10"><div className="flex gap-3 items-center"><div className="w-8 h-8 bg-fission-surface-highest flex items-center justify-center text-[10px] font-headline font-bold" style={{color:p.c}}>{p.t.slice(0,2)}</div><div><div className="font-headline font-bold text-sm">{p.t}</div><div className="text-[10px] font-label text-slate-500">{p.d}</div></div></div><div className="text-right"><div className="font-headline font-bold" style={{color:p.c}}>{parseFloat(p.v).toFixed(4)}</div>{p.cl&&parseFloat(p.cl)>0&&(<button onClick={()=>claim(p.mId!)} className="text-[10px] font-label text-fission-green hover:brightness-110">Claim +{parseFloat(p.cl).toFixed(4)}</button>)}</div></div>))}</div><div className="frosted-console border border-fission-outline-var/15 p-4"><div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-1 font-bold">Wallet</div><div className="font-label text-sm break-all">{address}</div><div className="text-[10px] font-label text-slate-600 mt-1">Polkadot Hub · Chain 420420419</div></div>{hash&&<a href={`https://blockscout.polkadot.io/tx/${hash}`} target="_blank" className="block text-center text-xs font-label text-fission-green/60 hover:text-fission-green mt-4">View on Blockscout →</a>}</div>);
}
