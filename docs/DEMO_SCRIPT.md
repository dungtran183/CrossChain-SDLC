# Kịch bản trình bày / Demo script

> Mỗi trang module có nút **Trình chiếu / Presentation** chạy tự động đúng các bước dưới đây, kèm phụ đề song ngữ
> (Space: tạm dừng · →: bước tiếp · Esc: thoát). Có thể bấm tay từng nút nếu muốn thuyết minh chậm hơn.
> Each module page has a **Presentation** button that plays these steps automatically with bilingual captions.
>
> Luôn nhắc: *“Minh họa — không phải kết quả thực nghiệm của luận án.”* Số liệu luận án nằm trong thẻ “Kết quả luận án (trích dẫn)” ở cuối mỗi trang.

**Chuẩn bị / Setup** — live (khuyến nghị): `bash scripts/dev.sh` → http://localhost:5173 · offline: link GitHub Pages (replay).
Màn hình chiếu ≥ 1280 px; chọn ngôn ngữ VI/EN ở góc phải trên.

---

## Trang chủ / Overview (≈ 30 s)
**VI.** “Luận án nghiên cứu an toàn giao tiếp liên chuỗi xuyên suốt vòng đời phát triển phần mềm an toàn. Ba chuyên đề là ba module độc lập: CĐ1 ở giai đoạn thiết kế, CĐ2 ở lập trình – kiểm toán trước triển khai, CĐ3 ở vận hành – tối ưu sau triển khai. Mọi module chạy trên hai chuỗi EVM giả lập với hợp đồng Solidity thật.”
**EN.** “The thesis secures cross-chain communication across the Secure SDLC. Three studies are three independent modules: design (CĐ1), pre-deployment coding & audit (CĐ2), post-deployment operations (CĐ3), all on two simulated EVM chains running real Solidity contracts.”

---

## CĐ1 · Π_univ (≈ 3 phút / minutes)
| # | Thao tác / Action | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | **1 · Thiết lập** | Triển khai CredentialRegistry trên chain-A và ThresholdVerifier với 5 relay, ngưỡng t = 3 trên chain-B. Mỗi relay có khóa ECDSA thật. | Deploy the registry on chain-A and a 3-of-5 threshold verifier on chain-B; each relay holds a real ECDSA key. |
| 2 | **2 · Cấp lô văn bằng** | Trường cấp 5 văn bằng; mỗi văn bằng là các cam kết (hash + Pedersen). Chỉ Merkle root lên chuỗi — không có dữ liệu cá nhân. | The university issues 5 credentials as commitments; only the Merkle root goes on-chain. |
| 3 | Chọn **S3**, GPA ≥ 3.2 → **3 · Sinh ZKP** | Hộp Statement vs Witness: bên trái công khai đi qua cầu; bên phải (GPA, độ ngẫu nhiên) bị khóa, không rời máy người học. Bằng chứng ~405 B (toy). | Statement vs Witness: the public part crosses the bridge, the secret GPA never leaves the holder. |
| 4 | **4 · Xác minh liên chuỗi** | Mỗi relay tự kiểm Merkle, trạng thái thu hồi trên chain-A và ZKP; gateway gom 3 chữ ký nhanh nhất; hợp đồng chain-B đếm chữ ký bằng `ecrecover` → **Chấp nhận**. | Relays check Merkle, revocation and ZKP; the fastest 3 signatures are verified on chain-B with ecrecover → accepted. |
| 5 | Thẻ CP-ABE: thử `role=HR, org=ACME` rồi `role=Sales` | Bản ghi xác nhận chỉ HR của ACME hoặc Auditor giải mã được. | Only ACME HR or an auditor can decrypt the attestation record. |
| 6 | **Phòng thí nghiệm giả mạo**: Thiếu ngưỡng · Chữ ký giả · Phát lại | Hợp đồng tự từ chối: 2/3 chữ ký → `AttestationRejected`; khóa ngoài ủy ban → 0 chữ ký hợp lệ; gửi lại thông điệp cũ → revert “replay”. Khối đỏ xuất hiện trên explorer chain-B. | The contract itself rejects: below threshold, forged keys, replayed message (red block on chain-B). |
| 7 | Shamir: bấm {R1,R2,R3} rồi {R1,R2} | Đủ 3 mảnh → khôi phục đúng 1234; 2 mảnh → sai. Không relay nào giữ toàn bộ khóa. | 3 shares recover the secret, 2 do not — nobody holds the whole key. |
| 8 | **5 · Thu hồi S3** → Sinh ZKP → Xác minh | Relay đọc trạng thái thu hồi trên chain-A và từ chối ký → chain-B từ chối. | Relays see the revocation on chain-A and refuse to sign → rejected. |
| 9 | Cuộn xuống biểu đồ + thẻ trích dẫn | Số đo demo (ms, byte) ≠ số liệu luận án (2,41 s; 175 B; 64 B; 846 B; 140 TPS). | Demo measurements vs cited thesis figures. |

**Thông điệp chính:** chuỗi đích quyết định dựa trên *bằng chứng mật mã*, không dựa vào uy tín relay. / *The destination chain decides on cryptographic evidence, not relay reputation.*

---

## CĐ2 · CrossGuard (≈ 4 phút)
| # | Thao tác | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | Chọn **VulnBridgeNoNonce** | Cầu nối mint token trên chain-B khi có chữ ký relayer. Trình xem mã tự cuộn và tô đỏ vùng rủi ro. | A bridge that mints on a relayer signature; risky lines are highlighted. |
| 2 | Tab **M1** | Đồ thị cấu trúc (≈ CPG): `release()` gọi `token.mint` nhưng không có nút `processed[...]`; chip “nonce_check/nonce_mark” bị gạch. | The structure graph shows mint without any processed[...] guard. |
| 3 | Tab **M2**, bật 1-shot rồi 5-shot | Không gian nhúng: sao = prototype mỗi nhóm lỗi; kim cương = hợp đồng đang xét nối tới prototype gần nhất. 1-shot dễ nhầm (≈ 73%), 5-shot tốt hơn (≈ 90%) → “Lỗi kiểm chứng thông điệp”. Thanh attention cho thấy nguồn “Tương tác” đóng góp nhiều nhất. | Prototype space; 1-shot vs 5-shot; attention shows which source matters. |
| 4 | Tab **M3**, ε = 1, α = 1 → **Chạy 10 vòng** | 5 bên cùng huấn luyện không chia sẻ mã; gói tin chạy mỗi vòng. DP-SGD: gradient sau cắt ≤ C, ε tăng dần tới 1; accuracy DP thấp hơn không-DP một chút. Thử ε = 0,5 và 4. | Federated DP-SGD: clipped gradients, ε accumulates to the target; privacy–utility trade-off. |
| 5 | Tab **M4** | Hồ sơ kiểm toán: rủi ro cao, bằng chứng (dòng BUG), bất biến `INV-NONCE` trạng thái *đề xuất*, gợi ý sửa; **Tải JSON**. | Audit report with typed invariants and fixes; downloadable JSON. |
| 6 | Tab **Exploit lab** → **Tấn công VulnBridgeNoNonce** | Attacker khóa 100 trên chain-A, rồi phát lại `release` 3 lần → số dư 400 wDEMO (300 không bảo chứng). | Lock 100, replay release 3× → 400 wDEMO, 300 unbacked. |
| 7 | **Tấn công SafeBridge** | Cùng tấn công: các lần phát lại revert “replay: processed”. Quay lại M4: `INV-NONCE` → *đã kiểm (exploit)*. | Same attack reverts on SafeBridge; the invariant becomes verified. |
| 8 | (Tùy chọn) Chọn hợp đồng lỗi khác → Exploit lab | WeakThreshold: chữ ký trùng; NoSourceCheck: vault giả; Access: chiếm quyền relayer; Oracle: đẩy giá ×100. | Other attacks: duplicate signature, fake source, relayer hijack, oracle pump. |

---

## CĐ3 · CrossSentry (≈ 4 phút)
| # | Thao tác | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | Kịch bản **Bình thường** → **Chạy** (2×) ~10 tick | Hai làn chuỗi: mỗi Locked (A) được ghép với Minted (B) — xanh. Tab M1: đồ thị tác nhân–hợp đồng; bảng bằng chứng p̂, κ_L, κ_P, Bel thấp. | Every Locked is matched with a Minted; evidence stays low. |
| 2 | Chọn **Slow-burn** | V7 có lịch sử tốt bắt đầu ký mint thổi phồng trên tuyến A→B. Tab M2: thanh khối DS (kênh học ⊕ kênh luật → Bel/Pl, K); heatmap: ô (V7, A→B) chuyển đỏ, tuyến khác vẫn xanh. | V7 starts co-signing inflated mints; DS fusion and the CRS heatmap light up only (V7, A→B). |
| 3 | Hộp thoại **R4 · Cô lập V7** → **Phê duyệt** | R4/R5 không bao giờ tự thi hành. Phê duyệt gửi `blockActor(V7)` lên chain-B. Nếu có R4 cho validator chỉ tình cờ cùng ký (vd V2) → **Từ chối**: vai trò con người. | Human approval sends blockActor on-chain; reject weak co-signer cases. |
| 4 | Biểu đồ r(t) của V7|A→B | CRS phát hiện ở tick ~11, điểm tích lũy truyền thống muộn hơn nhiều hoặc chưa phát hiện (luận án: 293 → 21,3 bước). Mint do V7 tham gia giờ bị chặn (khối đỏ). | CRS detects far earlier than a cumulative score; V7's mints now revert. |
| 5 | Chọn **Thông đồng** | V4–V6 + R3 ký mint không có lock: chip đỏ nhấp nháy, “Đã mint (B)” vượt “Đã khóa (A)” → cảnh báo bất biến cung. | Colluding validators mint without locks; the supply invariant breaks. |
| 6 | Hộp thoại **R5 · Dừng cầu nối** → **Phê duyệt** | `pause()` on-chain; mọi mint sau đó revert “bridge paused”. | pause() on-chain; every later mint reverts. |
| 7 | Tab **M3**: Gini + Lorenz; w_g = 0 rồi 1 → **Tối ưu Θ** | G-surv đo mức dồn biện pháp giám sát vào ít tác nhân; bật tiêu chí tập trung (w_g) làm Θ tối ưu dịch sang ngưỡng cao hơn, giảm Gini — cân bằng phát hiện với công bằng. | G-surv (Gini) and F(Θ): the concentration criterion shifts the optimal thresholds. |

*Replay (GitHub Pages)*: mỗi kịch bản là một bản ghi riêng (Bình thường / Slow-burn / Thông đồng), khởi động bằng lưu lượng bình thường rồi chuyển sang tấn công. Chạy local để thử đủ 6 kịch bản (thêm Phát lại, Trì hoãn, Nâng điểm).

---

## Câu hỏi thường gặp / FAQ khi bảo vệ
- **Có phải số liệu thật của luận án?** Không. Demo minh họa workflow; số liệu luận án chỉ ở thẻ trích dẫn.
- **ZKP có an toàn?** Không — sigma-protocol trên nhóm 65-bit để minh họa; luận án dùng Groth16. Chữ ký ECDSA và `ecrecover` là thật.
- **Hợp đồng có thật?** Có — Solidity 0.8.24 biên dịch bằng solc, chạy trên EVM (py-evm); tấn công và revert là giao dịch thật.
- **Không có mạng?** Dùng chế độ replay: `cd frontend && npm run build:replay && npx vite preview`.
