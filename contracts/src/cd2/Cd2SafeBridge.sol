// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICd2TokenSafe { function mint(address to, uint256 amount) external; }

/// @title Cd2SafeBridge — bản sửa tổng hợp: nonce/processed, ngưỡng t-of-n không trùng signer,
///        kiểm nguồn (chain + bridge), access control.
contract Cd2SafeBridge {
    ICd2TokenSafe public token;
    address public owner;
    mapping(address => bool) public isValidator;
    uint256 public threshold;
    uint256 public constant SRC_CHAIN_ID = 31337;
    address public trustedSrcBridge;
    mapping(bytes32 => bool) public processed;

    event Released(bytes32 indexed msgId, address indexed to, uint256 amount);

    constructor(address _token, address[] memory vals, uint256 _t, address _srcBridge) {
        require(_t >= 2 && _t <= vals.length, "bad threshold");
        token = ICd2TokenSafe(_token);
        owner = msg.sender;
        for (uint256 i = 0; i < vals.length; i++) isValidator[vals[i]] = true;
        threshold = _t;
        trustedSrcBridge = _srcBridge;
    }

    modifier onlyOwner() { require(msg.sender == owner, "only owner"); _; }

    function setValidator(address v, bool on) external onlyOwner { isValidator[v] = on; }

    function release(bytes32 msgId, address to, uint256 amount, uint256 srcChainId, address srcBridge, bytes[] calldata sigs) external {
        require(srcChainId == SRC_CHAIN_ID && srcBridge == trustedSrcBridge, "untrusted source");
        require(!processed[msgId], "replay: processed");
        bytes32 h = keccak256(abi.encodePacked(msgId, to, amount, srcChainId, srcBridge, address(this)));
        address last = address(0);
        uint256 ok = 0;
        for (uint256 i = 0; i < sigs.length; i++) {
            address s = _recover(h, sigs[i]);
            require(s > last, "unsorted/duplicate signer"); // chữ ký sắp xếp tăng dần → không trùng
            last = s;
            if (isValidator[s]) ok++;
        }
        require(ok >= threshold, "below threshold");
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
