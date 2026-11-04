// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Ping — contract mẫu để kiểm tra pipeline biên dịch → deploy → gọi hàm.
contract Ping {
    uint256 public count;
    string public label;

    event Pinged(address indexed from, uint256 count, string note);

    constructor(string memory _label) {
        label = _label;
    }

    function ping(string calldata note) external returns (uint256) {
        count += 1;
        emit Pinged(msg.sender, count, note);
        return count;
    }
}
