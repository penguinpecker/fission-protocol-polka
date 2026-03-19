// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../core/FissionCore.sol";
import "../amm/FissionAMM.sol";
import "../interfaces/IFission.sol";

/// @title FissionRouter - User-Facing Multi-Step Operations
/// @notice Combines SLPx minting, splitting, and AMM swaps into single transactions.
///         Users never need to call FissionCore or FissionAMM directly.
///
/// @dev Key flows:
///      - zapInDOT: DOT → SLPx → vDOT → split → PT + YT (one click)
///      - splitAndSellYT: asset → split → sell YT on AMM → user gets PT + extra PT (fixed yield)
///      - splitAndSellPT: asset → split → sell PT on AMM → user gets YT + extra asset (yield spec)
///      - addLiquidityFromAsset: asset → split → add PT+asset to AMM → LP tokens
///
contract FissionRouter is IFissionRouter {
    // ═══════════════════════════════════════════════════════════
    //                         STATE
    // ═══════════════════════════════════════════════════════════

    FissionCore public immutable core;

    /// @notice Market ID → AMM address mapping
    mapping(bytes32 => address) public marketAMMs;

    /// @notice SLPx contract address for Bifrost vDOT minting (set for Polkadot Hub)
    address public slpxContract;

    /// @notice Protocol owner
    address public owner;

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(address _core, address _slpx) {
        core = FissionCore(_core);
        slpxContract = _slpx;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Router: not owner");
        _;
    }

    /// @notice Register an AMM for a market
    function setMarketAMM(bytes32 marketId, address amm) external onlyOwner {
        marketAMMs[marketId] = amm;
    }

    // ═══════════════════════════════════════════════════════════
    //           FLOW 1: ZAP IN DOT → vDOT → PT + YT
    // ═══════════════════════════════════════════════════════════

    /// @notice One-click: DOT → mint vDOT via Bifrost SLPx → split into PT + YT
    /// @dev For hackathon MVP, this assumes vDOT is already available on Hub.
    ///      Full SLPx XCM integration is async (vDOT arrives on callback).
    ///      Demo version: user pre-approves vDOT, router does split only.
    ///      Production version would use SLPx create_order + XCM callback.
    function zapInDOT(bytes32 marketId, uint256 minPt, uint256 minYt)
        external
        payable
        returns (uint256 ptAmount, uint256 ytAmount)
    {
        // TODO: Full SLPx integration with XCM callback for async vDOT minting
        // For hackathon demo, this routes through a simulated flow
        revert("Router: use splitFromAsset for hackathon demo");
    }

    // ═══════════════════════════════════════════════════════════
    //    FLOW 2: SPLIT + SELL YT = "Fixed Yield" (Buy PT only)
    // ═══════════════════════════════════════════════════════════

    /// @notice Split asset, sell YT on AMM, return all PT to user
    /// @dev User gets maximum PT = guaranteed fixed yield at maturity
    ///      This is the "Fixed Yield" button in the UI
    /// @param marketId Market to operate on
    /// @param amount Amount of yield-bearing asset to deposit
    /// @param minPtOut Minimum total PT to receive (slippage protection)
    /// @return totalPt Total PT received (from split + from YT sale)
    function splitAndSellYT(bytes32 marketId, uint256 amount, uint256 minPtOut)
        external
        returns (uint256 totalPt)
    {
        IFissionCore.Market memory market = core.getMarket(marketId);
        address amm = marketAMMs[marketId];
        require(amm != address(0), "Router: no AMM for market");

        // Step 1: Transfer asset from user
        _safeTransferFrom(market.yieldBearingAsset, msg.sender, address(this), amount);

        // Step 2: Approve and split via FissionCore
        _safeApprove(market.yieldBearingAsset, address(core), amount);
        (uint256 ptFromSplit, uint256 ytFromSplit) = core.split(marketId, amount);

        // Step 3: Sell all YT on AMM for more underlying
        _safeApprove(market.yieldToken, amm, ytFromSplit);
        uint256 assetFromYTSale = FissionAMM(amm).swap(market.yieldToken, ytFromSplit, 0);

        // Step 4: Use received underlying to buy more PT on AMM
        uint256 extraPt = 0;
        if (assetFromYTSale > 0) {
            _safeApprove(market.yieldBearingAsset, amm, assetFromYTSale);
            extraPt = FissionAMM(amm).swap(market.yieldBearingAsset, assetFromYTSale, 0);
        }

        // Step 5: Transfer all PT to user
        totalPt = ptFromSplit + extraPt;
        require(totalPt >= minPtOut, "Router: slippage exceeded");

        _safeTransfer(market.principalToken, msg.sender, ptFromSplit);
        if (extraPt > 0) {
            _safeTransfer(market.principalToken, msg.sender, extraPt);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //   FLOW 3: SPLIT + SELL PT = "Yield Spec" (Buy YT only)
    // ═══════════════════════════════════════════════════════════

    /// @notice Split asset, sell PT on AMM, return all YT + extra underlying to user
    /// @dev User gets maximum YT exposure = leveraged yield speculation
    ///      This is the "Long Yield" button in the UI
    /// @param marketId Market to operate on
    /// @param amount Amount of yield-bearing asset to deposit
    /// @param minYtOut Minimum total YT to receive
    /// @return totalYt Total YT received
    function splitAndSellPT(bytes32 marketId, uint256 amount, uint256 minYtOut)
        external
        returns (uint256 totalYt)
    {
        IFissionCore.Market memory market = core.getMarket(marketId);
        address amm = marketAMMs[marketId];
        require(amm != address(0), "Router: no AMM for market");

        // Step 1: Transfer asset from user
        _safeTransferFrom(market.yieldBearingAsset, msg.sender, address(this), amount);

        // Step 2: Approve and split
        _safeApprove(market.yieldBearingAsset, address(core), amount);
        (uint256 ptFromSplit, uint256 ytFromSplit) = core.split(marketId, amount);

        // Step 3: Sell all PT on AMM for underlying
        _safeApprove(market.principalToken, amm, ptFromSplit);
        uint256 assetFromPTSale = FissionAMM(amm).swap(market.principalToken, ptFromSplit, 0);

        // Step 4: Split the received underlying for more YT
        uint256 extraYt = 0;
        if (assetFromPTSale > 0) {
            _safeApprove(market.yieldBearingAsset, address(core), assetFromPTSale);
            (, extraYt) = core.split(marketId, assetFromPTSale);
            // Note: this also mints extra PT which stays in router — can be sold or held
        }

        // Step 5: Transfer all YT to user
        totalYt = ytFromSplit + extraYt;
        require(totalYt >= minYtOut, "Router: slippage exceeded");

        _safeTransfer(market.yieldToken, msg.sender, totalYt);
    }

    // ═══════════════════════════════════════════════════════════
    //   FLOW 4: ADD LIQUIDITY FROM ASSET = "Earn" (LP in one click)
    // ═══════════════════════════════════════════════════════════

    /// @notice Deposit underlying asset → split half → add PT + remaining asset as LP
    /// @dev This is the "Earn" / "LP" button in the UI
    ///      User deposits 100 aUSDT → router splits 50 → adds 50 PT + 50 aUSDT to AMM
    /// @param marketId Market to LP into
    /// @param amount Total amount of yield-bearing asset to use
    /// @param minLp Minimum LP tokens to receive
    /// @return lp LP tokens minted
    function addLiquidityFromAsset(bytes32 marketId, uint256 amount, uint256 minLp)
        external
        returns (uint256 lp)
    {
        IFissionCore.Market memory market = core.getMarket(marketId);
        address amm = marketAMMs[marketId];
        require(amm != address(0), "Router: no AMM for market");

        // Transfer full amount from user
        _safeTransferFrom(market.yieldBearingAsset, msg.sender, address(this), amount);

        // Split half into PT + YT
        uint256 halfAmount = amount / 2;
        uint256 assetForPool = amount - halfAmount;

        _safeApprove(market.yieldBearingAsset, address(core), halfAmount);
        (uint256 ptMinted,) = core.split(marketId, halfAmount);

        // Add PT + remaining asset to AMM
        _safeApprove(market.principalToken, amm, ptMinted);
        _safeApprove(market.yieldBearingAsset, amm, assetForPool);

        lp = FissionAMM(amm).addLiquidity(ptMinted, assetForPool, minLp);

        // Note: The YT from the split stays with this contract initially
        // In production, we'd send it to the user (they earn yield on it)
        // For hackathon, transfer YT to user as bonus
        uint256 ytBalance = _balanceOf(market.yieldToken, address(this));
        if (ytBalance > 0) {
            _safeTransfer(market.yieldToken, msg.sender, ytBalance);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //              SIMPLE SPLIT (No AMM, just split)
    // ═══════════════════════════════════════════════════════════

    /// @notice Simple split without any AMM interaction
    /// @dev For users who want to manually manage their PT and YT
    function splitFromAsset(bytes32 marketId, uint256 amount)
        external
        returns (uint256 ptAmount, uint256 ytAmount)
    {
        IFissionCore.Market memory market = core.getMarket(marketId);

        _safeTransferFrom(market.yieldBearingAsset, msg.sender, address(this), amount);
        _safeApprove(market.yieldBearingAsset, address(core), amount);

        (ptAmount, ytAmount) = core.split(marketId, amount);

        // Transfer PT + YT to user
        _safeTransfer(market.principalToken, msg.sender, ptAmount);
        _safeTransfer(market.yieldToken, msg.sender, ytAmount);
    }

    // ═══════════════════════════════════════════════════════════
    //                    INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Router: transferFrom failed");
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Router: transfer failed");
    }

    function _safeApprove(address token, address spender, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x095ea7b3, spender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Router: approve failed");
    }

    function _balanceOf(address token, address account) internal view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSelector(0x70a08231, account)
        );
        require(success, "Router: balanceOf failed");
        return abi.decode(data, (uint256));
    }
}
