"use client";

export function Hero() {
  return (
    <section className="text-center mb-12 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fission-accent/8 border border-fission-accent/15 text-fission-accent text-xs font-medium mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-fission-accent animate-pulse" />
        Live on Polkadot Hub
      </div>
      <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
        <span className="text-white">Split Your </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-fission-accent to-fission-accent-dim">
          Yield
        </span>
      </h1>
      <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
        Tokenize yield-bearing assets into Principal Tokens + Yield Tokens.
        Lock in fixed rates, speculate on yields, or earn swap fees.
      </p>
      <div className="flex justify-center gap-6 mt-8 text-xs text-white/20">
        <Stat label="Protocol TVL" value="20,000 DOT" />
        <Stat label="Markets" value="2 Active" />
        <Stat label="Integrations" value="6 Native" />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-display font-bold text-white/50 text-base">{value}</div>
      <div className="mt-0.5">{label}</div>
    </div>
  );
}
