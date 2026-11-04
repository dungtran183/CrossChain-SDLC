// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2TokenA { function mint(address to, uint256 amount) external; }

/// @title Cd2VulnBridgeAccess — LỖI: setRelayer() thiếu onlyOwner → ai cũng chiếm quyền relayer.
contract Cd2VulnBridgeAccess {
    ICd2TokenA public token;
    address public owner;
    address public relayer;
    mapping(bytes32 => bool) public processed;

    event Released(bytes32 indexed msgId, address indexed to, uint256 amount);
    event RelayerChanged(address indexed relayer);

    constructor(address _token, address _relayer) {
        token = ICd2TokenA(_token);
        owner = msg.sender;
        relayer = _relayer;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    function setRelayer(address r) external { // BUG: thiếu onlyOwner
        relayer = r;
        emit RelayerChanged(r);
    }

    function release(bytes32 msgId, address to, uint256 amount) external {
        require(msg.sender == relayer, "only relayer");
        require(!processed[msgId], "processed");
        processed[msgId] = true;
        token.mint(to, amount);
        emit Released(msgId, to, amount);
    }
}
