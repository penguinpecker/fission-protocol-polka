// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PrincipalToken.sol";
import "./YieldToken.sol";
import "../interfaces/IFission.sol";

/// @title FissionCore - Yield Tokenization Engine
/// @notice Splits yield-bearing assets (vDOT, aUSDT) into Principal Tokens + Yield Tokens.
///         Handles yield accrual detection, PT redemption at maturity, and YT yield claims.
/// @dev This is the protocol's heart. All state about markets, locked assets, and yield lives here.
///
///      Yield detection works by monitoring the exchange rate of the yield-bearing asset:
///      - vDOT's exchange rate (vDOT → DOT) increases as staking rewards accrue
///      - aUSDT's exchange rate (aUSDT → USDT) increases as lending interest accrues
///      - The delta in exchange rate since last update = new yield generated
///
contract FissionCore is IFissionCore {
    // ═══════════════════════════════════════════════════════════
    //                         STATE
    // ═══════════════════════════════════════════════════════════

    /// @notice All markets indexed by marketId
    mapping(bytes32 => Market) public markets;

    /// @notice Array of all market IDs for enumeration
    bytes32[] public allMarketIds;

    /// @notice Protocol fee rate (18 decimals) — e.g. 0.003e18 = 0.3%
    uint256 public feeRate = 3e15; // 0.3%

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Protocol owner (for hackathon; would be governance in prod)
    address public owner;

    /// @notice Market creation timestamp for AMM time-weighting
    mapping(bytes32 => uint256) public marketCreatedAt;

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(address _feeCollector) {
        owner = msg.sender;
        feeCollector = _feeCollector;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "FissionCore: not owner");
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                    MARKET CREATION
    // ═══════════════════════════════════════════════════════════

    /// @notice Create a new yield tokenization market
    /// @param yieldBearingAsset Address of the yield-bearing token (vDOT, aUSDT, etc.)
    /// @param maturity Unix timestamp when the market expires
    /// @param assetName Human-readable name of underlying (e.g. "vDOT", "aUSDT")
    /// @return marketId Unique identifier for this market
    function createMarket(
        address yieldBearingAsset,
        uint256 maturity,
        string calldata assetName
    ) external onlyOwner returns (bytes32 marketId) {
        require(maturity > block.timestamp, "FissionCore: maturity in past");
        require(yieldBearingAsset != address(0), "FissionCore: zero address");

        marketId = keccak256(abi.encodePacked(yieldBearingAsset, maturity));
        require(!markets[marketId].initialized, "FissionCore: market exists");

        // Deploy PT and YT tokens for this market
        string memory maturityStr = _formatTimestamp(maturity);

        PrincipalToken pt = new PrincipalToken(
            string(abi.encodePacked("Fission PT-", assetName, "-", maturityStr)),
            string(abi.encodePacked("PT-", assetName)),
            address(this),
            yieldBearingAsset,
            maturity,
            marketId
        );

        YieldToken yt = new YieldToken(
            string(abi.encodePacked("Fission YT-", assetName, "-", maturityStr)),
            string(abi.encodePacked("YT-", assetName)),
            address(this),
            yieldBearingAsset,
            maturity,
            marketId
        );

        // Store initial yield index from the yield-bearing asset
        uint256 initialIndex = _getExchangeRate(yieldBearingAsset);

        markets[marketId] = Market({
            yieldBearingAsset: yieldBearingAsset,
            principalToken: address(pt),
            yieldToken: address(yt),
            maturity: maturity,
            yieldIndexStored: initialIndex,
            totalUnderlying: 0,
            initialized: true
        });

        marketCreatedAt[marketId] = block.timestamp;
        allMarketIds.push(marketId);

        emit MarketCreated(marketId, yieldBearingAsset, maturity, address(pt), address(yt));
    }

    // ═══════════════════════════════════════════════════════════
    //                   SPLIT: Asset → PT + YT
    // ═══════════════════════════════════════════════════════════

    /// @notice Split yield-bearing asset into equal amounts of PT and YT
    /// @param marketId The market to split into
    /// @param amount Amount of yield-bearing asset to split
    /// @return ptMinted Amount of PT tokens minted
    /// @return ytMinted Amount of YT tokens minted
    function split(bytes32 marketId, uint256 amount)
        external
        returns (uint256 ptMinted, uint256 ytMinted)
    {
        Market storage market = markets[marketId];
        require(market.initialized, "FissionCore: market not found");
        require(block.timestamp < market.maturity, "FissionCore: market expired");
        require(amount > 0, "FissionCore: zero amount");

        // Accrue any pending yield before state change
        _accrueYield(marketId);

        // Transfer yield-bearing asset from user to this contract
        _safeTransferFrom(market.yieldBearingAsset, msg.sender, address(this), amount);

        // Mint equal PT and YT — 1:1 ratio with deposited amount
        ptMinted = amount;
        ytMinted = amount;

        market.totalUnderlying += amount;

        PrincipalToken(market.principalToken).mint(msg.sender, ptMinted);
        YieldToken(market.yieldToken).mint(msg.sender, ytMinted);

        emit Split(marketId, msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════
    //                  MERGE: PT + YT → Asset
    // ═══════════════════════════════════════════════════════════

    /// @notice Merge equal PT + YT back into the original yield-bearing asset
    /// @dev Can be done any time before maturity. Inverse of split.
    /// @param marketId The market
    /// @param amount Amount of PT+YT pairs to merge
    /// @return assetReturned Amount of yield-bearing asset returned
    function merge(bytes32 marketId, uint256 amount)
        external
        returns (uint256 assetReturned)
    {
        Market storage market = markets[marketId];
        require(market.initialized, "FissionCore: market not found");
        require(amount > 0, "FissionCore: zero amount");

        _accrueYield(marketId);

        // Burn equal amounts of PT and YT
        PrincipalToken(market.principalToken).burn(msg.sender, amount);
        YieldToken(market.yieldToken).burn(msg.sender, amount);

        assetReturned = amount;
        market.totalUnderlying -= amount;

        // Return the yield-bearing asset
        _safeTransfer(market.yieldBearingAsset, msg.sender, assetReturned);

        emit Merge(marketId, msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════
    //               REDEEM PT: After Maturity
    // ═══════════════════════════════════════════════════════════

    /// @notice Redeem PT 1:1 for underlying after maturity
    /// @param marketId The market
    /// @param amount Amount of PT to redeem
    /// @return assetReturned Amount of yield-bearing asset returned
    function redeemPT(bytes32 marketId, uint256 amount)
        external
        returns (uint256 assetReturned)
    {
        Market storage market = markets[marketId];
        require(market.initialized, "FissionCore: market not found");
        require(block.timestamp >= market.maturity, "FissionCore: not matured");
        require(amount > 0, "FissionCore: zero amount");

        // Final yield accrual
        _accrueYield(marketId);

        // Burn PT
        PrincipalToken(market.principalToken).burn(msg.sender, amount);

        assetReturned = amount;
        market.totalUnderlying -= amount;

        // Return yield-bearing asset
        _safeTransfer(market.yieldBearingAsset, msg.sender, assetReturned);

        emit RedeemPT(marketId, msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════════
    //                CLAIM YIELD: YT Holders
    // ═══════════════════════════════════════════════════════════

    /// @notice Claim accrued yield for the caller's YT holdings
    /// @param marketId The market
    /// @return yieldClaimed Amount of yield-bearing asset claimed
    function claimYield(bytes32 marketId) external returns (uint256 yieldClaimed) {
        Market storage market = markets[marketId];
        require(market.initialized, "FissionCore: market not found");

        // Detect and distribute any new yield
        _accrueYield(marketId);

        // Claim from YT contract
        YieldToken yt = YieldToken(market.yieldToken);
        yieldClaimed = yt.claim(msg.sender);

        if (yieldClaimed > 0) {
            // Deduct protocol fee
            uint256 fee = (yieldClaimed * feeRate) / 1e18;
            uint256 netYield = yieldClaimed - fee;

            // Transfer fee to collector
            if (fee > 0) {
                _safeTransfer(market.yieldBearingAsset, feeCollector, fee);
            }

            // Transfer yield to user
            _safeTransfer(market.yieldBearingAsset, msg.sender, netYield);

            emit ClaimYield(marketId, msg.sender, netYield);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //                  YIELD ACCRUAL ENGINE
    // ═══════════════════════════════════════════════════════════

    /// @notice Detect new yield from the underlying asset and distribute to YT holders
    /// @dev Compares current exchange rate with stored rate to calculate yield delta.
    ///      For vDOT: if exchangeRate went from 1.10 to 1.12, that's 0.02 yield per vDOT.
    ///      The yield is pushed to the YieldToken contract for distribution.
    function _accrueYield(bytes32 marketId) internal {
        Market storage market = markets[marketId];
        if (market.totalUnderlying == 0) return;

        uint256 currentIndex = _getExchangeRate(market.yieldBearingAsset);
        uint256 storedIndex = market.yieldIndexStored;

        if (currentIndex <= storedIndex) return; // No new yield

        // Calculate yield: (currentIndex - storedIndex) / storedIndex * totalUnderlying
        // This gives the amount of new yield-bearing tokens generated
        uint256 yieldDelta = ((currentIndex - storedIndex) * market.totalUnderlying) / storedIndex;

        if (yieldDelta > 0) {
            market.yieldIndexStored = currentIndex;

            // Push yield to YT for distribution to holders
            YieldToken(market.yieldToken).accrueYield(yieldDelta);
        }
    }

    /// @notice Get the current exchange rate of a yield-bearing asset
    /// @dev Falls back to 1:1 if the asset doesn't implement exchangeRate()
    function _getExchangeRate(address asset) internal view returns (uint256) {
        // Try calling exchangeRate() — this works for vDOT, aTokens, etc.
        (bool success, bytes memory data) = asset.staticcall(
            abi.encodeWithSelector(IYieldBearingAsset.exchangeRate.selector)
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }

        // Fallback: 1:1 exchange rate (useful for testnet/mocks)
        return 1e18;
    }

    // ═══════════════════════════════════════════════════════════
    //                      VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function getMarket(bytes32 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getYieldIndex(address yieldBearingAsset) external view returns (uint256) {
        return _getExchangeRate(yieldBearingAsset);
    }

    function getMarketCount() external view returns (uint256) {
        return allMarketIds.length;
    }

    function getMarketDuration(bytes32 marketId) external view returns (uint256) {
        Market storage market = markets[marketId];
        return market.maturity - marketCreatedAt[marketId];
    }

    // ═══════════════════════════════════════════════════════════
    //                    ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function setFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= 5e16, "FissionCore: fee too high"); // Max 5%
        feeRate = _feeRate;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
    }

    // ═══════════════════════════════════════════════════════════
    //                    INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, amount) // transferFrom
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "FissionCore: transfer failed");
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0xa9059cbb, to, amount) // transfer
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "FissionCore: transfer failed");
    }

    /// @dev Simple timestamp formatting for token names (returns "MAR07" style)
    function _formatTimestamp(uint256 ts) internal pure returns (string memory) {
        // Simplified for hackathon — returns maturity as hex-encoded short string
        // In production, would format as "07APR2026"
        return _toHexString(ts % 100000);
    }

    function _toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(5);
        for (uint256 i = 4; i > 0; i--) {
            buffer[i] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        buffer[0] = bytes1(uint8(48 + (value % 10)));
        return string(buffer);
    }
}
