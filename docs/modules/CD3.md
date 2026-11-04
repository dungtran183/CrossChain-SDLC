# CĐ3 · CrossSentry — đặc tả module demo (Phase P4)

**Chuyên đề:** Phát hiện bất thường và đánh giá tin cậy thích ứng trong giao tiếp liên chuỗi · **Secure SDLC:** 4. Secure Operations, 5. Optimization
**Ý tưởng gốc:** giám sát sau triển khai gồm 3 module: **M1** thu nhận sự kiện & tạo bằng chứng (ghép sự kiện nguồn–đích, đồ thị cầu nối, mã hóa thời gian, luật + tín hiệu bất thường, **ECA** với hệ số κ_L, κ_P → bằng chứng `E_v(t) = ⟨p̂_v, κ_L, Π_v, κ_P⟩`) → **M2** hợp nhất bằng chứng **Dempster–Shafer** (trọng số theo tin cậy, xung đột K_t, Bel/Pl) và **CRS** – trạng thái rủi ro theo cặp tác nhân–tuyến r_{v,c}(t) có suy giảm + bước nhảy → **M3** chọn phản ứng **R0–R5** (Observe, Alert, Throttle/Cap, Confirmation threshold, Isolate actor, Pause bridge; R4/R5 cần con người phê duyệt) và điều chỉnh tham số định kỳ với **G-surv** (Gini mức tập trung của biện pháp giám sát): F(Θ) = w_d·U_det − w_g·G_surv − w_c·C_op.

## Phạm vi demo
| Thành phần luận án | Bản demo |
|---|---|
| Dữ liệu 78 sự cố, 500 nút | Bộ sinh lưu lượng tổng hợp: ~20 tác nhân (user, relayer, validator, oracle), 3 tuyến (A→B, B→A, A→B qua oracle), chạy theo tick. |
| Đồ thị cầu nối + mã hóa thời gian | Đồ thị tác nhân–hợp đồng–tuyến (React Flow), đặc trưng cửa sổ trượt (độ trễ, khối lượng, tỉ lệ ghép). |
| Rule checking + anomaly signal | Luật: mint không có lock tương ứng, message xử lý 2 lần, độ trễ > ngưỡng, giá trị ra > vào. Anomaly: IsolationForest nhỏ (scikit-learn). |
| ECA | κ_L = độ tin cậy kênh học (giảm khi OOD — khoảng cách tới dữ liệu huấn luyện), κ_P = độ phủ của luật (tỉ lệ cặp sự kiện ghép được). Phần thiếu tin cậy giữ là khối "chưa biết" Θ. |
| Dempster–Shafer | Khung {normal, anomalous}, khối m({N}), m({A}), m(Θ); quy tắc Dempster, K_t, Bel/Pl. |
| CRS | r ← λ·r + (1−λ)·s_t, cộng bước nhảy khi Bel(A) vượt ngưỡng; giảm dần khi bình thường trở lại. |
| R0–R5 + G-surv | Ánh xạ (CRS, giá trị tài sản) → mức phản ứng; R4/R5 bật hộp thoại phê duyệt; Gini trên phân bố tác động biện pháp, đường Lorenz. |

## Hợp đồng (`contracts/src/cd3/`)
- `LockVault.sol` (chain-A): `lock(amount, dstChain, recipient)` phát `Locked(msgId, …)`.
- `MintGateway.sol` (chain-B): `mint(msgId, recipient, amount, sigs[])` theo xác nhận validator, phát `Minted(msgId, …)`; có `pause()` và `blockActor(addr)` (để R4/R5 tác động thật on-chain).
- `WrappedToken.sol` (chain-B).
- Bản "lỏng" có thể bật cờ trong kịch bản tấn công (vd validator thông đồng ký mint không có lock).

## Kịch bản (scenario) trong bộ sinh lưu lượng
1. `normal` — lưu lượng hợp lệ.
2. `replay` — gửi lại msgId cũ lên chain-B.
3. `delayed` — thông điệp bị giữ lâu bất thường.
4. `collusion` — t validator ký mint không có lock.
5. `slow_burn` — tác nhân có lịch sử tốt rồi bắt đầu gây hại (minh họa CRS phản ứng nhanh hơn điểm tích lũy truyền thống).
6. `boosting` — nhóm tác nhân phối hợp nâng điểm uy tín cho nhau.

## Backend (`backend/app/modules/cd3_crosssentry/`)
- `traffic.py` — sinh giao dịch thật trên ChainSim theo tick + kịch bản.
- `m1_events.py` — ghép `Locked`↔`Minted`, đồ thị, luật, IsolationForest, ECA → evidence.
- `m2_fusion.py` — `dempster_combine(m1, m2)`, `bel_pl()`, `CRS` (trạng thái theo (actor, corridor)).
- `m3_response.py` — chính sách R0–R5, hàng đợi phê duyệt, `gini()`, `lorenz()`, `tune(weights)`.
- API (prefix `/api/cd3`): `POST /start?scenario=`, `POST /tick?n=`, `GET /events`, `GET /graph`, `GET /evidence`, `GET /risk` (heatmap actor×corridor), `GET /responses`, `POST /approve/{id}`, `POST /reject/{id}`, `GET /gsurv`, `POST /tune`. Đẩy cập nhật qua `/ws` (source = "cd3").

## Frontend (`frontend/src/modules/cd3/`)
- **Thanh điều khiển**: chọn kịch bản, Play/Pause/Step, tốc độ tick.
- **Hai làn chuỗi** chain-A/chain-B với sự kiện `Locked`/`Minted` trượt qua và đường ghép; sự kiện không ghép được nhấp nháy.
- **Tab M1**: đồ thị cầu nối live; bảng bằng chứng (p̂, κ_L, κ_P, luật vi phạm).
- **Tab M2**: thanh khối DS (N / A / Θ) trước–sau hợp nhất, Bel–Pl dạng khoảng, chỉ số K; **heatmap CRS** tác nhân × tuyến; biểu đồ r(t) của tác nhân được chọn (thấy bước nhảy khi slow-burn).
- **Tab M3**: thang R0–R5 với mức hiện tại; **hộp thoại phê duyệt** cho R4/R5 (Approve/Reject → gọi `blockActor`/`pause` on-chain); Gini + đường Lorenz; thanh trượt w_d, w_g, w_c và biểu đồ F(Θ).
- Thẻ **"Kết quả luận án (trích dẫn)"**: macro-F1 0,812 ± 0,011; FPR 0,013; CRS giảm thời gian phát hiện 293 → 21,3 bước (−92,7%); F1 0,91 với Gini 0,32 trong môi trường 500 nút — nguồn "Báo cáo CĐ3".

## Kịch bản demo (≈ 4 phút)
Chạy `normal` 20 tick (mọi thứ xanh) → chuyển `slow_burn` (CRS tác nhân V7 tăng vọt trên tuyến A→B, các tuyến khác vẫn thấp) → M3 đề xuất R4 Isolate actor → bấm Approve → giao dịch của V7 bị chặn on-chain → chạy `collusion` → R5 Pause bridge cần phê duyệt → tab G-surv cho thấy Gini khi bật/tắt tiêu chí tập trung.

## Tiêu chí hoàn thành (test)
- Dempster: ví dụ tay (m1, m2) cho đúng K, Bel, Pl; CRS suy giảm khi bằng chứng bình thường, nhảy khi bất thường; Gini phân bố đều = 0, dồn hết = (n−1)/n; mỗi kịch bản tấn công tạo cảnh báo đúng nhóm; R4/R5 không tự thi hành khi chưa phê duyệt.
- `demo --export` ghi `frontend/public/replays/cd3/<scenario>.json` cho ít nhất `normal`, `slow_burn`, `collusion`.
