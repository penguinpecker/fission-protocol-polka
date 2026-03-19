// SPDX-License-Identifier: MIT
// NOTE: This file documents the PVM (PolkaVM/RISC-V) compilation path for YieldMath.
//
// Polkadot Hub supports dual VM execution:
// - EVM (via pallet_revive ETH Proxy) — primary deployment target
// - PVM (PolkaVM RISC-V) — for computationally intensive math
//
// The YieldMath library can be compiled to PVM using the `resolc` compiler:
//   resolc --target riscv contracts/libraries/YieldMath.sol -o out/pvm/
//
// This gives ~3-5x gas savings on math-heavy operations like:
// - calcSwapOutput() — used on every AMM trade
// - calcImpliedRate() — used for yield curve pricing
// - calcLPValue() — used for LP token valuation
//
// Architecture:
// ┌─────────────────────────────────────────┐
// │          FissionRouter (EVM)             │
// │          FissionCore (EVM)               │
// │          FissionAMM (EVM)                │
// │               │                          │
// │     ┌─────────▼──────────┐              │
// │     │  YieldMath (PVM)   │ ← RISC-V    │
// │     │  via resolc        │   compiled   │
// │     └────────────────────┘              │
// └─────────────────────────────────────────┘
//
// Cross-VM calls use Polkadot Hub's native interop — EVM contracts
// can call PVM contracts at their address just like normal calls.
//
// For the hackathon, YieldMath is deployed as EVM for simplicity.
// The PVM version would be a performance optimization for mainnet.

pragma solidity ^0.8.24;

// Placeholder — see contracts/libraries/YieldMath.sol for implementation
// Compile with: resolc --target riscv contracts/libraries/YieldMath.sol
