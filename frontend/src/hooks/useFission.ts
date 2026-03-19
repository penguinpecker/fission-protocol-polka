"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { CONTRACTS } from "@/config/contracts";
import { FissionCoreABI, FissionRouterABI, FissionAMMABI, ERC20ABI, MockAssetABI, YieldTokenABI } from "@/abi";

const CHAIN_ID = 420420419;
const c = CONTRACTS[CHAIN_ID];

export function useFissionCore() {
  const { address } = useAccount();

  const { data: marketCount } = useReadContract({
    address: c.fissionCore,
    abi: FissionCoreABI,
    functionName: "getMarketCount",
  });

  const { data: feeRate } = useReadContract({
    address: c.fissionCore,
    abi: FissionCoreABI,
    functionName: "feeRate",
  });

  return { marketCount, feeRate };
}

export function useMarketData(marketId: "vDOT" | "aUSDT") {
  const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
  const ammAddr = marketId === "vDOT" ? c.ammVDOT : c.ammAUSDT;

  const { data: market } = useReadContract({
    address: c.fissionCore,
    abi: FissionCoreABI,
    functionName: "getMarket",
    args: [mId as `0x${string}`],
  });

  const { data: ptPrice } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "getPTPrice",
  });

  const { data: ytPrice } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "getYTPrice",
  });

  const { data: impliedRate } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "getImpliedRate",
  });

  const { data: reservePT } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "reservePT",
  });

  const { data: reserveAsset } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "reserveAsset",
  });

  const { data: timeToMaturity } = useReadContract({
    address: ammAddr,
    abi: FissionAMMABI,
    functionName: "timeToMaturity",
  });

  return {
    market,
    ptPrice: ptPrice ? formatEther(ptPrice as bigint) : "0",
    ytPrice: ytPrice ? formatEther(ytPrice as bigint) : "0",
    impliedRate: impliedRate ? (Number(formatEther(impliedRate as bigint)) * 100).toFixed(2) : "0",
    reservePT: reservePT ? formatEther(reservePT as bigint) : "0",
    reserveAsset: reserveAsset ? formatEther(reserveAsset as bigint) : "0",
    timeToMaturity: timeToMaturity ? Number(timeToMaturity) : 0,
    marketId: mId,
    ammAddr,
  };
}

export function useTokenBalances(marketId: "vDOT" | "aUSDT") {
  const { address } = useAccount();
  const assetAddr = marketId === "vDOT" ? c.mockVDOT : c.mockAUSDT;
  const ptAddr = marketId === "vDOT" ? c.ptVDOT : c.ptAUSDT;
  const ytAddr = marketId === "vDOT" ? c.ytVDOT : c.ytAUSDT;

  const { data: assetBal } = useReadContract({
    address: assetAddr,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: ptBal } = useReadContract({
    address: ptAddr as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: ytBal } = useReadContract({
    address: ytAddr as `0x${string}`,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: claimable } = useReadContract({
    address: ytAddr as `0x${string}`,
    abi: YieldTokenABI,
    functionName: "claimableYield",
    args: address ? [address] : undefined,
  });

  return {
    assetBalance: assetBal ? formatEther(assetBal as bigint) : "0",
    ptBalance: ptBal ? formatEther(ptBal as bigint) : "0",
    ytBalance: ytBal ? formatEther(ytBal as bigint) : "0",
    claimableYield: claimable ? formatEther(claimable as bigint) : "0",
  };
}

export function useFissionActions() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mintMockTokens = (marketId: "vDOT" | "aUSDT", to: `0x${string}`, amount: string) => {
    const addr = marketId === "vDOT" ? c.mockVDOT : c.mockAUSDT;
    writeContract({
      address: addr,
      abi: MockAssetABI,
      functionName: "mint",
      args: [to, parseEther(amount)],
    });
  };

  const approveAsset = (marketId: "vDOT" | "aUSDT", spender: `0x${string}`, amount: string) => {
    const addr = marketId === "vDOT" ? c.mockVDOT : c.mockAUSDT;
    writeContract({
      address: addr,
      abi: ERC20ABI,
      functionName: "approve",
      args: [spender, parseEther(amount)],
    });
  };

  const splitFromAsset = (marketId: "vDOT" | "aUSDT", amount: string) => {
    const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
    writeContract({
      address: c.router,
      abi: FissionRouterABI,
      functionName: "splitFromAsset",
      args: [mId as `0x${string}`, parseEther(amount)],
    });
  };

  const splitAndSellYT = (marketId: "vDOT" | "aUSDT", amount: string) => {
    const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
    writeContract({
      address: c.router,
      abi: FissionRouterABI,
      functionName: "splitAndSellYT",
      args: [mId as `0x${string}`, parseEther(amount), BigInt(0)],
    });
  };

  const splitAndSellPT = (marketId: "vDOT" | "aUSDT", amount: string) => {
    const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
    writeContract({
      address: c.router,
      abi: FissionRouterABI,
      functionName: "splitAndSellPT",
      args: [mId as `0x${string}`, parseEther(amount), BigInt(0)],
    });
  };

  const addLiquidityFromAsset = (marketId: "vDOT" | "aUSDT", amount: string) => {
    const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
    writeContract({
      address: c.router,
      abi: FissionRouterABI,
      functionName: "addLiquidityFromAsset",
      args: [mId as `0x${string}`, parseEther(amount), BigInt(0)],
    });
  };

  const claimYield = (marketId: "vDOT" | "aUSDT") => {
    const mId = marketId === "vDOT" ? c.marketIdVDOT : c.marketIdAUSDT;
    writeContract({
      address: c.fissionCore,
      abi: FissionCoreABI,
      functionName: "claimYield",
      args: [mId as `0x${string}`],
    });
  };

  return {
    mintMockTokens,
    approveAsset,
    splitFromAsset,
    splitAndSellYT,
    splitAndSellPT,
    addLiquidityFromAsset,
    claimYield,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
}
