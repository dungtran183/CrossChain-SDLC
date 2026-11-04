// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd2VulnBridgeReentrancy — LỖI: unlock() chuyển ETH (gọi ra ngoài) TRƯỚC khi cập nhật số dư → reentrancy.
contract Cd2VulnBridgeReentrancy {
    mapping(address => uint256) public credit; // tài sản đã được relayer ghi có từ chuỗi kia
    address public relayer;

    event Credited(bytes32 indexed msgId, address indexed to, uint256 amount);
    event Unlocked(address indexed to, uint256 amount);

    constructor(address _relayer) payable {
        relayer = _relayer;
    }

    function credit_(bytes32 msgId, address to, uint256 amount) external {
        require(msg.sender == relayer, "only relayer");
        credit[to] += amount;
        emit Credited(msgId, to, amount);
    }

    function unlock() external {
        uint256 amount = credit[msg.sender];
        require(amount > 0, "nothing to unlock");
        (bool ok, ) = msg.sender.call{value: amount}(""); // BUG: tương tác ngoài trước khi cập nhật trạng thái
        require(ok, "transfer failed");
        credit[msg.sender] = 0; // BUG: hiệu ứng sau tương tác (vi phạm checks-effects-interactions)
        emit Unlocked(msg.sender, amount);
    }
}
