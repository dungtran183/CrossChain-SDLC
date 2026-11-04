// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd2SafeVault — bản sửa của unlock(): checks-effects-interactions + khóa nonReentrant.
contract Cd2SafeVault {
    mapping(address => uint256) public credit;
    address public relayer;
    bool private locked;

    event Credited(bytes32 indexed msgId, address indexed to, uint256 amount);
    event Unlocked(address indexed to, uint256 amount);

    modifier nonReentrant() {
        require(!locked, "reentrant call");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _relayer) payable {
        relayer = _relayer;
    }

    function credit_(bytes32 msgId, address to, uint256 amount) external {
        require(msg.sender == relayer, "only relayer");
        credit[to] += amount;
        emit Credited(msgId, to, amount);
    }

    function unlock() external nonReentrant {
        uint256 amount = credit[msg.sender];
        require(amount > 0, "nothing to unlock");
        credit[msg.sender] = 0; // hiệu ứng trước
        (bool ok, ) = msg.sender.call{value: amount}(""); // tương tác sau
        require(ok, "transfer failed");
        emit Unlocked(msg.sender, amount);
    }
}
