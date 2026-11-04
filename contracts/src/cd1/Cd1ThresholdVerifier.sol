// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd1ThresholdVerifier — chain-B (doanh nghiệp/Verifier): chấp nhận xác nhận liên chuỗi khi có ≥ t chữ ký relay.
/// @notice Demo CĐ1 Π_univ (Relay-TSS). Ngưỡng t-of-n kiểm bằng ecrecover (EIP-191), loại signer trùng,
///         msgHash chứa nonce + srcChainId nên không thể phát lại.
contract Cd1ThresholdVerifier {
    mapping(address => bool) public isRelay;
    address[] public relays;
    uint256 public immutable threshold;
    mapping(bytes32 => bool) public accepted;

    event AttestationAccepted(bytes32 indexed msgHash, uint256 validSigs);
    event AttestationRejected(bytes32 indexed msgHash, uint256 validSigs, string reason);

    constructor(address[] memory _relays, uint256 _threshold) {
        require(_threshold > 0 && _threshold <= _relays.length, "bad threshold");
        for (uint256 i = 0; i < _relays.length; i++) {
            isRelay[_relays[i]] = true;
            relays.push(_relays[i]);
        }
        threshold = _threshold;
    }

    function relayCount() external view returns (uint256) {
        return relays.length;
    }

    /// @dev Không revert khi thiếu ngưỡng để sự kiện AttestationRejected được ghi on-chain (dễ quan sát);
    ///      chỉ revert với lỗi phát lại.
    function submitAttestation(bytes32 msgHash, bytes[] calldata sigs) external returns (bool) {
        require(!accepted[msgHash], "replay: already accepted");
        bytes32 digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
        address[] memory seen = new address[](sigs.length);
        uint256 valid = 0;
        for (uint256 i = 0; i < sigs.length; i++) {
            address s = _recover(digest, sigs[i]);
            if (s == address(0) || !isRelay[s]) continue;
            bool dup = false;
            for (uint256 j = 0; j < valid; j++) {
                if (seen[j] == s) { dup = true; break; }
            }
            if (dup) continue;
            seen[valid] = s;
            valid++;
        }
        if (valid >= threshold) {
            accepted[msgHash] = true;
            emit AttestationAccepted(msgHash, valid);
            return true;
        }
        emit AttestationRejected(msgHash, valid, "below threshold");
        return false;
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r = bytes32(sig[0:32]);
        bytes32 s = bytes32(sig[32:64]);
        uint8 v = uint8(sig[64]);
        if (v < 27) v += 27;
        return ecrecover(digest, v, r, s);
    }
}
