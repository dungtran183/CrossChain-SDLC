// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2TokenW { function mint(address to, uint256 amount) external; }

/// @title Cd2VulnBridgeWeakThreshold — LỖI: ngưỡng validator = 1 và không loại signer trùng.
contract Cd2VulnBridgeWeakThreshold {
    ICd2TokenW public token;
    mapping(address => bool) public isValidator;
    uint256 public threshold = 1; // BUG: một validator bị chiếm là đủ
    mapping(bytes32 => bool) public processed;

    event Released(bytes32 indexed msgId, address indexed to, uint256 amount);

    constructor(address _token, address[] memory vals) {
        token = ICd2TokenW(_token);
        for (uint256 i = 0; i < vals.length; i++) isValidator[vals[i]] = true;
    }

    function release(bytes32 msgId, address to, uint256 amount, bytes[] calldata sigs) external {
        require(!processed[msgId], "processed");
        bytes32 h = keccak256(abi.encodePacked(msgId, to, amount, address(this)));
        uint256 ok = 0;
        for (uint256 i = 0; i < sigs.length; i++) {
            // BUG: cùng một chữ ký lặp lại vẫn được đếm nhiều lần
            if (isValidator[_recover(h, sigs[i])]) ok++;
        }
        require(ok >= threshold, "threshold");
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
