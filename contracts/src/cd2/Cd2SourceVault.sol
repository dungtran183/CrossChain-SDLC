// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd2SourceVault — chain-A: khóa tài sản và phát sự kiện Locked để relayer chuyển sang chain-B (Exploit lab CĐ2).
contract Cd2SourceVault {
    uint256 public nonce;
    mapping(address => uint256) public locked;

    event Locked(bytes32 indexed msgId, address indexed from, address to, uint256 amount, uint256 nonce);

    function lock(address to, uint256 amount) external returns (bytes32 msgId) {
        nonce += 1;
        locked[msg.sender] += amount;
        msgId = keccak256(abi.encodePacked(address(this), block.chainid, nonce, msg.sender, to, amount));
        emit Locked(msgId, msg.sender, to, amount, nonce);
    }
}
