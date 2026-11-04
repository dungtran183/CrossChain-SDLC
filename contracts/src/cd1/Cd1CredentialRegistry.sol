// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Cd1CredentialRegistry — chain-A (trường/Issuer): neo Merkle root của lô văn bằng và danh sách thu hồi.
/// @notice Demo CĐ1 Π_univ. Chỉ Issuer được ghi. Không lưu dữ liệu cá nhân — chỉ cam kết (hash).
contract Cd1CredentialRegistry {
    address public immutable issuer;
    mapping(uint256 => bytes32) public roots; // batchId → Merkle root
    mapping(bytes32 => bool) public revoked;  // credentialHash → đã thu hồi

    event RootAnchored(uint256 indexed batchId, bytes32 root, uint256 count);
    event Revoked(bytes32 indexed credentialHash, uint256 at);

    constructor() {
        issuer = msg.sender;
    }

    modifier onlyIssuer() {
        require(msg.sender == issuer, "only issuer");
        _;
    }

    function anchorRoot(bytes32 root, uint256 batchId, uint256 count) external onlyIssuer {
        require(roots[batchId] == bytes32(0), "batch exists");
        roots[batchId] = root;
        emit RootAnchored(batchId, root, count);
    }

    function revoke(bytes32 credentialHash) external onlyIssuer {
        require(!revoked[credentialHash], "already revoked");
        revoked[credentialHash] = true;
        emit Revoked(credentialHash, block.number);
    }

    function isRevoked(bytes32 credentialHash) external view returns (bool) {
        return revoked[credentialHash];
    }
}
