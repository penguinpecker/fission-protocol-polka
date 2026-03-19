# ⚛️ Fission Protocol

**Yield Tokenization for Polkadot Hub — Split, Trade, Optimize**

Fission Protocol brings Pendle-style yield tokenization to Polkadot Hub. Split yield-bearing assets (vDOT, aUSDT) into Principal Tokens (PT) + Yield Tokens (YT), enabling fixed-rate yields and yield speculation.

## 🏗️ Architecture

```
User deposits vDOT (yield-bearing)
         │
    ┌────▼────┐
    │ FissionCore │  ← Splits asset into PT + YT
    └────┬────┘
         │
    ┌────▼────┐
    │  PT + YT  │
    └────┬────┘
         │
  ┌──────┼──────┐
  │      │      │
 HOLD   TRADE   LP
  │      │      │
  │  FissionAMM │
  │      │      │
  ▼      ▼      ▼
Fixed  Yield   Swap
Rate   Spec    Fees
```

## 📦 Project Structure

```
fission-protocol/
├── contracts/           # Solidity smart contracts
│   ├── core/            # FissionCore, PrincipalToken, YieldToken
│   ├── amm/             # FissionAMM (time-weighted yield trading)
│   ├── router/          # FissionRouter (one-click flows)
│   ├── integrations/    # SLPx, XCM, Hyperbridge, Gasless adapters
│   ├── interfaces/      # All interfaces
│   ├── libraries/       # YieldMath library
│   └── mocks/           # MockVDOT, MockAUSDT for testing
├── script/              # Deployment scripts
├── test/                # Forge test suite
├── frontend/            # Next.js + Wagmi frontend
│   ├── src/
│   │   ├── app/         # Next.js app router
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── config/      # Chain & contract config
│   │   ├── abi/         # Contract ABIs
│   │   └── styles/      # Global CSS
│   └── public/          # Static assets
└── foundry.toml         # Foundry configuration
```

## 🚀 Quick Start

### Smart Contracts

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile
forge build

# Test
forge test -vvv

# Deploy to Polkadot Hub Testnet
forge script script/Deploy.s.sol --rpc-url https://eth-rpc-testnet.polkadot.io/ --broadcast --private-key YOUR_KEY

# Deploy to Polkadot Hub Mainnet
forge script script/Deploy.s.sol --rpc-url https://eth-rpc.polkadot.io/ --broadcast --private-key YOUR_KEY
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## 🔗 Polkadot Hub Configuration

| Network | Chain ID | RPC URL |
|---------|----------|---------|
| Mainnet | 420420419 | https://eth-rpc.polkadot.io/ |
| Testnet | 420420422 | https://eth-rpc-testnet.polkadot.io/ |

**Explorer:** https://blockscout.polkadot.io/

## ⚡ Key Features

- **Yield Tokenization**: Split vDOT/aUSDT into PT + YT
- **Fixed Yield**: Buy discounted PT, redeem 1:1 at maturity
- **Yield Speculation**: Buy YT to receive all streaming yield
- **LP Earning**: Provide liquidity to PT/asset AMM pools
- **Time-Weighted AMM**: Custom curve that flattens toward maturity
- **Gasless Swaps**: EIP-2771 meta-transactions via 0xGasless
- **Cross-Chain**: XCM + Hyperbridge for multi-chain deposits

## 🔌 Polkadot-Native Integrations

1. **XCM Precompile** — Cross-parachain vDOT deposits
2. **Bifrost SLPx** — DOT → vDOT liquid staking from Solidity
3. **Hyperbridge** — Accept vDOT from Ethereum/Arbitrum/Base
4. **0xGasless** — EIP-2771 gasless PT/YT swaps
5. **Dual VM** — EVM contracts + PVM YieldMath module
6. **Native Assets** — vDOT, DOT, USDT, USDC without wrappers

## 📄 License

MIT
