# CĐ1 · Π_univ — đặc tả module demo (Phase P2)

**Chuyên đề:** Tăng cường tính riêng tư trong giao tiếp liên chuỗi · **Secure SDLC:** 1. Secure Design
**Ý tưởng gốc:** chuỗi đích quyết định chấp nhận dựa trên **bằng chứng mật mã** (ZKP + chữ ký ngưỡng), không dựa vào uy tín relayer. Tách *statement* (công khai) khỏi *witness* (bí mật). Kiến trúc 3 lớp: nền tảng số học → logic riêng tư → xác nhận liên kết. Cấu hình demo: **Relay-TSS** cho bài toán văn bằng số (Issuer = trường, Holder = người học, Verifier = doanh nghiệp, Regulatory Authorities = ủy ban ngưỡng).

## Phạm vi demo (toy, minh họa luồng)
| Thành phần luận án | Bản demo |
|---|---|
| Groth16 (Circom/Snarkjs) | ZKP toy bằng Python: cam kết `C = H(attr ‖ salt)`, Merkle membership, chứng minh vị từ "GPA ≥ ngưỡng" kiểu Fiat–Shamir (sigma-protocol trên nhóm nhỏ hoặc commit-and-reveal có challenge). Gắn nhãn **toy**. |
| MPC + Threshold-ECDSA | Ủy ban n relay (mặc định n=5, t=3), **mỗi relay có khóa ECDSA thật**; hợp đồng chuỗi đích kiểm ≥ t chữ ký hợp lệ bằng `ecrecover` (multi-sig ngưỡng). Thêm minh họa **Shamir (t,n)** chia/khôi phục bí mật để giải thích "không ai giữ toàn bộ khóa". |
| CP-ABE | Mô phỏng: AES-GCM (thư viện `cryptography`) + kiểm chính sách thuộc tính (vd `role=HR AND org=ACME`) trước khi trả khóa giải mã. |
| Hyperledger/Geth đa chuỗi | `chain-A` (trường) và `chain-B` (doanh nghiệp) từ ChainSim. |

## Hợp đồng (`contracts/src/cd1/`)
- `Cd1CredentialRegistry.sol` (chain-A): `anchorRoot(bytes32 root, uint256 batchId)`, `revoke(bytes32 credentialHash)`, `isRevoked(bytes32)`, events `RootAnchored`, `Revoked`. Chỉ issuer được ghi.
- `Cd1ThresholdVerifier.sol` (chain-B): khởi tạo với danh sách relay + ngưỡng t; `submitAttestation(bytes32 msgHash, bytes[] sigs)` → đếm chữ ký hợp lệ, không trùng signer, ≥ t thì lưu `accepted[msgHash]=true` và phát `AttestationAccepted`; ngược lại revert/`AttestationRejected`. `msgHash` = hash(root, statement, proofDigest, nonce, srcChainId) — có nonce chống phát lại.

## Backend (`backend/app/modules/cd1_univ/`)
- `zkp_toy.py` — `commit()`, `merkle_tree()`, `merkle_proof()`, `prove_predicate(attr, threshold)`, `verify_predicate(statement, proof)`.
- `threshold.py` — tạo n khóa relay, ký `msgHash`, Shamir split/combine (trường số nguyên tố nhỏ cho dễ hiển thị).
- `abe_toy.py` — `encrypt(payload, policy)`, `decrypt(ct, attributes)`.
- `service.py` — trạng thái phiên: issuer, holder, verifier, danh sách văn bằng mẫu (5 sinh viên tổng hợp), log thời gian từng bước.
- API (prefix `/api/cd1`):
  | Method | Path | Mô tả |
  |---|---|---|
  | POST | `/setup` | sinh khóa issuer, n relay, deploy 2 contract |
  | POST | `/issue` | cấp văn bằng batch → Merkle root → `anchorRoot` trên chain-A |
  | POST | `/prove` | body `{student_id, predicate: {attr, op, value}}` → statement + proof (witness ẩn) |
  | POST | `/verify` | relay kiểm proof + Merkle + revocation → ký → `submitAttestation` trên chain-B |
  | POST | `/tamper` | body `{kind: "proof"|"signature"|"below_threshold"|"replay"}` → chạy lại verify và trả lý do bị từ chối |
  | POST | `/revoke` | thu hồi → lần verify sau bị từ chối |
  | GET | `/timeline` | thời gian từng giai đoạn (ms) + kích thước proof/chữ ký |

## Frontend (`frontend/src/modules/cd1/`)
- **Bố cục 3 cột** Issuer (chain-A) · Relay committee · Verifier (chain-B) với đường kết nối animate khi dữ liệu di chuyển.
- **Stepper 5 bước** (setup → cấp → chứng minh → xác minh → thu hồi), mỗi bước một nút "Chạy bước".
- **Hộp "Statement vs Witness"**: bên trái (công khai, chuyển qua cầu) / bên phải (bí mật, mờ + biểu tượng khóa, không rời máy holder).
- **Vòng tròn ủy ban**: n relay, chữ ký sáng lên khi ký; thanh ngưỡng t/n.
- **Shamir visualizer**: chọn t, n → các mảnh (x, y) → khôi phục khi đủ t mảnh.
- **Nút "Giả mạo"** (proof sai, chữ ký giả, thiếu ngưỡng, phát lại) → hiệu ứng đỏ + lý do on-chain.
- **Biểu đồ** thời gian từng giai đoạn (Recharts) + kích thước dữ liệu (proof, chữ ký, bản mã ABE).
- Thẻ **"Kết quả luận án (trích dẫn)"** tách biệt với số đo demo: độ trễ toàn trình ≈ 2,41 s; proof ZKP 175 B; chữ ký TSS 64 B; bản mã CP-ABE 846 B; 140 TPS xác minh với 30 worker — ghi rõ nguồn "Báo cáo CĐ1".

## Kịch bản demo (≈ 3 phút)
1. Setup → 2. Cấp batch 5 văn bằng (thấy Merkle root lên chain-A) → 3. Sinh viên S3 chứng minh "GPA ≥ 3.2" mà không lộ GPA → 4. Relay ký 3/5 → chain-B chấp nhận → 5. Bấm "Giả mạo: thiếu ngưỡng" → bị từ chối → 6. Thu hồi S3 → verify lại bị từ chối.

## Tiêu chí hoàn thành (test)
- Merkle proof đúng/sai; toy ZKP chấp nhận witness đúng, từ chối witness sai; ≥ t chữ ký → accepted, < t hoặc signer trùng → rejected; replay cùng nonce → rejected; revoke có hiệu lực.
- `python -m app.modules.cd1_univ.demo --export` ghi `frontend/public/replays/cd1/credential-flow.json`.

## Ghi chú hiện thực (P2)
- ZKP toy: nhóm Schnorr 65-bit, cam kết Pedersen cho GPA, chứng minh khoảng bằng phân rã bit + OR-proof (CDS) + Fiat–Shamir gắn nonce của verifier.
- Gateway gom **t chữ ký nhanh nhất** (relay có độ trễ ngẫu nhiên); `msgHash` gồm nonce của verifier ‖ lượt relay nên mỗi lần xác minh là thông điệp mới.
- Thêm kiểu giả mạo `duplicate` (một chữ ký lặp t lần). Thẻ bản mã CP-ABE có thử giải mã với 3 bộ thuộc tính.
