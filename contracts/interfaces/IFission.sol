// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IFissionCore - Core tokenization engine interface
interface IFissionCore {
    struct Market {
        address yieldBearingAsset;   // e.g. vDOT, aUSDT
        address principalToken;       // deployed PT token
        address yieldToken;           // deployed YT token
        uint256 maturity;             // unix timestamp
        uint256 yieldIndexStored;     // last stored yield index
        uint256 totalUnderlying;      // total yield-bearing asset locked
        bool initialized;
    }

    event MarketCreated(bytes32 indexed marketId, address yieldBearingAsset, uint256 maturity, address pt, address yt);
    event Split(bytes32 indexed marketId, address indexed user, uint256 amount);
    event Merge(bytes32 indexed marketId, address indexed user, uint256 amount);
    event RedeemPT(bytes32 indexed marketId, address indexed user, uint256 amount);
    event ClaimYield(bytes32 indexed marketId, address indexed user, uint256 yieldAmount);

    function split(bytes32 marketId, uint256 amount) external returns (uint256 ptMinted, uint256 ytMinted);
    function merge(bytes32 marketId, uint256 amount) external returns (uint256 assetReturned);
    function redeemPT(bytes32 marketId, uint256 amount) external returns (uint256 assetReturned);
    function claimYield(bytes32 marketId) external returns (uint256 yieldClaimed);
    function getMarket(bytes32 marketId) external view returns (Market memory);
    function getYieldIndex(address yieldBearingAsset) external view returns (uint256);
}

/// @title IYieldBearingAsset - Interface for yield-bearing assets (vDOT, aUSDT, etc.)
interface IYieldBearingAsset {
    /// @notice Returns the current exchange rate of the yield-bearing asset to its underlying
    /// @dev For vDOT: how many DOT per vDOT. For aUSDT: how many USDT per aUSDT.
    ///      This value only goes up over time as yield accrues.
    function exchangeRate() external view returns (uint256);
}

/// @title IFissionAMM - Yield trading AMM interface
interface IFissionAMM {
    event Swap(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event LiquidityAdded(address indexed user, uint256 ptAmount, uint256 assetAmount, uint256 lpMinted);
    event LiquidityRemoved(address indexed user, uint256 lpBurned, uint256 ptReturned, uint256 assetReturned);

    function swap(address tokenIn, uint256 amountIn, uint256 minOut) external returns (uint256 amountOut);
    function addLiquidity(uint256 ptAmount, uint256 assetAmount, uint256 minLp) external returns (uint256 lpMinted);
    function removeLiquidity(uint256 lpAmount, uint256 minPt, uint256 minAsset) external returns (uint256 ptOut, uint256 assetOut);
    function getImpliedRate() external view returns (uint256);
    function getPTPrice() external view returns (uint256);
}

/// @title IXCM - Polkadot Hub XCM Precompile interface
/// @dev Located at 0x00000000000000000000000000000000000a0000
interface IXCM {
    function execute(bytes calldata message, uint64 maxWeight) external;
    function send(bytes calldata dest, bytes calldata message) external;
    function weighMessage(bytes calldata message) external view returns (uint64);
}

/// @title ISLPx - Bifrost SLPx interface for liquid staking
interface ISLPx {
    function create_order(
        address assetAddress,
        uint128 amount,
        uint64 dest_chain_id,
        bytes memory receiver,
        string memory remark,
        uint32 channel_id
    ) external payable;
}

/// @title IFissionRouter - Multi-step convenience router
interface IFissionRouter {
    function zapInDOT(bytes32 marketId, uint256 minPt, uint256 minYt) external payable returns (uint256 pt, uint256 yt);
    function splitAndSellYT(bytes32 marketId, uint256 amount, uint256 minPtOut) external returns (uint256 totalPt);
    function splitAndSellPT(bytes32 marketId, uint256 amount, uint256 minYtOut) external returns (uint256 totalYt);
    function addLiquidityFromAsset(bytes32 marketId, uint256 amount, uint256 minLp) external returns (uint256 lp);
}
