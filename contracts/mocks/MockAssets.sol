// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MockVDOT - Simulates Bifrost's vDOT for testing
/// @dev Exchange rate increases over time to simulate staking yield accrual.
///      In production, this would be replaced by real vDOT on Polkadot Hub.
contract MockVDOT {
    string public constant name = "Mock Bifrost vDOT";
    string public constant symbol = "vDOT";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Exchange rate: how many DOT per vDOT (18 decimals)
    /// @dev Starts at 1.1e18 (1 vDOT = 1.10 DOT), increases to simulate yield
    uint256 public exchangeRate = 1.1e18;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Simulate yield accrual by increasing exchange rate
    /// @param newRate New exchange rate (must be >= current)
    function setExchangeRate(uint256 newRate) external {
        require(newRate >= exchangeRate, "MockVDOT: rate can only increase");
        exchangeRate = newRate;
    }

    /// @notice Simulate time passing with automatic yield
    /// @param basisPoints Yield in basis points (100 = 1%)
    function accrueYield(uint256 basisPoints) external {
        exchangeRate = exchangeRate + (exchangeRate * basisPoints) / 10000;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

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
}

/// @title MockAUSDT - Simulates Hydration's aUSDT lending token for testing
/// @dev Exchange rate increases to simulate lending interest accrual.
contract MockAUSDT {
    string public constant name = "Mock Hydration aUSDT";
    string public constant symbol = "aUSDT";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Exchange rate: how many USDT per aUSDT (18 decimals)
    /// @dev Starts at 1.02e18 (1 aUSDT = 1.02 USDT), increases with lending interest
    uint256 public exchangeRate = 1.02e18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {}

    function setExchangeRate(uint256 newRate) external {
        require(newRate >= exchangeRate, "MockAUSDT: rate can only increase");
        exchangeRate = newRate;
    }

    function accrueYield(uint256 basisPoints) external {
        exchangeRate = exchangeRate + (exchangeRate * basisPoints) / 10000;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

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
}
