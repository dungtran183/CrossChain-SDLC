// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd3LockVault — chain-A: khóa tài sản, phát Locked(msgId, …) cho cầu nối được CrossSentry giám sát.
contract Cd3LockVault {
    uint256 public nonce;
    uint256 public totalLocked;

    event Locked(bytes32 indexed msgId, address indexed sender, address recipient, uint256 amount, uint256 dstChain, uint8 corridor);

    /// @param corridor 0 = A→B, 1 = B→A (mô phỏng), 2 = A→B qua oracle
    function lock(uint256 amount, uint256 dstChain, address recipient, uint8 corridor) external returns (bytes32 msgId) {
        nonce += 1;
        totalLocked += amount;
        msgId = keccak256(abi.encodePacked(address(this), nonce, msg.sender, recipient, amount, dstChain));
        emit Locked(msgId, msg.sender, recipient, amount, dstChain, corridor);
    }
}
