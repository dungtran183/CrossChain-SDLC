# CLAUDE.md — hướng dẫn cho Claude Code (local & cloud)

## Dự án là gì
Prototype **demo trên trình duyệt** cho luận án về an toàn liên chuỗi, gồm 3 module độc lập:
`cd1_univ` (Π_univ – ZKP/TSS/CP-ABE toy), `cd2_crossguard` (kiểm toán hợp đồng cầu nối), `cd3_crosssentry` (giám sát sau triển khai).
Mục tiêu là **trình diễn workflow, đồ họa đẹp, dễ hiểu** — KHÔNG tái lập số liệu luận án. Đọc `docs/ROADMAP.md` để biết phase hiện tại và `docs/modules/CDx.md` cho đặc tả module.

## Lệnh thường dùng
- Cài đặt (cloud tự chạy qua SessionStart hook): `bash scripts/setup_cloud.sh`
- Kiểm tra môi trường: `python scripts/check_env.py`
- Test backend: `cd backend && python -m pytest -q`
- Chạy backend: `cd backend && python -m uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev` · build: `npm run build` · typecheck: `npm run typecheck`
- Biên dịch contract: `cd contracts && npm run compile` (ghi vào `contracts/artifacts/*.json` — commit artifacts)
- Demo CLI của một module: `cd backend && python -m app.modules.<module>.demo`

## Quy tắc kiến trúc (bắt buộc)
1. **Modular tuyệt đối**: mỗi module chỉ nằm trong
   `backend/app/modules/<module>/`, `contracts/src/<cdX>/`, `frontend/src/modules/<cdX>/`, `frontend/public/replays/<cdX>/`.
   Module **không import module khác**. Dùng chung chỉ được: `backend/app/core/*`, `frontend/src/components/*`, `frontend/src/lib/*`.
2. Đăng ký module bằng **một dòng** trong `backend/app/modules/registry.py` và `frontend/src/modules/registry.ts`.
3. Mỗi module có: router FastAPI prefix `/api/<cdX>`, `GET /status`, `POST /reset`, file `demo.py` (CLI), test riêng `backend/tests/test_<module>.py`.
4. Không có luồng tổng nối CĐ1→CĐ2→CĐ3. Nếu muốn liên hệ (ví dụ bất biến từ CĐ2 dùng ở CĐ3), chỉ qua **file JSON mẫu** tĩnh trong thư mục của module nhận.
5. Chuỗi khối: dùng `app.core.chainsim.ChainSim` (2 chuỗi EVM py-evm). Mỗi module tạo/đặt lại chuỗi của riêng mình, không dùng trạng thái toàn cục chung.
6. Hai chế độ frontend: `live` (gọi backend) và `replay` (đọc `/replays/<cdX>/*.json`). Mọi màn hình phải chạy được ở replay để deploy GitHub Pages.

## Quy tắc dữ liệu & thuật toán
- Dữ liệu tổng hợp, nhỏ (≤ ~300 mẫu), seed cố định; mỗi thao tác backend < ~3 giây trên CPU.
- Không tải dataset/model lớn, không dùng GPU, không dùng torch/tensorflow (chỉ numpy, scikit-learn).
- Mật mã "toy" phải được ghi nhãn rõ trên UI ("minh họa / toy — không dùng thực tế"). Chữ ký ECDSA và `ecrecover` thì dùng thật (eth-account).
- UI luôn hiển thị dòng: "Minh họa — không phải kết quả thực nghiệm của luận án" / "Illustrative — not thesis results".

## Quy tắc UI
- Song ngữ: mọi chuỗi hiển thị lấy từ `frontend/src/i18n/vi.json` + `en.json` (key theo dạng `cd2.m1.title`). Thêm key vào **cả hai** file.
- Theme tối, gradient, glassmorphism; màu module: CĐ1 cyan/teal, CĐ2 violet/indigo, CĐ3 amber/rose.
- Animation bằng framer-motion; đồ thị bằng React Flow (`@xyflow/react`); biểu đồ bằng Recharts.
- Responsive tối thiểu 1280px (máy chiếu) và không vỡ ở 768px.

## Quy trình làm việc trên cloud
- Mỗi phiên làm **một phase** trong `docs/ROADMAP.md`; cập nhật checkbox trạng thái ở README + ROADMAP khi xong.
- Trước khi kết thúc: `python -m pytest -q` (backend) và `npm run build` (frontend) phải pass; commit theo Conventional Commits; mở PR.
- Không thêm dependency nặng khi chưa cần; ghi lý do khi thêm dependency mới.
- Không xem được giao diện trên cloud: tự kiểm bằng build + test; nếu cần ảnh chụp, dùng Playwright (tùy chọn) lưu vào `docs/screenshots/`.
