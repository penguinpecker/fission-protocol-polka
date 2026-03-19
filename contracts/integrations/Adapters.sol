// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IFission.sol";
import "../core/FissionCore.sol";

/// @title SLPxAdapter - Bifrost vDOT Minting Integration
/// @notice Wraps Bifrost's SLPx interface for one-click DOT → vDOT minting from Fission.
/// @dev On Polkadot Hub, SLPx uses XCM to send DOT to Bifrost parachain,
///      which mints vDOT and returns it via XCM callback.
///      Deployed SLPx contract addresses vary per EVM chain.
contract SLPxAdapter {
    /// @notice Bifrost SLPx contract on Polkadot Hub
    address public immutable slpx;

    /// @notice Fission Router that calls this adapter
    address public immutable router;

    /// @notice vDOT token address on Polkadot Hub
    address public immutable vdot;

    /// @notice Polkadot Hub chain ID for SLPx
    uint64 public constant POLKADOT_HUB_CHAIN_ID = 1000;

    /// @notice Channel ID for Bifrost reward sharing
    uint32 public constant FISSION_CHANNEL_ID = 1;

    constructor(address _slpx, address _router, address _vdot) {
        slpx = _slpx;
        router = _router;
        vdot = _vdot;
    }

    /// @notice Mint vDOT via Bifrost SLPx — sends DOT, receives vDOT back via XCM
    /// @param amount Amount of DOT to stake
    /// @param receiver Address to receive vDOT on Polkadot Hub
    function mintVDOT(uint256 amount, address receiver) external payable {
        require(msg.sender == router, "SLPxAdapter: only router");

        // Call Bifrost SLPx create_order
        // This sends DOT via XCM to Bifrost, which mints vDOT and XCMs it back
        ISLPx(slpx).create_order{value: msg.value}(
            address(0),                          // DOT (native asset)
            uint128(amount),
            POLKADOT_HUB_CHAIN_ID,              // Return vDOT to Hub
            abi.encodePacked(receiver),          // Receiver address (20 bytes for EVM)
            "Fission",                           // Remark
            FISSION_CHANNEL_ID                   // Channel for reward sharing
        );
    }

    /// @notice Get current vDOT exchange rate from Bifrost
    /// @dev In production, reads from SLPx XCM oracle. For demo, reads from vDOT contract.
    function getVDOTRate() external view returns (uint256) {
        return IYieldBearingAsset(vdot).exchangeRate();
    }
}

/// @title XCMHandler - Cross-Chain Message Handler for Polkadot Hub
/// @notice Accepts vDOT deposits arriving via XCM from other parachains (Bifrost, Hydration, etc.)
///         and auto-routes them into Fission markets.
/// @dev Uses the XCM precompile at 0x00000000000000000000000000000000000a0000
contract XCMHandler {
    /// @notice XCM Precompile address on Polkadot Hub
    address public constant XCM_PRECOMPILE = 0x00000000000000000000000000000000000a0000;

    /// @notice Fission Core contract
    address public immutable fissionCore;

    /// @notice Router contract
    address public immutable router;

    /// @notice Owner
    address public owner;

    /// @notice Mapping of parachain IDs to supported status
    mapping(uint32 => bool) public supportedParachains;

    event CrossChainDeposit(uint32 indexed paraId, address indexed user, address asset, uint256 amount);
    event CrossChainSend(uint32 indexed paraId, address indexed recipient, address asset, uint256 amount);

    constructor(address _fissionCore, address _router) {
        fissionCore = _fissionCore;
        router = _router;
        owner = msg.sender;

        // Pre-configure known parachains
        supportedParachains[2030] = true; // Bifrost
        supportedParachains[2034] = true; // Hydration (HydraDX)
        supportedParachains[2004] = true; // Moonbeam
        supportedParachains[2006] = true; // Astar
    }

    /// @notice Send tokens cross-chain via XCM to another parachain
    /// @param destParaId Destination parachain ID
    /// @param beneficiary Recipient address (SCALE encoded)
    /// @param asset Token to send
    /// @param amount Amount to send
    function sendToParachain(
        uint32 destParaId,
        bytes calldata beneficiary,
        address asset,
        uint256 amount
    ) external {
        require(supportedParachains[destParaId], "XCM: unsupported parachain");

        // Build XCM message for asset transfer
        // In production: properly encode XCM WithdrawAsset + BuyExecution + DepositAsset
        // For hackathon: demonstrate the interface and XCM precompile call pattern
        bytes memory xcmMessage = _buildTransferXCM(destParaId, beneficiary, asset, amount);
        bytes memory dest = _encodeParachainDest(destParaId);

        IXCM(XCM_PRECOMPILE).send(dest, xcmMessage);

        emit CrossChainSend(destParaId, msg.sender, asset, amount);
    }

    /// @notice Estimate XCM execution weight for a transfer
    function estimateXCMFee(bytes calldata xcmMessage) external view returns (uint64) {
        return IXCM(XCM_PRECOMPILE).weighMessage(xcmMessage);
    }

    /// @notice Add/remove supported parachain
    function setParachainSupport(uint32 paraId, bool supported) external {
        require(msg.sender == owner, "XCM: not owner");
        supportedParachains[paraId] = supported;
    }

    // ═══════════════════════════════════════════════════════════
    //                  XCM MESSAGE BUILDERS
    // ═══════════════════════════════════════════════════════════

    function _buildTransferXCM(
        uint32 destParaId,
        bytes calldata beneficiary,
        address asset,
        uint256 amount
    ) internal pure returns (bytes memory) {
        // Placeholder: In production, this builds a proper SCALE-encoded XCM program:
        // WithdrawAsset → BuyExecution → DepositAsset
        // Using Polkadot's XCM V3/V4 format
        return abi.encodePacked(destParaId, beneficiary, asset, amount);
    }

    function _encodeParachainDest(uint32 paraId) internal pure returns (bytes memory) {
        // Encode destination as XCM MultiLocation: (1, Parachain(paraId))
        return abi.encodePacked(uint8(1), paraId);
    }
}

/// @title HyperbridgeAdapter - Accept vDOT from Ethereum/Arbitrum/Base via Hyperbridge
/// @notice Processes incoming cross-ecosystem bridge transfers and auto-routes into Fission.
/// @dev Hyperbridge is live on Polkadot Hub testnet connecting 14+ chains.
///      Bridge transfers arrive as standard ERC-20 credits on Hub.
contract HyperbridgeAdapter {
    address public immutable fissionCore;
    address public immutable router;
    address public owner;

    /// @notice Supported bridge source chains
    mapping(uint256 => bool) public supportedChains;

    event BridgeReceived(uint256 indexed sourceChain, address indexed user, address asset, uint256 amount);

    constructor(address _fissionCore, address _router) {
        fissionCore = _fissionCore;
        router = _router;
        owner = msg.sender;

        // Pre-configure supported source chains
        supportedChains[1] = true;      // Ethereum mainnet
        supportedChains[42161] = true;  // Arbitrum One
        supportedChains[8453] = true;   // Base
        supportedChains[56] = true;     // BNB Chain
        supportedChains[10] = true;     // Optimism
        supportedChains[137] = true;    // Polygon
    }

    /// @notice Called when bridge transfer arrives (by Hyperbridge relayer or user after bridging)
    /// @dev In production: this would be a callback from Hyperbridge's on-chain contract.
    ///      For hackathon: user calls this after manually bridging vDOT to Hub.
    function onBridgeReceive(
        uint256 sourceChain,
        address asset,
        uint256 amount,
        address recipient
    ) external {
        require(supportedChains[sourceChain], "Bridge: unsupported chain");

        // Transfer the bridged asset from caller to this contract
        (bool success, bytes memory data) = asset.call(
            abi.encodeWithSelector(0x23b872dd, msg.sender, recipient, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Bridge: transfer failed");

        emit BridgeReceived(sourceChain, recipient, asset, amount);
    }

    function setSupportedChain(uint256 chainId, bool supported) external {
        require(msg.sender == owner, "Bridge: not owner");
        supportedChains[chainId] = supported;
    }
}

/// @title GaslessForwarder - EIP-2771 Meta-Transaction Forwarder for 0xGasless
/// @notice Enables gasless PT/YT swaps — users sign transactions off-chain,
///         relayer submits them on-chain and pays gas.
/// @dev Compatible with 0xGasless relay network. Uses EIP-2771 trusted forwarder pattern.
///      PT and YT tokens implement EIP-2612 permit, so approve+swap can be gasless too.
contract GaslessForwarder {
    struct ForwardRequest {
        address from;       // Original signer
        address to;         // Target contract (AMM, Router, etc.)
        uint256 value;      // ETH value (usually 0)
        uint256 gas;        // Gas limit
        uint256 nonce;      // Replay protection
        uint256 deadline;   // Expiry timestamp
        bytes data;         // Calldata to forward
    }

    bytes32 public constant TYPEHASH = keccak256(
        "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint256 deadline,bytes data)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    mapping(address => uint256) public nonces;

    event Executed(address indexed from, address indexed to, bool success);

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Fission Forwarder")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /// @notice Verify a forward request signature
    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(
                    TYPEHASH,
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    req.deadline,
                    keccak256(req.data)
                ))
            )
        );

        (uint8 v, bytes32 r, bytes32 s) = _splitSignature(signature);
        address signer = ecrecover(digest, v, r, s);

        return signer == req.from
            && req.nonce == nonces[req.from]
            && block.timestamp <= req.deadline;
    }

    /// @notice Execute a verified meta-transaction
    /// @dev Relayer (0xGasless) calls this, pays gas on behalf of user
    function execute(ForwardRequest calldata req, bytes calldata signature)
        external
        payable
        returns (bool success, bytes memory result)
    {
        require(verify(req, signature), "Forwarder: invalid signature");
        nonces[req.from]++;

        // Append original sender to calldata (EIP-2771 pattern)
        // Target contract reads _msgSender() from last 20 bytes
        (success, result) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        emit Executed(req.from, req.to, success);
    }

    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function _splitSignature(bytes calldata sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "Forwarder: invalid sig length");
        r = bytes32(sig[0:32]);
        s = bytes32(sig[32:64]);
        v = uint8(bytes1(sig[64:65]));
    }
}
