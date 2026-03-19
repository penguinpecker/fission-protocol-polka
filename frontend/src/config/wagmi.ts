import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polkadotHub, polkadotHubTestnet } from "./contracts";

export const wagmiConfig = getDefaultConfig({
  appName: "Fission Protocol",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [polkadotHub, polkadotHubTestnet],
  ssr: true,
});
