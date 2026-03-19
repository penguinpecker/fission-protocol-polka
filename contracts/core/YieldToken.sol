// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title YieldToken - Represents claim on all yield until maturity
/// @notice Holders receive streaming real yield from the underlying asset.
///         Yield accrues proportionally to each holder's share of total YT supply.
///         At maturity, YT is worth zero (all future yield has been claimed).
/// @dev Uses a reward-per-token accumulator pattern (similar to Synthetix staking rewards)
///      for gas-efficient yield distribution to all holders.
contract YieldToken {
    // ═══════════════════════════════════════════════════════════
    //                        ERC-20 STATE
    // ═══════════════════════════════════════════════════════════

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ═══════════════════════════════════════════════════════════
    //                      EIP-2612 PERMIT
    // ═══════════════════════════════════════════════════════════

    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    mapping(address => uint256) public nonces;

    // ═══════════════════════════════════════════════════════════
    //                    YIELD TRACKING STATE
    // ═══════════════════════════════════════════════════════════

    address public immutable fissionCore;
    address public immutable yieldBearingAsset;
    uint256 public immutable maturity;
    bytes32 public immutable marketId;

    /// @notice Accumulated yield per token (18 decimals). Only goes up.
    /// @dev This is the global accumulator. When yield is pushed from FissionCore,
    ///      yieldPerTokenStored increases proportional to yield / totalSupply.
    uint256 public yieldPerTokenStored;

    /// @notice Per-user snapshot of yieldPerTokenStored at their last action
    mapping(address => uint256) public userYieldPerTokenPaid;

    /// @notice Per-user accumulated but unclaimed yield
    mapping(address => uint256) public unclaimedYield;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event YieldAccrued(uint256 yieldAmount, uint256 newYieldPerToken);
    event YieldClaimed(address indexed user, uint256 amount);

    // ═══════════════════════════════════════════════════════════
    //                      CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════

    constructor(
        string memory _name,
        string memory _symbol,
        address _fissionCore,
        address _yieldBearingAsset,
        uint256 _maturity,
        bytes32 _marketId
    ) {
        name = _name;
        symbol = _symbol;
        fissionCore = _fissionCore;
        yieldBearingAsset = _yieldBearingAsset;
        maturity = _maturity;
        marketId = _marketId;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(_name)),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    modifier onlyCore() {
        require(msg.sender == fissionCore, "YT: only FissionCore");
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                  YIELD ACCRUAL LOGIC
    // ═══════════════════════════════════════════════════════════

    /// @notice Calculate current claimable yield for a user
    /// @param user Address to check
    /// @return Claimable yield amount in yield-bearing asset units
    function claimableYield(address user) public view returns (uint256) {
        uint256 perToken = yieldPerTokenStored - userYieldPerTokenPaid[user];
        return unclaimedYield[user] + (balanceOf[user] * perToken) / 1e18;
    }

    /// @notice Called by FissionCore when new yield is detected from the underlying asset
    /// @param yieldAmount Amount of new yield to distribute to all YT holders
    function accrueYield(uint256 yieldAmount) external onlyCore {
        if (totalSupply == 0 || yieldAmount == 0) return;

        yieldPerTokenStored += (yieldAmount * 1e18) / totalSupply;
        emit YieldAccrued(yieldAmount, yieldPerTokenStored);
    }

    /// @notice Checkpoint a user's yield before any balance change
    /// @dev Must be called before mint, burn, or transfer to correctly track yield
    function _updateYield(address user) internal {
        if (user == address(0)) return;

        unclaimedYield[user] = claimableYield(user);
        userYieldPerTokenPaid[user] = yieldPerTokenStored;
    }

    /// @notice Claim all accrued yield — called via FissionCore.claimYield()
    /// @param user Address claiming yield
    /// @return amount Total yield claimed
    function claim(address user) external onlyCore returns (uint256 amount) {
        _updateYield(user);
        amount = unclaimedYield[user];
        if (amount > 0) {
            unclaimedYield[user] = 0;
            emit YieldClaimed(user, amount);
        }
    }

    // ═══════════════════════════════════════════════════════════
    //                     FISSION FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function mint(address to, uint256 amount) external onlyCore {
        _updateYield(to);
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyCore {
        _updateYield(from);
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    function isExpired() public view returns (bool) {
        return block.timestamp >= maturity;
    }

    function timeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                   ERC-20 WITH YIELD HOOKS
    // ═══════════════════════════════════════════════════════════

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        // Update yield for both parties before balance change
        _updateYield(msg.sender);
        _updateYield(to);

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= value;
        }

        // Update yield for both parties before balance change
        _updateYield(from);
        _updateYield(to);

        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    // ═══════════════════════════════════════════════════════════
    //                     EIP-2612 PERMIT
    // ═══════════════════════════════════════════════════════════

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "YT: permit expired");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
            )
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0) && recovered == owner, "YT: invalid permit");

        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }
}
