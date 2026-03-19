import { defineChain } from "viem";

// ═══════════════════════════════════════════════════════════
//                    CHAIN DEFINITIONS
// ═══════════════════════════════════════════════════════════

export const polkadotHub = defineChain({
  id: 420420419,
  name: "Polkadot Hub",
  nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc.polkadot.io/"] },
    fallback: { http: ["https://services.polkadothub-rpc.com/mainnet/"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout.polkadot.io" },
  },
});

export const polkadotHubTestnet = defineChain({
  id: 420420422,
  name: "Polkadot Hub Testnet",
  nativeCurrency: { name: "DOT", symbol: "DOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://eth-rpc-testnet.polkadot.io/"] },
    fallback: { http: ["https://services.polkadothub-rpc.com/testnet/"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout-testnet.polkadot.io" },
  },
  testnet: true,
});

// ═══════════════════════════════════════════════════════════
//              CONTRACT ADDRESSES — LIVE ON MAINNET
// ═══════════════════════════════════════════════════════════

export const CONTRACTS = {
  // Polkadot Hub Mainnet (deployed March 20, 2026)
  [420420419]: {
    fissionCore: "0x208C305F9D1794461d7069be1003e7e979C38e3F" as `0x${string}`,
    router: "0xdF6122CF64847e43ECc2eFa2f1EEFD914A2d5c5d" as `0x${string}`,
    ammVDOT: "0x5CE39982b73BA6ba21d5B649CE61A283615F4A4E" as `0x${string}`,
    ammAUSDT: "0x242F0f2536CDFF40b0cBf802032715272929e474" as `0x${string}`,
    mockVDOT: "0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b" as `0x${string}`,
    mockAUSDT: "0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F" as `0x${string}`,
    ptVDOT: "0x5969de6df6643e242d878ef3775634a16bfcc616" as `0x${string}`,
    ytVDOT: "0x9f972e855cd442c39cddf440e68e028e8319f8aa" as `0x${string}`,
    ptAUSDT: "0x68ceecab0715aae2f49c90b6f68b595baa7b3f4b" as `0x${string}`,
    ytAUSDT: "0x9e0a2863c6c50bef1580e27e22b4ff586c036d60" as `0x${string}`,
    marketIdVDOT: "0xae4a6665d0665d17b30c1c2cb98707042fae466ed975a2ada8d882b0ee1e3ec4" as `0x${string}`,
    marketIdAUSDT: "0x66eaefbec28f53c2a89d41c69c381c9e057f776c289d2b60d58d4d07da94fe00" as `0x${string}`,
  },
  // Polkadot Hub Testnet (not yet deployed)
  [420420422]: {
    fissionCore: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    router: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ammVDOT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ammAUSDT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    mockVDOT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    mockAUSDT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ptVDOT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ytVDOT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ptAUSDT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ytAUSDT: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    marketIdVDOT: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
    marketIdAUSDT: "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`,
  },
} as const;

// ═══════════════════════════════════════════════════════════
//                    MARKET METADATA
// ═══════════════════════════════════════════════════════════

export interface MarketMeta {
  id: string;
  name: string;
  asset: string;
  assetSymbol: string;
  underlying: string;
  icon: string;
  description: string;
  apy: string;
  color: string;
}

export const MARKETS: MarketMeta[] = [
  {
    id: "vDOT",
    name: "vDOT Market",
    asset: "vDOT",
    assetSymbol: "vDOT",
    underlying: "DOT",
    icon: "⚛️",
    description: "Bifrost liquid staked DOT — earn staking yield",
    apy: "~15%",
    color: "#E6007A",
  },
  {
    id: "aUSDT",
    name: "aUSDT Market",
    asset: "aUSDT",
    assetSymbol: "aUSDT",
    underlying: "USDT",
    icon: "💵",
    description: "Hydration Aave v3 lending USDT — earn lending yield",
    apy: "~8%",
    color: "#26A17B",
  },
];
