# CĐ2 · CrossGuard — đặc tả module demo (Phase P3)

**Chuyên đề:** Phát hiện lỗ hổng bảo mật và kiểm toán hợp đồng thông minh liên chuỗi · **Secure SDLC:** 2. Secure Coding, 3. Testing & Audit
**Ý tưởng gốc:** kiểm toán trước triển khai cho hợp đồng cầu nối gồm 4 module: **M1** thu thập & biểu diễn đa nguồn (CPG = AST+CFG+PDG, token CodeBERT, kiểu thao tác liên chuỗi) → **M2** lõi phát hiện ngữ nghĩa (Unitary Tensor Encoder, Neural ODE, attention fusion, few-shot prototype) → **M3** học liên kết bảo toàn riêng tư (DP-SGD, RDP, tổng hợp DAA) → **M4** hồ sơ kiểm toán (mức rủi ro, bất biến có kiểu, gợi ý sửa). 5 nhóm lỗi: tổn hại validator/oracle, lỗi logic cầu nối, lỗi kiểm chứng thông điệp/trạng thái, rủi ro tập trung & kiểm soát truy cập, vi phạm quy tắc an toàn giao thức.

## Phạm vi demo (tượng trưng, chạy nhanh)
| Thành phần luận án | Bản demo |
|---|---|
| CPG (AST+CFG+PDG) | Parser nhẹ bằng regex/tokenizer cho Solidity mẫu → đồ thị hàm, lời gọi, biến trạng thái, `require` (đủ để vẽ). |
| CodeBERT | TF-IDF ký tự/token (scikit-learn) → vector văn bản. |
| Kiểu thao tác liên chuỗi | Heuristic phát hiện `lock`, `burn`, `mint`, `release`, `verifySignature`, `nonce/processed[...]`, `onlyOwner/onlyRelayer`, `oracle.price`. |
| Unitary encoder + Neural ODE + attention | Ghép 3 vector (cấu trúc, văn bản, tương tác) với trọng số attention đồ chơi (softmax trên điểm tương quan) → `E_fused`. |
| Few-shot prototype network | Prototype = trung bình embedding k mẫu hỗ trợ mỗi lớp; phân loại theo khoảng cách Euclid; chuyển 1-shot ↔ 5-shot. |
| FedVuln DP-SGD + RDP + DAA | 5 client, logistic regression numpy; clip chuẩn từng mẫu C, nhiễu Gaussian σ; ε xấp xỉ theo công thức RDP đơn giản (ghi nhãn "ước lượng toy"); dữ liệu non-IID theo Dirichlet α. |
| CrossChain-VulnDB | ~200 mẫu tổng hợp (sinh từ template hợp đồng + biến thể), seed cố định. |

## Hợp đồng (`contracts/src/cd2/`)
Bridge mẫu ngắn (≤ 60 dòng mỗi file), mỗi file một lỗi rõ ràng + bản sửa:
- `VulnBridgeNoNonce.sol` — `release()` không đánh dấu message đã xử lý → **phát lại**.
- `VulnBridgeWeakThreshold.sol` — kiểm chữ ký nhưng ngưỡng = 1 / không loại signer trùng.
- `VulnBridgeNoSourceCheck.sol` — không kiểm `srcChainId`/địa chỉ cầu nguồn.
- `VulnBridgeAccess.sol` — `setRelayer()` thiếu `onlyOwner`.
- `VulnBridgeOracle.sol` — tin giá oracle đơn lẻ không kiểm độ mới.
- `SafeBridge.sol` — bản sửa tổng hợp (nonce, ngưỡng, source check, access control).
- `WrappedToken.sol` — token đích để thấy mint/release.

## Backend (`backend/app/modules/cd2_crossguard/`)
- `samples/` — mã nguồn Solidity mẫu (dùng chung với `contracts/src/cd2`) + metadata nhãn.
- `m1_repr.py` — `tokens()`, `structure_graph()` (nodes/edges cho React Flow), `interactions()`.
- `m2_fewshot.py` — `embed()`, `fit_prototypes(k_shot)`, `predict()` trả nhãn, xác suất hiệu chỉnh (softmax nhiệt độ), khoảng cách tới từng prototype, đóng góp 3 nguồn; `pca2d()` cho scatter.
- `m3_federated.py` — `run_fl(rounds, clients, epsilon_target, alpha)` trả theo vòng: accuracy, loss, ε tích lũy, chuẩn gradient trước/sau clip.
- `m4_audit.py` — `report(contract)` → `{risk_tier: high|medium|low, p_vuln, category, evidence[], code_spans[], invariants[{id, predicate, kind: hard|soft, status: declared|candidate|verified}], fixes[]}`; xuất JSON.
- `exploit.py` — deploy bản lỗi & bản sửa lên ChainSim, chạy kịch bản tấn công (phát lại message cũ) → so số dư.
- API (prefix `/api/cd2`): `GET /samples`, `GET /samples/{id}`, `POST /m1/analyze`, `POST /m2/classify?k=1|5`, `GET /m2/embedding`, `POST /m3/run`, `POST /m4/report`, `POST /exploit/run?target=vuln|safe`.

## Frontend (`frontend/src/modules/cd2/`)
- Chọn hợp đồng mẫu (danh sách bên trái) hoặc dán mã; **editor chỉ đọc** với highlight vùng mã rủi ro.
- **Tab M1**: 3 thẻ (Cấu trúc · Văn bản · Tương tác); đồ thị React Flow; chip thao tác liên chuỗi.
- **Tab M2**: scatter 2D các mẫu + prototype (ngôi sao), đường nối tới prototype gần nhất; công tắc 1-shot/5-shot; thanh đóng góp từng nguồn; gauge `p_vuln`.
- **Tab M3**: sơ đồ 5 client → server (gói tin animate mỗi vòng); thanh trượt ε, α; biểu đồ accuracy & ε theo vòng; so sánh "không DP" vs "DP".
- **Tab M4**: hồ sơ kiểm toán dạng báo cáo (mức rủi ro màu, bằng chứng, bất biến với trạng thái, gợi ý sửa), nút "Tải JSON".
- **Tab Exploit lab**: chain-A ↔ chain-B, bấm "Tấn công phát lại" trên bản lỗi (số dư attacker tăng) rồi trên bản sửa (revert).
- Thẻ **"Kết quả luận án (trích dẫn)"**: F1 gộp 86,17%, PR-AUC 0,88; 1-shot 0,71 → 10-shot 0,88; FL 86,7% tại ε=1,0; 500 bên giữ F1 82,1% — nguồn "Báo cáo CĐ2".

## Kịch bản demo (≈ 4 phút)
Chọn `VulnBridgeNoNonce` → M1 thấy thiếu nút `processed[...]` → M2 phân loại "lỗi kiểm chứng thông điệp" (5-shot) → M3 chạy 10 vòng FL với ε=1 → M4 báo cáo rủi ro cao + bất biến `processed[msgId] == false trước release` → Exploit lab chứng minh hậu quả, đổi sang `SafeBridge` thì bị chặn.

## Tiêu chí hoàn thành (test)
- M1 phát hiện đúng thao tác liên chuỗi trên mẫu; M2 1-shot & 5-shot chạy, 5-shot ≥ 1-shot trên tập seed; M3 ε tăng đơn điệu theo vòng và gradient sau clip ≤ C; M4 sinh ≥ 1 bất biến cho mỗi mẫu lỗi; exploit thành công trên bản lỗi, revert trên bản sửa. Mỗi API < 3 giây.
- `demo --export` ghi `frontend/public/replays/cd2/audit-flow.json`.

## Ghi chú hiện thực (P3)
- Hợp đồng đặt tiền tố `Cd2…` (vd `Cd2WrappedToken`) để không trùng artifact với CĐ3; thêm `Cd2SourceVault` (chain-A) cho Exploit lab.
- Exploit lab có 5 tấn công: replay (NoNonce), chữ ký trùng/ngưỡng yếu (WeakThreshold), cầu nguồn giả (NoSourceCheck), chiếm quyền relayer (Access), thao túng giá oracle (Oracle); mỗi tấn công chạy cả trên SafeBridge. Bất biến tương ứng chuyển sang `verified` sau khi SafeBridge chặn được.
- M2: 1-shot ≈ 0,73 → 5-shot ≈ 0,90 trên tập tổng hợp (mẫu có “mồi nhử” từ lớp khác). M3 trung bình 4 seed; ε dùng tỉ lệ lấy mẫu như thể mỗi client có 400 bản ghi (ghi nhãn toy).
