// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../libraries/YieldMath.sol";
import "../core/PrincipalToken.sol";
import "../interfaces/IFission.sol";

/// @title FissionAMM - Yield Trading AMM
/// @notice Custom AMM for trading PT against the underlying yield-bearing asset.
///         Uses a time-weighted curve that flattens as maturity approaches,
///         because PT certainty increases toward 1:1 redemption value.
///
/// @dev Pool structure: PT-vDOT <> vDOT (or PT-aUSDT <> aUSDT)
///      - LPs deposit both PT and underlying asset
///      - Traders swap between PT and underlying
///      - The swap curve accounts for time-to-maturity
///      - At maturity, PT = underlying (no slippage)
///
///      YT is NOT directly in the pool. YT trades are routed through:
///      Buy YT: deposit underlying → split via FissionCore → keep YT, sell PT on AMM
///      Sell YT: buy PT on AMM → merge PT+YT via FissionCore → get underlying
///
contract FissionAMM is IFissionAMM {
    using YieldMath for uint256;

    // ═══════════════════════════════════════════════════════════
    //                         STATE
    // ═══════════════════════════════════════════════════════════

    address public immutable fissionCore;
    bytes32 public immutable marketId;
    address public immutable pt;              // Principal Token
    address public immutable yieldBearingAsset; // e.g. vDOT, aUSDT
    uint256 public immutable maturity;
    uint256 public immutable marketCreatedAt;

    /// @notice Pool reserves
    uint256 public reservePT;
    uint256 public reserveAsset;

    /// @notice LP token state (simple built-in LP, not a separate ERC-20 for hackathon simplicity)
    uint256 public totalLPSupply;
    mapping(address => uint256) public lpBalanceOf;

    /// @notice Swap fee: 0.3% = 3e15
    uint256 public constant SWAP_FEE = 3e15;

    /// @notice Collected protocol fees
    uint256 public collectedFees;

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(
        address _fissionCore,
        bytes32 _marketId,
        address _pt,
        address _yieldBearingAsset,
        uint256 _maturity
    ) {
        fissionCore = _fissionCore;
        marketId = _marketId;
        pt = _pt;
        yieldBearingAsset = _yieldBearingAsset;
        maturity = _maturity;
        marketCreatedAt = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                         SWAP
    // ═══════════════════════════════════════════════════════════

    /// @notice Swap between PT and underlying asset
    /// @param tokenIn Address of token being sold (must be PT or underlying)
    /// @param amountIn Amount of tokenIn to sell
    /// @param minOut Minimum acceptable output (slippage protection)
    /// @return amountOut Amount of output token received
    function swap(address tokenIn, uint256 amountIn, uint256 minOut)
        external
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "AMM: zero input");
        require(tokenIn == pt || tokenIn == yieldBearingAsset, "AMM: invalid token");
        require(block.timestamp < maturity, "AMM: market expired");

        // Deduct swap fee
        uint256 fee = (amountIn * SWAP_FEE) / 1e18;
        uint256 amountInAfterFee = amountIn - fee;
        collectedFees += fee;

        // Determine direction
        bool isPTIn = (tokenIn == pt);
        uint256 resIn = isPTIn ? reservePT : reserveAsset;
        uint256 resOut = isPTIn ? reserveAsset : reservePT;

        // Calculate output using time-weighted math
        uint256 timeToMat = maturity > block.timestamp ? maturity - block.timestamp : 0;
        uint256 totalDuration = maturity - marketCreatedAt;

        amountOut = YieldMath.calcSwapOutput(
            amountInAfterFee,
            resIn,
            resOut,
            timeToMat,
            totalDuration
        );

        require(amountOut >= minOut, "AMM: slippage exceeded");

        // Transfer tokens
        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        address tokenOut = isPTIn ? yieldBearingAsset : pt;
        _safeTransfer(tokenOut, msg.sender, amountOut);

        // Update reserves
        if (isPTIn) {
            reservePT += amountIn;
            reserveAsset -= amountOut;
        } else {
            reserveAsset += amountIn;
            reservePT -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    // ═══════════════════════════════════════════════════════════
    //                     ADD LIQUIDITY
    // ═══════════════════════════════════════════════════════════

    /// @notice Add liquidity to the PT/underlying pool
    /// @param ptAmount Amount of PT to deposit
    /// @param assetAmount Amount of underlying asset to deposit
    /// @param minLp Minimum LP tokens to receive
    /// @return lpMinted Amount of LP tokens minted
    function addLiquidity(uint256 ptAmount, uint256 assetAmount, uint256 minLp)
        external
        returns (uint256 lpMinted)
    {
        require(ptAmount > 0 && assetAmount > 0, "AMM: zero amounts");

        if (totalLPSupply == 0) {
            // First LP — set initial ratio
            // Use geometric mean for initial LP mint
            lpMinted = _sqrt(ptAmount * assetAmount);
            require(lpMinted > 1000, "AMM: initial liquidity too low");
            lpMinted -= 1000; // Lock minimum liquidity (prevent manipulation)
            totalLPSupply += 1000; // Dead shares
        } else {
            // Subsequent LPs — must match current ratio
            uint256 lpFromPT = (ptAmount * totalLPSupply) / reservePT;
            uint256 lpFromAsset = (assetAmount * totalLPSupply) / reserveAsset;
            lpMinted = lpFromPT < lpFromAsset ? lpFromPT : lpFromAsset;
        }

        require(lpMinted >= minLp, "AMM: insufficient LP");

        // Transfer tokens in
        _safeTransferFrom(pt, msg.sender, address(this), ptAmount);
        _safeTransferFrom(yieldBearingAsset, msg.sender, address(this), assetAmount);

        // Update state
        reservePT += ptAmount;
        reserveAsset += assetAmount;
        totalLPSupply += lpMinted;
        lpBalanceOf[msg.sender] += lpMinted;

        emit LiquidityAdded(msg.sender, ptAmount, assetAmount, lpMinted);
    }

    // ═══════════════════════════════════════════════════════════
    //                    REMOVE LIQUIDITY
    // ═══════════════════════════════════════════════════════════

    /// @notice Remove liquidity from the pool
    /// @param lpAmount Amount of LP tokens to burn
    /// @param minPt Minimum PT to receive
    /// @param minAsset Minimum underlying to receive
    /// @return ptOut PT tokens returned
    /// @return assetOut Underlying tokens returned
    function removeLiquidity(uint256 lpAmount, uint256 minPt, uint256 minAsset)
        external
        returns (uint256 ptOut, uint256 assetOut)
    {
        require(lpAmount > 0, "AMM: zero LP");
        require(lpBalanceOf[msg.sender] >= lpAmount, "AMM: insufficient LP");

        // Calculate proportional share
        ptOut = (lpAmount * reservePT) / totalLPSupply;
        assetOut = (lpAmount * reserveAsset) / totalLPSupply;

        require(ptOut >= minPt && assetOut >= minAsset, "AMM: slippage exceeded");

        // Update state
        lpBalanceOf[msg.sender] -= lpAmount;
        totalLPSupply -= lpAmount;
        reservePT -= ptOut;
        reserveAsset -= assetOut;

        // Transfer tokens out
        _safeTransfer(pt, msg.sender, ptOut);
        _safeTransfer(yieldBearingAsset, msg.sender, assetOut);

        emit LiquidityRemoved(msg.sender, lpAmount, ptOut, assetOut);
    }

    // ═══════════════════════════════════════════════════════════
    //                     VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    /// @notice Get the current implied annual yield rate from PT price
    function getImpliedRate() external view returns (uint256) {
        if (reservePT == 0 || reserveAsset == 0) return 0;
        uint256 ptPrice = getPTPrice();
        uint256 timeToMat = maturity > block.timestamp ? maturity - block.timestamp : 0;
        return YieldMath.calcImpliedRate(ptPrice, timeToMat);
    }

    /// @notice Get current PT price in terms of underlying
    /// @return price 18 decimal price (e.g. 0.988e18 means PT trades at 98.8% of underlying)
    function getPTPrice() public view returns (uint256) {
        if (reservePT == 0 || reserveAsset == 0) return 1e18;
        // PT price = reserveAsset / reservePT (how much underlying per PT)
        return (reserveAsset * 1e18) / reservePT;
    }

    /// @notice Get current YT price in terms of underlying
    /// @dev YT price = 1 - PT price (since PT + YT = 1 unit of underlying)
    function getYTPrice() external view returns (uint256) {
        uint256 ptPrice = getPTPrice();
        if (ptPrice >= 1e18) return 0;
        return 1e18 - ptPrice;
    }

    /// @notice Preview a swap output amount
    function previewSwap(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        bool isPTIn = (tokenIn == pt);
        uint256 resIn = isPTIn ? reservePT : reserveAsset;
        uint256 resOut = isPTIn ? reserveAsset : reservePT;

        uint256 amountInAfterFee = amountIn - (amountIn * SWAP_FEE) / 1e18;
        uint256 timeToMat = maturity > block.timestamp ? maturity - block.timestamp : 0;
        uint256 totalDuration = maturity - marketCreatedAt;

        amountOut = YieldMath.calcSwapOutput(amountInAfterFee, resIn, resOut, timeToMat, totalDuration);
    }

    /// @notice Get LP token value in terms of underlying
    function getLPValue() external view returns (uint256) {
        uint256 ptPrice = getPTPrice();
        return YieldMath.calcLPValue(reservePT, reserveAsset, totalLPSupply, ptPrice);
    }

    /// @notice Time remaining until market maturity
    function timeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                    INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "AMM: transferFrom failed");
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "AMM: transfer failed");
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
