# Kịch bản trình bày / Demo script

> Mỗi trang module có nút **Chạy kịch bản tấn công / Run attack scenario** chạy tự động đúng các bước dưới đây. Thanh phụ đề ở đáy
> màn hình có thêm lời giải thích chi tiết cho người mới, thanh thời gian đọc và bộ chọn **tốc độ 0,5× · 0,75× · 1× · 1,5×**
> (khi trình bày trước hội đồng nên chọn 0,5× hoặc 0,75×). Space: tạm dừng · →: bước tiếp · Esc: dừng.
> Mọi thông báo hiện trên **dải sự kiện của header** (luôn đi theo thanh cuộn) — bấm để cuộn tới nơi xảy ra; chuông mở nhật ký đầy đủ.
> Each module page has a **Run attack scenario** button with detailed captions, a reading-time bar and a 0.5×–1.5× speed selector;
> every event appears in the header event strip, which follows the scroll.

**Chuẩn bị / Setup** — live (khuyến nghị): `bash scripts/dev.sh` → http://localhost:5173 · offline: link GitHub Pages (replay).
Màn hình chiếu ≥ 1280 px; chọn ngôn ngữ VI/EN ở góc phải trên.

---

## Trang chủ / Overview (≈ 30 s)
**VI.** “Luận án nghiên cứu an toàn giao tiếp liên chuỗi xuyên suốt vòng đời phát triển phần mềm an toàn. Ba chuyên đề là ba module độc lập: CĐ1 ở giai đoạn thiết kế, CĐ2 ở lập trình – kiểm toán trước triển khai, CĐ3 ở vận hành – tối ưu sau triển khai. Mọi module chạy trên hai chuỗi EVM giả lập với hợp đồng Solidity thật.”
**EN.** “The thesis secures cross-chain communication across the Secure SDLC. Three studies are three independent modules: design (CĐ1), pre-deployment coding & audit (CĐ2), post-deployment operations (CĐ3), all on two simulated EVM chains running real Solidity contracts.”

---

## Bản đồ khung Secure SDLC / Secure SDLC map (≈ 1 phút)
**VI.** “Khung Secure SDLC của luận án là một vòng đời khép kín gồm năm giai đoạn; kết quả đánh giá ở giai đoạn 5 phản hồi trở lại thiết kế. Ở trung tâm là cây cầu liên chuỗi — đối tượng cần bảo vệ. Ba cung màu là phạm vi ba chuyên đề: CĐ1 ở thiết kế, CĐ2 ở lập trình và kiểm toán, CĐ3 ở vận hành và tối ưu.” Chọn lần lượt các giai đoạn để giới thiệu mối đe dọa và đóng góp, rồi “Mở chuyên đề”. Kéo xuống *Bức tranh tổng thể*: rê chuột lên CĐ1/CĐ2/CĐ3 để thấy mỗi chuyên đề phòng vệ chặng nào. Trang *Sự cố thực tế* nối 9 vụ tấn công lớn với phần trình diễn tương ứng.
**EN.** “The thesis Secure SDLC is a closed five-phase lifecycle; evaluation in phase 5 feeds back into design. The cross-chain bridge in the centre is the asset to protect; three coloured arcs mark the scope of the three studies.” Select each phase to introduce threats and contributions, then “Open study”.

---

## CĐ1 · Π_univ (≈ 3 phút / minutes)
| # | Thao tác / Action | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | **1 · Thiết lập** | Triển khai CredentialRegistry trên chain-A và ThresholdVerifier với 5 relay, ngưỡng t = 3 trên chain-B. Mỗi relay có khóa ECDSA thật. | Deploy the registry on chain-A and a 3-of-5 threshold verifier on chain-B; each relay holds a real ECDSA key. |
| 2 | **2 · Cấp lô văn bằng** | Trường cấp 5 văn bằng; mỗi văn bằng là các cam kết (hash + Pedersen). Chỉ Merkle root lên chuỗi — không có dữ liệu cá nhân. | The university issues 5 credentials as commitments; only the Merkle root goes on-chain. |
| 3 | Chọn **S3**, GPA ≥ 3.2 → **3 · Sinh ZKP** | Hộp Statement vs Witness: bên trái công khai đi qua cầu; bên phải (GPA, độ ngẫu nhiên) bị khóa, không rời máy người học. Bằng chứng ~405 B. | Statement vs Witness: the public part crosses the bridge, the secret GPA never leaves the holder. |
| 4 | **4 · Xác minh liên chuỗi** | Mỗi relay tự kiểm Merkle, trạng thái thu hồi trên chain-A và ZKP; gateway gom 3 chữ ký nhanh nhất; hợp đồng chain-B đếm chữ ký bằng `ecrecover` → **Chấp nhận**. | Relays check Merkle, revocation and ZKP; the fastest 3 signatures are verified on chain-B with ecrecover → accepted. |
| 5 | Thẻ CP-ABE: thử `role=HR, org=ACME` rồi `role=Sales` | Bản ghi xác nhận chỉ HR của ACME hoặc Auditor giải mã được. | Only ACME HR or an auditor can decrypt the attestation record. |
| 6 | **Phòng thí nghiệm giả mạo**: Thiếu ngưỡng · Chữ ký giả · Phát lại | Hợp đồng tự từ chối: 2/3 chữ ký → `AttestationRejected`; khóa ngoài ủy ban → 0 chữ ký hợp lệ; gửi lại thông điệp cũ → revert “replay”. Khối đỏ xuất hiện trên explorer chain-B. | The contract itself rejects: below threshold, forged keys, replayed message (red block on chain-B). |
| 7 | Shamir: bấm {R1,R2,R3} rồi {R1,R2} | Đủ 3 mảnh → khôi phục đúng 1234; 2 mảnh → sai. Không relay nào giữ toàn bộ khóa. | 3 shares recover the secret, 2 do not — nobody holds the whole key. |
| 8 | **5 · Thu hồi S3** → Sinh ZKP → Xác minh | Relay đọc trạng thái thu hồi trên chain-A và từ chối ký → chain-B từ chối. | Relays see the revocation on chain-A and refuse to sign → rejected. |
| 8b | Chọn kịch bản **S4 · Bằng cấp = Master** → Sinh → Xác minh; rồi **S1 (khai gian)** | Tiết lộ chọn lọc: chỉ mở cam kết “bằng cấp”, các thuộc tính khác vẫn ẩn → chấp nhận; S1 khai “Master” nhưng thực là Bachelor → cam kết mở ra không khớp → từ chối. | Selective disclosure accepted; a false claim fails the commitment opening. |
| 9 | Cuộn xuống biểu đồ + thẻ kết quả luận án | Thời gian từng giai đoạn, kích thước proof/chữ ký/bản mã; kết quả thực nghiệm: 2,41 s; 175 B; 64 B; 846 B; 140 TPS. | Per-phase timings and sizes; thesis results: 2.41 s, 175 B, 64 B, 846 B, 140 TPS. |

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
| 8 | (Tùy chọn) Chọn hợp đồng lỗi khác → Exploit lab | WeakThreshold: chữ ký trùng; NoSourceCheck: vault giả; Access: chiếm quyền relayer; Oracle: đẩy giá ×100; **Reentrancy**: hợp đồng tấn công gọi lại unlock() rút 6 lần; **NoDomain**: chữ ký cho chain-B bị phát lại trên cầu song sinh ở chain-A. | Other attacks incl. reentrancy (6× drain) and cross-chain signature replay. |

---

## CĐ3 · CrossSentry (≈ 4 phút)
> Tốc độ tick mặc định 2 s (1×); 0,5× = 4 s/tick. Khung **Diễn giải từng tick** ngay dưới hai làn sự kiện kể lại bằng lời thường từng
> điều vừa xảy ra — đọc to khung này khi thuyết minh. Hộp thoại phê duyệt luôn hiện giữa màn hình đang xem (Enter: phê duyệt · Esc: để sau).

| # | Thao tác | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | Kịch bản **Bình thường** → **Chạy** (2×) ~10 tick | Hai làn chuỗi: mỗi Locked (A) được ghép với Minted (B) — xanh. Tab M1: đồ thị tác nhân–hợp đồng; bảng bằng chứng p̂, κ_L, κ_P, Bel thấp. | Every Locked is matched with a Minted; evidence stays low. |
| 2 | Chọn **Slow-burn** | V7 có lịch sử tốt bắt đầu ký mint thổi phồng trên tuyến A→B. Tab M2: thanh khối DS (kênh học ⊕ kênh luật → Bel/Pl, K); heatmap: ô (V7, A→B) chuyển đỏ, tuyến khác vẫn xanh. | V7 starts co-signing inflated mints; DS fusion and the CRS heatmap light up only (V7, A→B). |
| 3 | Hộp thoại **R4 · Cô lập V7** → **Phê duyệt** | R4/R5 không bao giờ tự thi hành. Phê duyệt gửi `blockActor(V7)` lên chain-B. Nếu có R4 cho validator chỉ tình cờ cùng ký (vd V2) → **Từ chối**: vai trò con người. | Human approval sends blockActor on-chain; reject weak co-signer cases. |
| 4 | Biểu đồ r(t) của V7|A→B | CRS phát hiện ở tick ~11, điểm tích lũy truyền thống muộn hơn nhiều hoặc chưa phát hiện (luận án: 293 → 21,3 bước). Mint do V7 tham gia giờ bị chặn (khối đỏ). | CRS detects far earlier than a cumulative score; V7's mints now revert. |
| 5 | Chọn **Thông đồng** | V4–V6 + R3 ký mint không có lock: chip đỏ nhấp nháy, “Đã mint (B)” vượt “Đã khóa (A)” → cảnh báo bất biến cung. | Colluding validators mint without locks; the supply invariant breaks. |
| 6 | Hộp thoại **R5 · Dừng cầu nối** → **Phê duyệt** | `pause()` on-chain; mọi mint sau đó revert “bridge paused”. | pause() on-chain; every later mint reverts. |
| 7 | Tab **M3**: Gini + Lorenz; w_g = 0 rồi 1 → **Tối ưu Θ** | G-surv đo mức dồn biện pháp giám sát vào ít tác nhân; bật tiêu chí tập trung (w_g) làm Θ tối ưu dịch sang ngưỡng cao hơn, giảm Gini — cân bằng phát hiện với công bằng. | G-surv (Gini) and F(Θ): the concentration criterion shifts the optimal thresholds. |

| 8 | (Tùy chọn) **Oracle lệch giá** / **Rút cạn đột biến** / **Mất validator** | O1 báo giá lệch → trách nhiệm quy cho oracle, không cho validator; U3 chuyển khối lượng cực lớn — không luật nào bắt, chỉ kênh học thấy → R4; V1–V2 ngoại tuyến → trễ lan trên mọi relayer được nhận diện là sự cố hệ thống, không ai bị cô lập. | Oracle blamed, not validators; a rule-less flash drain caught by the learning channel; a systemic outage blames nobody. |

*Replay (GitHub Pages)*: mỗi kịch bản là một bản ghi riêng (9 kịch bản), khởi động bằng lưu lượng bình thường rồi chuyển sang kịch bản.

## Sự cố thực tế / Real-world incidents (≈ 2 phút)
| # | Thao tác | Thuyết minh (VI) | Narration (EN) |
|---|---|---|---|
| 1 | Mở **Sự cố thực tế**, khung **Diễn biến tấn công** tự phát vụ **Ronin** | Hai cảnh chạy cùng nhịp: bên trái là điều đã xảy ra (4 khóa bị đánh cắp, chữ ký thứ 5 "ký hộ", kho bị rút 624 triệu USD, phát hiện sau 6 ngày); bên phải cùng cuộc tấn công nhưng cầu nối có CĐ1 — khiên chặn ở bước 2, kho giữ nguyên. | Same attack, two worlds: reality on the left, the CĐ1-equipped bridge on the right stops it at step 2. |
| 2 | Chọn **Nomad** / **Poly Network** | Lỗi nằm trong mã: CĐ2 chặn ngay từ bước đầu tiên ở cổng kiểm toán (bất biến kiểm chứng thông điệp, bất biến phân quyền) — lỗ hổng không bao giờ lên chuỗi. | Code bugs: CĐ2 stops them at the audit gate before deployment. |
| 3 | Chọn **Orbit Bridge** | Khóa đã bị chiếm đủ ngưỡng nên chữ ký "hợp lệ": CĐ3 để lệnh rút đầu tiên diễn ra, phát hiện bất thường và R5 tạm dừng cầu nối — chỉ mất ≈ 15%. | Valid signatures, abnormal flow: CĐ3 detects the first withdrawal and pauses the bridge. |
| 4 | Bấm **Xem diễn biến** trên thẻ của bất kỳ sự cố nào | Trang cuộn về khung diễn biến; có thể dừng, lùi/tiến từng bước để thuyết minh. | Any card's "Watch the attack" jumps back to the player. |
