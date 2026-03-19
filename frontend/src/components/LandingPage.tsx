"use client";

import { CONTRACTS } from "@/config/contracts";

const C = CONTRACTS[420420419];

export function LandingPage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="pt-24 pb-20 px-6 max-w-[1440px] mx-auto">
      {/* HERO */}
      <header className="relative mb-28">
        <div className="grid lg:grid-cols-2 gap-12 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-fission-green/5 border border-fission-green/10 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-fission-green animate-pulse" />
              <span className="text-[10px] font-label uppercase tracking-widest text-fission-green">Live on Polkadot Hub Mainnet</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-headline font-bold leading-tight tracking-tighter mb-6">
              Split Your <br /><span className="text-fission-green">Yield</span>
            </h1>
            <p className="text-slate-400 max-w-md text-lg font-light leading-relaxed mb-8">
              Fission Protocol enables users to separate yield-bearing assets into principal and yield components, creating capital efficiency and fixed-rate returns on Polkadot.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setPage("trade")} className="bg-fission-green text-fission-on-primary px-8 py-4 font-label font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all pulse-glow">Launch App</button>
              <a href="https://github.com/penguinpecker/fission-protocol-polka" target="_blank" className="frosted-console border border-fission-outline-var/30 px-8 py-4 font-label text-xs uppercase tracking-widest text-slate-300 hover:text-white hover:border-fission-green/30 transition-all">GitHub</a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-fission-surface-low border border-fission-outline-var/15">
            {[
              { label: "Protocol TVL", value: "$124M", color: "text-fission-green" },
              { label: "Total Markets", value: "2", color: "text-fission-on-surface" },
              { label: "Integrations", value: "6 Native", color: "text-slate-300" },
            ].map((s) => (
              <div key={s.label} className="bg-fission-bg p-6 flex flex-col gap-1">
                <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest">{s.label}</span>
                <span className={`text-2xl font-headline font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="mb-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-label text-fission-green uppercase tracking-[0.3em] block mb-3">The Mechanism</span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-4">How Yield Tokenization Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Fission splits yield-bearing assets into two tradeable tokens — unlocking fixed income, yield speculation, and LP strategies on Polkadot.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-1">
          {[
            { num: "01", title: "Deposit", desc: "Deposit a yield-bearing asset like vDOT (Bifrost liquid staked DOT) or aUSDT (Hydration lending USDT) into Fission.", icon: "→" },
            { num: "02", title: "Split", desc: "Fission Core splits your asset 1:1 into PT (Principal Token) + YT (Yield Token). 100 vDOT → 100 PT-vDOT + 100 YT-vDOT.", icon: "⚛" },
            { num: "03", title: "Trade", desc: "Trade PT and YT on the time-weighted AMM. Buy PT for fixed yield, buy YT to go long on yield, or provide LP for swap fees.", icon: "↗" },
            { num: "04", title: "Redeem", desc: "At maturity, redeem PT 1:1 for underlying. YT holders claim all accrued yield. Or merge PT+YT back anytime.", icon: "✓" },
          ].map((step, i) => (
            <div key={step.num} className="relative p-8 bg-fission-surface-low border border-fission-outline-var/10 group hover:border-fission-green/20 transition-all">
              <div className="w-12 h-12 bg-fission-green/10 border border-fission-green/20 flex items-center justify-center mb-6 animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
                <span className="font-headline font-bold text-fission-green text-lg">{step.num}</span>
              </div>
              <h3 className="font-headline font-bold text-lg mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
              <div className="absolute bottom-4 right-4 text-6xl font-headline font-black opacity-5 group-hover:opacity-10 transition-opacity">{step.icon}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THREE STRATEGIES */}
      <section className="mb-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-label text-fission-orange uppercase tracking-[0.3em] block mb-3">Yield Strategies</span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-4">Three Ways to Win</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Whether you want guaranteed returns, leveraged yield exposure, or passive fee income — Fission has a strategy for every risk profile.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Fixed Yield", subtitle: "Buy PT · Low Risk", color: "green", icon: "🛡",
              desc: "Buy PT at a discount to face value. At maturity, redeem 1:1 for the underlying. The discount IS your guaranteed fixed rate.",
              example: [["Example", "Buy 100 PT-vDOT @ 0.988"], ["At Maturity", "Redeem for 100 vDOT"], ["Fixed Profit", "+1.2 vDOT (≈14.8% APY)"]],
              bestFor: "Conservative yield farmers, treasuries, DAOs seeking predictable returns",
            },
            {
              title: "Long Yield", subtitle: "Buy YT · High Risk/Reward", color: "orange", icon: "🔥",
              desc: "Buy YT to receive ALL streaming yield from the underlying asset until maturity. If rates rise, your YT becomes worth significantly more.",
              example: [["Example", "Buy 100 YT-vDOT @ 0.012"], ["Cost", "1.2 vDOT for 100 YT"], ["If 15% APY Holds", "+3.75 vDOT yield (312% ROI)"]],
              bestFor: "Yield speculators, airdrop hunters, conviction plays on rising rates",
            },
            {
              title: "Earn (LP)", subtitle: "Provide Liquidity · Medium Risk", color: "purple", icon: "💎",
              desc: "Provide liquidity to the PT/Asset AMM pool. Earn swap fees from traders plus underlying yield. Minimal IL at maturity.",
              example: [["Deposit", "100 vDOT → auto-split → LP"], ["Earn", "Swap fees + YT yield"], ["LP APY", "~21.5% combined"]],
              bestFor: "Passive earners, LPs seeking low-IL pools with real yield",
            },
          ].map((s) => {
            const colorMap: Record<string, string> = { green: "#00ff88", orange: "#ff6b35", purple: "#a855f7" };
            const c = colorMap[s.color];
            return (
              <div key={s.title} className="frosted-console border border-fission-outline-var/15 p-1 overflow-hidden group transition-all" style={{ borderColor: undefined }}>
                <div className="p-8" style={{ background: `radial-gradient(circle at top right, ${c}15, transparent 70%)` }}>
                  <div className="w-14 h-14 border flex items-center justify-center mb-6 text-2xl" style={{ background: `${c}10`, borderColor: `${c}30` }}>{s.icon}</div>
                  <h3 className="font-headline font-bold text-2xl mb-2" style={{ color: c }}>{s.title}</h3>
                  <div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-4">{s.subtitle}</div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{s.desc}</p>
                  <div className="bg-fission-bg/50 p-4 space-y-3 mb-6">
                    {s.example.map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs font-label">
                        <span className="text-slate-500">{k}</span>
                        <span style={{ color: k.includes("Profit") || k.includes("APY") || k.includes("ROI") ? c : "#e4e1e9" }} className="font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">Best for: <span className="text-fission-on-surface">{s.bestFor}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PT vs YT EXPLAINER */}
      <section className="mb-28">
        <div className="frosted-console border border-fission-outline-var/15 p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-bold tracking-tighter mb-4">PT + YT = 1 Unit of Asset</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">The fundamental invariant: splitting and merging are always 1:1. No value is created or destroyed — only separated into different risk profiles.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center p-6 bg-fission-green/5 border border-fission-green/15">
              <div className="text-4xl font-headline font-bold text-fission-green mb-2">PT</div>
              <div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-4">Principal Token</div>
              <ul className="text-sm text-slate-400 space-y-2 text-left">
                <li>• Redeemable 1:1 at maturity</li>
                <li>• Trades at discount before maturity</li>
                <li>• Discount = your fixed yield</li>
                <li>• Zero yield risk — guaranteed return</li>
                <li>• Like a zero-coupon bond</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-6xl font-headline font-bold text-slate-600 mb-2">+</div>
              <div className="text-xs font-label text-slate-500">ALWAYS EQUALS</div>
              <div className="text-lg font-headline font-bold text-fission-on-surface mt-2">1 Underlying</div>
            </div>
            <div className="text-center p-6 bg-fission-orange/5 border border-fission-orange/15">
              <div className="text-4xl font-headline font-bold text-fission-orange mb-2">YT</div>
              <div className="text-xs font-label text-slate-500 uppercase tracking-widest mb-4">Yield Token</div>
              <ul className="text-sm text-slate-400 space-y-2 text-left">
                <li>• Receives ALL streaming yield</li>
                <li>• Worth 0 at maturity (yield exhausted)</li>
                <li>• Value = accumulated future yield</li>
                <li>• Leveraged yield exposure</li>
                <li>• Like an interest rate swap</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6 INTEGRATIONS */}
      <section className="mb-28">
        <div className="text-center mb-16">
          <span className="text-[10px] font-label text-fission-pink uppercase tracking-[0.3em] block mb-3">Ecosystem</span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mb-4">6 Polkadot-Native Integrations</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "XCM Precompile", desc: "Accept vDOT cross-chain from Bifrost and Hydration parachains", color: "#00ff88" },
            { name: "Bifrost SLPx", desc: "One-click DOT → vDOT liquid staking from Solidity contracts", color: "#00ff88" },
            { name: "Hyperbridge", desc: "Accept vDOT from Ethereum, Arbitrum, Base — $400M+ volume", color: "#ff6b35" },
            { name: "0xGasless", desc: "EIP-2771 meta-transactions for gasless PT/YT swaps", color: "#ff6b35" },
            { name: "Dual VM (EVM+PVM)", desc: "YieldMath compilable to RISC-V via resolc for 3-5x gas savings", color: "#a855f7" },
            { name: "Native Assets", desc: "vDOT, DOT, USDT, USDC are native on Hub — no wrapped tokens", color: "#a855f7" },
          ].map((int) => (
            <div key={int.name} className="p-6 bg-fission-surface-low hover:bg-fission-surface transition-all" style={{ borderLeft: `2px solid ${int.color}` }}>
              <div className="text-xs font-label uppercase tracking-widest mb-2" style={{ color: int.color }}>{int.name}</div>
              <p className="text-sm text-slate-400">{int.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE MARKETS */}
      <section className="mb-28">
        <div className="flex justify-between items-center border-b border-fission-outline-var/15 pb-4 mb-8">
          <h2 className="text-xl font-headline font-bold uppercase tracking-tighter">Live Markets</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { name: "vDOT", sub: "Bifrost Liquid Staked DOT", apy: "~15.42%", price: "$11.24", gradient: "yield-gradient-green", color: "text-fission-green", btnBg: "bg-fission-green", btnText: "text-fission-on-primary", watermark: "VDOT" },
            { name: "aUSDT", sub: "Hydration Aave v3 USDT", apy: "~8.15%", price: "$1.001", gradient: "yield-gradient-pink", color: "text-fission-pink", btnBg: "bg-fission-pink", btnText: "text-white", watermark: "USDT" },
          ].map((m) => (
            <div key={m.name} className={`group relative frosted-console border border-fission-outline-var/15 p-1 overflow-hidden ${m.gradient} transition-all`}>
              <div className="p-8">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="text-2xl font-headline font-bold">{m.name}</h3>
                    <span className="text-[10px] font-label text-slate-500 uppercase tracking-widest">{m.sub}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-label text-slate-500 uppercase mb-1">Estimated APY</div>
                    <div className={`text-4xl font-headline font-bold ${m.color}`}>{m.apy}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-fission-surface-low/50">
                    <span className="text-[10px] font-label text-slate-500 uppercase block mb-1">Price</span>
                    <span className="font-headline font-medium text-lg">{m.price}</span>
                  </div>
                  <div className="p-4 bg-fission-surface-low/50">
                    <span className="text-[10px] font-label text-slate-500 uppercase block mb-1">Maturity</span>
                    <span className="font-headline font-medium text-lg">Apr 19, 2026</span>
                  </div>
                </div>
                <button onClick={() => setPage("trade")} className={`w-full ${m.btnBg} ${m.btnText} py-4 font-label font-bold uppercase tracking-widest text-xs transition-all hover:brightness-110`}>
                  Trade {m.name}
                </button>
              </div>
              <div className="absolute bottom-0 right-0 p-2 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <span className="text-8xl font-headline font-black">{m.watermark}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-12 border-t border-fission-outline-var/15">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <div className="text-lg font-headline font-bold text-fission-green mb-4 tracking-tighter">Fission Core Registry</div>
            <div className="space-y-3 font-label text-[11px]">
              {[
                ["FissionCore", C.fissionCore],
                ["Router", C.router],
                ["AMM vDOT", C.ammVDOT],
                ["AMM aUSDT", C.ammAUSDT],
              ].map(([name, addr]) => (
                <div key={name} className="flex justify-between items-center p-3 bg-fission-surface-low border-l-2 border-fission-outline-var">
                  <span className="text-slate-500 uppercase">{name}</span>
                  <a href={`https://blockscout.polkadot.io/address/${addr}`} target="_blank" className="text-fission-on-surface hover:text-fission-green transition-colors">
                    {addr.slice(0, 6)}...{addr.slice(-4)}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">Resources</h4>
            {["Documentation", "Yield Mechanics", "Security Audits"].map((r) => (
              <div key={r} className="text-sm cursor-pointer hover:text-fission-green transition-colors">{r}</div>
            ))}
          </div>
          <div className="space-y-4">
            <h4 className="font-label text-xs uppercase tracking-[0.2em] text-slate-500">Ecosystem</h4>
            {["Polkadot Relay", "Bifrost Network", "Hydration", "Blockscout"].map((r) => (
              <div key={r} className="text-sm cursor-pointer hover:text-fission-green transition-colors">{r}</div>
            ))}
          </div>
        </div>
        <div className="mt-20 flex justify-between items-center text-[10px] font-label text-slate-600 uppercase tracking-widest pb-8">
          <span>© 2026 Fission Protocol. Chain 420420419.</span>
          <a href="https://github.com/penguinpecker/fission-protocol-polka" target="_blank" className="hover:text-fission-on-surface">Github</a>
        </div>
      </footer>
    </div>
  );
}
