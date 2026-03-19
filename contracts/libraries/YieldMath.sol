// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title YieldMath - Core math for yield tokenization pricing
/// @notice Handles implied rate calculations, PT/YT pricing, and AMM swap math
/// @dev In production, this would be compiled to PVM RISC-V via resolc for performance.
///      For the hackathon, we deploy as EVM and show PVM version alongside.
library YieldMath {
    uint256 internal constant ONE = 1e18;  // 18 decimal fixed point
    uint256 internal constant YEAR = 365 days;

    /// @notice Calculate implied annual rate from PT price and time to maturity
    /// @param ptPrice PT price in terms of underlying (18 decimals, < 1e18 means discount)
    /// @param timeToMaturity Seconds until maturity
    /// @return impliedRate Annualized rate in 18 decimals (e.g. 0.15e18 = 15%)
    function calcImpliedRate(uint256 ptPrice, uint256 timeToMaturity) internal pure returns (uint256) {
        if (timeToMaturity == 0 || ptPrice >= ONE) return 0;

        // Simple linear approximation: rate = (1 - ptPrice) / ptPrice * (YEAR / timeToMaturity)
        // This avoids expensive exponential math while being accurate enough for < 1 year maturities
        uint256 discount = ONE - ptPrice;
        uint256 ratePerPeriod = (discount * ONE) / ptPrice;
        uint256 annualized = (ratePerPeriod * YEAR) / timeToMaturity;

        return annualized;
    }

    /// @notice Calculate PT price from implied rate and time to maturity
    /// @param impliedRate Annual rate in 18 decimals
    /// @param timeToMaturity Seconds until maturity
    /// @return ptPrice Price in 18 decimals (will be < 1e18, representing discount)
    function calcPTPrice(uint256 impliedRate, uint256 timeToMaturity) internal pure returns (uint256) {
        if (timeToMaturity == 0) return ONE;
        if (impliedRate == 0) return ONE;

        // ptPrice = 1 / (1 + rate * timeToMaturity / YEAR)
        uint256 periodRate = (impliedRate * timeToMaturity) / YEAR;
        uint256 ptPrice = (ONE * ONE) / (ONE + periodRate);

        return ptPrice;
    }

    /// @notice Calculate YT price from implied rate and time to maturity
    /// @param impliedRate Annual rate in 18 decimals
    /// @param timeToMaturity Seconds until maturity
    /// @return ytPrice Price in 18 decimals
    function calcYTPrice(uint256 impliedRate, uint256 timeToMaturity) internal pure returns (uint256) {
        // YT price = 1 - PT price (since PT + YT = 1 unit of underlying)
        uint256 ptPrice = calcPTPrice(impliedRate, timeToMaturity);
        if (ptPrice >= ONE) return 0;
        return ONE - ptPrice;
    }

    /// @notice Time-weighted AMM swap calculation
    /// @dev Uses a modified constant product formula that accounts for PT convergence to 1:1 at maturity.
    ///      As maturity approaches, the curve flattens (less slippage) because PT price certainty increases.
    /// @param amountIn Amount of token being sold
    /// @param reserveIn Reserve of token being sold
    /// @param reserveOut Reserve of token being bought
    /// @param timeToMaturity Seconds until maturity
    /// @param totalDuration Total duration of the market in seconds
    /// @return amountOut Amount of token received
    function calcSwapOutput(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint256 timeToMaturity,
        uint256 totalDuration
    ) internal pure returns (uint256) {
        require(reserveIn > 0 && reserveOut > 0, "YieldMath: zero reserves");
        require(amountIn > 0, "YieldMath: zero input");

        // Time weight factor: starts at 1.0, decreases toward 0 as maturity approaches
        // This makes the curve increasingly flat (stablecoin-like) near maturity
        // because PT is almost certain to be worth exactly 1 underlying
        uint256 timeWeight;
        if (totalDuration == 0) {
            timeWeight = ONE;
        } else {
            timeWeight = (timeToMaturity * ONE) / totalDuration;
            // Floor at 1% to avoid division issues at exact maturity
            if (timeWeight < ONE / 100) timeWeight = ONE / 100;
        }

        // Modified constant product: use x^w * y^w = k where w = timeWeight
        // Approximated as: amountOut = reserveOut * amountIn / (reserveIn + amountIn) * adjustment
        // The adjustment makes slippage lower as maturity approaches
        uint256 baseOut = (reserveOut * amountIn) / (reserveIn + amountIn);

        // Apply time-weight adjustment: blend between constant-product and constant-sum
        // At timeWeight=1 (start): pure constant product (normal AMM slippage)
        // At timeWeight→0 (maturity): approaches constant sum (minimal slippage, stableswap-like)
        uint256 constantSumOut = (reserveOut * amountIn) / (reserveIn + reserveOut);

        // Weighted blend
        uint256 amountOut = (baseOut * timeWeight + constantSumOut * (ONE - timeWeight)) / ONE;

        require(amountOut < reserveOut, "YieldMath: insufficient liquidity");

        return amountOut;
    }

    /// @notice Calculate LP token value in terms of underlying
    /// @param ptReserve PT tokens in pool
    /// @param assetReserve Underlying asset in pool
    /// @param totalLpSupply Total LP tokens outstanding
    /// @param ptPrice Current PT price
    /// @return valuePerLp Value of 1 LP token in underlying (18 decimals)
    function calcLPValue(
        uint256 ptReserve,
        uint256 assetReserve,
        uint256 totalLpSupply,
        uint256 ptPrice
    ) internal pure returns (uint256) {
        if (totalLpSupply == 0) return 0;
        uint256 ptValueInAsset = (ptReserve * ptPrice) / ONE;
        uint256 totalValue = ptValueInAsset + assetReserve;
        return (totalValue * ONE) / totalLpSupply;
    }

    /// @notice Calculate fee-adjusted amount
    /// @param amount Original amount
    /// @param feeRate Fee in 18 decimals (e.g. 0.003e18 = 0.3%)
    /// @return Amount after fee deduction
    function deductFee(uint256 amount, uint256 feeRate) internal pure returns (uint256) {
        return (amount * (ONE - feeRate)) / ONE;
    }
}
