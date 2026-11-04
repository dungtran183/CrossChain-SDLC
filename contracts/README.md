# contracts/

Solidity thật, chạy trên 2 chuỗi EVM giả lập (py-evm) của backend.

- `src/common/` — contract dùng chung để kiểm tra pipeline (`Ping.sol`).
- `src/cd1/` — CĐ1 Π_univ (Phase P2): `CredentialRegistry.sol` (chain-A, neo Merkle root + thu hồi), `ThresholdVerifier.sol` (chain-B, kiểm t-of-n chữ ký relay bằng `ecrecover`).
- `src/cd2/` — CĐ2 CrossGuard (Phase P3): các bridge mẫu có lỗi (`VulnBridgeNoNonce.sol`, `VulnBridgeWeakThreshold.sol`, `VulnBridgeNoSourceCheck.sol`, `VulnBridgeAccess.sol`, `VulnBridgeOracle.sol`) + bản sửa `SafeBridge.sol`.
- `src/cd3/` — CĐ3 CrossSentry (Phase P4): `LockVault.sol` (chain-A, khóa tài sản, phát `Locked`), `MintGateway.sol` (chain-B, mint theo xác nhận validator, phát `Minted`), `WrappedToken.sol`.
- `artifacts/` — ABI + bytecode **được commit** để backend chạy mà không cần biên dịch lại.

Biên dịch lại (cần Node 18+):
```bash
cd contracts && npm install && npm run compile
```
Phiên bản compiler ghim: `solc 0.8.24`, `evmVersion: paris` (tương thích py-evm).
