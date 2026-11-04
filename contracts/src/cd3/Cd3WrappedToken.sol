// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd3WrappedToken — token đích trên chain-B; chỉ MintGateway được mint.
contract Cd3WrappedToken {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    address public minter;
    address public immutable deployer;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() { deployer = msg.sender; }

    function setMinter(address m) external {
        require(msg.sender == deployer && minter == address(0), "minter set");
        minter = m;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "only minter");
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
}
