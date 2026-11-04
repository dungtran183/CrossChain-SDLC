// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2TokenO { function mint(address to, uint256 amount) external; }

/// @title Cd2VulnBridgeOracle — LỖI: tin giá từ MỘT oracle, không kiểm độ mới (stale) hay biên độ.
contract Cd2VulnBridgeOracle {
    ICd2TokenO public token;
    address public oracle;
    uint256 public price;      // giá tài sản nguồn (×1e2)
    uint256 public updatedAt;  // block cập nhật
    mapping(bytes32 => bool) public processed;

    event Released(bytes32 indexed msgId, address indexed to, uint256 amount);
    event PriceUpdated(uint256 price, uint256 at);

    constructor(address _token, address _oracle) {
        token = ICd2TokenO(_token);
        oracle = _oracle;
        price = 100;
        updatedAt = block.number;
    }

    function updatePrice(uint256 p) external {
        require(msg.sender == oracle, "only oracle");
        price = p; // BUG: không giới hạn biên độ thay đổi, một nguồn duy nhất
        updatedAt = block.number;
        emit PriceUpdated(p, block.number);
    }

    function release(bytes32 msgId, address to, uint256 srcAmount) external {
        require(!processed[msgId], "processed");
        // BUG: không require(block.number - updatedAt <= MAX_AGE)
        processed[msgId] = true;
        uint256 amount = (srcAmount * price) / 100;
        token.mint(to, amount);
        emit Released(msgId, to, amount);
    }
}
