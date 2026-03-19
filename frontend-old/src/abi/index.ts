// ═══════════════════════════════════════════════════════════
//                    FISSION CORE ABI
// ═══════════════════════════════════════════════════════════

export const FissionCoreABI = [
  {
    inputs: [{ name: "marketId", type: "bytes32" }, { name: "amount", type: "uint256" }],
    name: "split",
    outputs: [{ name: "ptMinted", type: "uint256" }, { name: "ytMinted", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "bytes32" }, { name: "amount", type: "uint256" }],
    name: "merge",
    outputs: [{ name: "assetReturned", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "bytes32" }, { name: "amount", type: "uint256" }],
    name: "redeemPT",
    outputs: [{ name: "assetReturned", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "bytes32" }],
    name: "claimYield",
    outputs: [{ name: "yieldClaimed", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "bytes32" }],
    name: "getMarket",
    outputs: [
      {
        components: [
          { name: "yieldBearingAsset", type: "address" },
          { name: "principalToken", type: "address" },
          { name: "yieldToken", type: "address" },
          { name: "maturity", type: "uint256" },
          { name: "yieldIndexStored", type: "uint256" },
          { name: "totalUnderlying", type: "uint256" },
          { name: "initialized", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "allMarketIds",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ═══════════════════════════════════════════════════════════
//                    FISSION ROUTER ABI
// ═══════════════════════════════════════════════════════════

export const FissionRouterABI = [
  {
    inputs: [{ name: "marketId", type: "bytes32" }, { name: "amount", type: "uint256" }],
    name: "splitFromAsset",
    outputs: [{ name: "ptAmount", type: "uint256" }, { name: "ytAmount", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "minPtOut", type: "uint256" },
    ],
    name: "splitAndSellYT",
    outputs: [{ name: "totalPt", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "minYtOut", type: "uint256" },
    ],
    name: "splitAndSellPT",
    outputs: [{ name: "totalYt", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "minLp", type: "uint256" },
    ],
    name: "addLiquidityFromAsset",
    outputs: [{ name: "lp", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ═══════════════════════════════════════════════════════════
//                    FISSION AMM ABI
// ═══════════════════════════════════════════════════════════

export const FissionAMMABI = [
  {
    inputs: [
      { name: "tokenIn", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minOut", type: "uint256" },
    ],
    name: "swap",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "ptAmount", type: "uint256" },
      { name: "assetAmount", type: "uint256" },
      { name: "minLp", type: "uint256" },
    ],
    name: "addLiquidity",
    outputs: [{ name: "lpMinted", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "lpAmount", type: "uint256" },
      { name: "minPt", type: "uint256" },
      { name: "minAsset", type: "uint256" },
    ],
    name: "removeLiquidity",
    outputs: [{ name: "ptOut", type: "uint256" }, { name: "assetOut", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getImpliedRate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPTPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getYTPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reservePT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "reserveAsset",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalLPSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "lpBalanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "timeToMaturity",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenIn", type: "address" }, { name: "amountIn", type: "uint256" }],
    name: "previewSwap",
    outputs: [{ name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ═══════════════════════════════════════════════════════════
//                      ERC-20 ABI
// ═══════════════════════════════════════════════════════════

export const ERC20ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "value", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ═══════════════════════════════════════════════════════════
//                   MOCK ASSET ABI
// ═══════════════════════════════════════════════════════════

export const MockAssetABI = [
  ...ERC20ABI,
  {
    inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "exchangeRate",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "basisPoints", type: "uint256" }],
    name: "accrueYield",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ═══════════════════════════════════════════════════════════
//                  YIELD TOKEN ABI
// ═══════════════════════════════════════════════════════════

export const YieldTokenABI = [
  ...ERC20ABI,
  {
    inputs: [{ name: "user", type: "address" }],
    name: "claimableYield",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yieldPerTokenStored",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maturity",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "timeToMaturity",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
