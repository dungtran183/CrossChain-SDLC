// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2TokenS { function mint(address to, uint256 amount) external; }

/// @title Cd2VulnBridgeNoSourceCheck — LỖI: không kiểm srcChainId / địa chỉ cầu nguồn trong thông điệp.
contract Cd2VulnBridgeNoSourceCheck {
    ICd2TokenS public token;
    address public relayer;
    mapping(bytes32 => bool) public processed;

    event Released(bytes32 indexed msgId, address indexed to, uint256 amount);

    constructor(address _token, address _relayer) {
        token = ICd2TokenS(_token);
        relayer = _relayer;
    }

    /// @param srcBridge địa chỉ hợp đồng nguồn — BUG: không được so với cầu nguồn hợp lệ
    function release(bytes32 msgId, address to, uint256 amount, uint256 srcChainId, address srcBridge, bytes calldata sig) external {
        require(!processed[msgId], "processed");
        bytes32 h = keccak256(abi.encodePacked(msgId, to, amount, srcChainId, srcBridge));
        require(_recover(h, sig) == relayer, "bad signature");
        // BUG: thiếu require(srcChainId == TRUSTED_CHAIN && srcBridge == TRUSTED_BRIDGE)
        processed[msgId] = true;
        token.mint(to, amount);
        emit Released(msgId, to, amount);
    }

    function _recover(bytes32 h, bytes calldata sig) internal pure returns (address) {
        bytes32 d = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", h));
        (bytes32 r, bytes32 s, uint8 v) = (bytes32(sig[0:32]), bytes32(sig[32:64]), uint8(sig[64]));
        return ecrecover(d, v < 27 ? v + 27 : v, r, s);
    }
}
