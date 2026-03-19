// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IFission.sol";

/// @title PrincipalToken - Represents claim on underlying principal at maturity
/// @notice Redeemable 1:1 for the yield-bearing asset after maturity date.
///         Trades at a discount before maturity — the discount IS the implied fixed rate.
/// @dev ERC-20 with EIP-2612 permit for gasless approvals (needed for 0xGasless integration)
contract PrincipalToken {
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
    //                     FISSION STATE
    // ═══════════════════════════════════════════════════════════

    address public immutable fissionCore;
    address public immutable yieldBearingAsset;
    uint256 public immutable maturity;
    bytes32 public immutable marketId;

    // ═══════════════════════════════════════════════════════════
    //                        EVENTS
    // ═══════════════════════════════════════════════════════════

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

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
        require(msg.sender == fissionCore, "PT: only FissionCore");
        _;
    }

    // ═══════════════════════════════════════════════════════════
    //                     FISSION FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function mint(address to, uint256 amount) external onlyCore {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyCore {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    /// @notice Check if this PT has reached maturity
    function isExpired() public view returns (bool) {
        return block.timestamp >= maturity;
    }

    /// @notice Seconds remaining until maturity
    function timeToMaturity() external view returns (uint256) {
        if (block.timestamp >= maturity) return 0;
        return maturity - block.timestamp;
    }

    // ═══════════════════════════════════════════════════════════
    //                     ERC-20 FUNCTIONS
    // ═══════════════════════════════════════════════════════════

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= value;
        }
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
        require(block.timestamp <= deadline, "PT: permit expired");

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
            )
        );

        address recovered = ecrecover(digest, v, r, s);
        require(recovered != address(0) && recovered == owner, "PT: invalid permit");

        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }
}
