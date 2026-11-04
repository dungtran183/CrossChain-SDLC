# ROADMAP — lộ trình thực hiện trên Claude Code cloud

## Trạng thái
- [x] P0 môi trường · [x] P1 lõi chung · [x] P2 CĐ1 · [x] P3 CĐ2 · [x] P4 CĐ3 · [x] P5 replay + Pages + polish
  (hoàn thành trong một phiên; các commit tách theo phase trên nhánh `claude/vigilant-hawking-pzu3rn`).
- Từ đây dùng mục **Phiên sửa lỗi / góp ý** ở cuối tài liệu. Sau khi sửa logic module nhớ chạy `bash scripts/export_replays.sh`.

Mỗi phase = **một phiên cloud** (claude.ai/code). Copy nguyên khối *Prompt* vào ô chat của phiên mới.
Cuối mỗi phiên: test + build pass → commit → mở PR → bạn duyệt & merge → mới sang phase kế tiếp.

## Ngân sách credit (100 USD) — ước tính, theo dõi thực tế ở trang usage
| Phase | Nội dung | Model gợi ý | Ước tính |
|---|---|---|---|
| P0 | Kiểm tra & sửa môi trường cloud | Sonnet | ~3 USD |
| P1 | Lõi chung: ChainSim, contract pipeline, WS explorer, UI kit, ví ethers.js | Opus | ~12 USD |
| P2 | Module CĐ1 · Π_univ | Sonnet | ~18 USD |
| P3 | Module CĐ2 · CrossGuard | Sonnet | ~20 USD |
| P4 | Module CĐ3 · CrossSentry | Sonnet | ~20 USD |
| P5 | Replay JSON + GitHub Pages + polish đồ họa + kịch bản demo | Opus | ~10 USD |
| — | Dự phòng sửa lỗi / chỉnh theo góp ý | Sonnet | ~17 USD |

**Mẹo tiết kiệm:**
- Một phiên chỉ làm một phase; nếu phiên dài quá (> ~1–1,5 giờ), yêu cầu commit/PR rồi mở phiên mới cho phần còn lại.
- Prompt luôn chỉ rõ file cần đọc (CLAUDE.md + đặc tả module) để Claude không đọc lan man.
- Không yêu cầu "xem lại toàn bộ repo"; không bảo chạy lệnh lâu không cần thiết.
- Nếu phase bị lỗi môi trường, dừng lại sửa ở P0 thay vì để lỗi lan sang phase sau.

---

## P0 — Kiểm tra môi trường cloud
**Done khi:** `check_env.py` OK, pytest pass, `npm run build` pass, có `package-lock.json` ở `frontend/` và `contracts/`.

**Prompt:**
```
Đọc CLAUDE.md và docs/ROADMAP.md (mục P0). Đây là phiên P0: chỉ kiểm tra môi trường, chưa viết tính năng.
1) Chạy bash scripts/setup_cloud.sh (nếu chưa chạy) và python scripts/check_env.py; sửa mọi lỗi cài đặt.
2) cd backend && python -m pytest -q phải pass.
3) cd contracts && npm install && npm run compile — xác nhận artifacts/Ping.json sinh lại được (giữ nguyên ABI).
4) cd frontend && npm install && npm run build phải pass; commit package-lock.json của frontend và contracts.
5) Chạy thử backend uvicorn 5 giây và curl /api/health, /api/modules.
6) Cập nhật checkbox P0 trong README.md và ROADMAP.md, commit "chore: verify cloud environment", mở PR.
Báo cáo ngắn: phiên bản Python/Node, lỗi đã sửa.
```

## P1 — Lõi chung (core + UI kit)
**Done khi:** 2 chuỗi EVM chạy, deploy/gọi contract qua API, explorer realtime trên UI, ví trình duyệt ký giao dịch thô, UI kit dùng chung có trang `/playground` trình diễn các component.

**Prompt:**
```
Đọc CLAUDE.md, docs/ARCHITECTURE.md. Phiên P1: xây lõi dùng chung, KHÔNG viết logic của CĐ1/CĐ2/CĐ3.
Backend (backend/app/core):
- chainsim.py: hoàn thiện ChainSim quản lý nhiều chuỗi theo tên ("chain-A" chain_id 31337, "chain-B" chain_id 97),
  faucet cấp ETH cho địa chỉ bất kỳ, deploy(artifact_name, args), call/transact, lấy block/tx/log gần nhất,
  send_raw_transaction, snapshot/revert để reset; có thể tạo ChainSim riêng cho từng module (không singleton toàn cục).
- bus.py: WebSocket /ws phát sự kiện {type: block|tx|log|module, chain, data}; module có thể publish.
- routes chung: /api/chain/{name}/info|blocks|send_raw|faucet.
Contracts: giữ pipeline npm solc (contracts/compile.mjs), artifacts commit sẵn.
Frontend:
- Cài @xyflow/react, recharts, ethers (v6), lucide-react.
- src/components: GlassCard, Stepper (animated), Gauge, ChainPanel (luồng block trượt ngang), TxToast, JsonViewer,
  KeyValueTable, BilingualDisclaimer, ModuleHeader. Theme tối gradient, framer-motion.
- src/lib/wallet.ts: Wallet.createRandom lưu sessionStorage, ký tx thô theo chain_id, gửi /api/chain/{name}/send_raw.
- src/lib/api.ts: hỗ trợ live/replay (VITE_MODE=replay đọc /replays/...).
- Trang /playground trình diễn toàn bộ component + explorer 2 chuỗi live.
Test: pytest cho chainsim (deploy Ping, raw tx từ ví mới, reset). npm run build pass.
Cập nhật README/ROADMAP checkbox P1, commit, mở PR.
```

## P2 — Module CĐ1 · Π_univ
**Done khi:** trang `/cd1` chạy đủ 5 giai đoạn có animation, nút giả mạo bị từ chối on-chain, xuất replay JSON.

**Prompt:**
```
Đọc CLAUDE.md và docs/modules/CD1.md. Phiên P2: hiện thực module cd1_univ đúng đặc tả, chỉ trong các thư mục của CĐ1
(backend/app/modules/cd1_univ, contracts/src/cd1, frontend/src/modules/cd1, frontend/public/replays/cd1).
Dùng app/core và src/components có sẵn, không sửa lõi trừ khi bắt buộc (nếu sửa, ghi rõ lý do trong PR).
Viết test backend cho: Merkle proof, toy ZKP verify/reject, t-of-n ecrecover on-chain (đủ ngưỡng chấp nhận, thiếu ngưỡng từ chối), thu hồi.
Thêm key i18n VI/EN. Xuất 1 kịch bản replay bằng python -m app.modules.cd1_univ.demo --export.
pytest + npm run build pass. Cập nhật checkbox P2, commit, mở PR.
```

## P3 — Module CĐ2 · CrossGuard
**Done khi:** trang `/cd2` có 4 tab M1–M4 + tab "Exploit lab"; few-shot, FL DP-SGD chạy < 3 giây; audit report xuất JSON.

**Prompt:**
```
Đọc CLAUDE.md và docs/modules/CD2.md. Phiên P3: hiện thực module cd2_crossguard đúng đặc tả, chỉ trong các thư mục của CĐ2.
Dữ liệu tổng hợp nhỏ, seed cố định, chỉ numpy/scikit-learn. Hợp đồng mẫu lỗi + bản sửa trong contracts/src/cd2, biên dịch và commit artifacts.
Test: trích đặc trưng M1, prototype classifier 1-shot/5-shot chạy được, DP-SGD clip/noise đúng shape, ε tăng theo vòng,
exploit phát lại thành công trên bản lỗi và bị chặn trên bản sửa.
Thêm key i18n VI/EN, xuất replay. pytest + npm run build pass. Cập nhật checkbox P3, commit, mở PR.
```

## P4 — Module CĐ3 · CrossSentry
**Done khi:** trang `/cd3` có dashboard live với bộ sinh lưu lượng + 5 kịch bản tấn công, DS fusion, CRS heatmap, R0–R5 có phê duyệt, Gini/Lorenz.

**Prompt:**
```
Đọc CLAUDE.md và docs/modules/CD3.md. Phiên P4: hiện thực module cd3_crosssentry đúng đặc tả, chỉ trong các thư mục của CĐ3.
Bridge contract riêng của CĐ3 (contracts/src/cd3). Bộ sinh lưu lượng chạy theo "tick" (API POST /api/cd3/tick?n=…) để kiểm soát được.
Test: Dempster rule (K, Bel, Pl) với ví dụ tay, CRS suy giảm + bước nhảy, Gini của phân bố đều = 0, các kịch bản tạo cảnh báo đúng nhóm.
Thêm key i18n VI/EN, xuất replay. pytest + npm run build pass. Cập nhật checkbox P4, commit, mở PR.
```

## P5 — Replay, GitHub Pages, polish
**Done khi:** link GitHub Pages hiển thị 3 module ở chế độ replay; README có ảnh chụp; `docs/DEMO_SCRIPT.md` có kịch bản trình bày 3–5 phút mỗi module.

**Prompt:**
```
Đọc CLAUDE.md và docs/ROADMAP.md mục P5. Phiên P5: hoàn thiện trình diễn.
1) Đảm bảo mọi trang chạy ở VITE_MODE=replay với dữ liệu trong frontend/public/replays; banner nhỏ "Replay mode".
2) Kiểm tra .github/workflows/pages.yml (base path = tên repo), build replay pass.
3) Polish: trang chủ hero giới thiệu luận án + 3 thẻ module, hiệu ứng chuyển trang, trạng thái loading/empty/error.
4) (Tùy chọn) Playwright chụp ảnh 3 trang lưu docs/screenshots và chèn vào README.
5) Viết docs/DEMO_SCRIPT.md (VI + EN): kịch bản bấm từng nút, lời thuyết minh ngắn cho mỗi module.
Cập nhật checkbox P5, commit, mở PR.
```

## Phiên sửa lỗi / góp ý (dùng phần dự phòng)
```
Đọc CLAUDE.md. Sửa vấn đề sau ở module <cdX>: <mô tả lỗi / góp ý, kèm ảnh chụp hoặc log nếu có>.
Chỉ sửa trong thư mục của module đó. pytest + npm run build pass, commit, mở PR.
```
