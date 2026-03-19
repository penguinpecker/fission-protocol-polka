import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { polkadotHub } from "./contracts";

export const wagmiConfig = createConfig({
  chains: [polkadotHub],
  connectors: [injected()],
  transports: {
    [polkadotHub.id]: http("https://eth-rpc.polkadot.io/"),
  },
  ssr: true,
});
