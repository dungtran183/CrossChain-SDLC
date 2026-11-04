// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd2WrappedToken — token đích (wrapped) của cầu nối mẫu CĐ2; chỉ bridge được mint/burn.
contract Cd2WrappedToken {
    string public constant name = "Wrapped Demo Token";
    string public constant symbol = "wDEMO";
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    address public bridge;
    address public immutable deployer;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        deployer = msg.sender;
    }

    function setBridge(address b) external {
        require(msg.sender == deployer && bridge == address(0), "bridge set");
        bridge = b;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == bridge, "only bridge");
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == bridge, "only bridge");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}
