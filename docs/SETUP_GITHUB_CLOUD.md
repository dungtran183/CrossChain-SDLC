# Hướng dẫn: đưa repo lên GitHub và chạy bằng Claude Code cloud

Tài liệu này dành cho **máy mới** nhận file `crosschain-sdlc-demo.zip`. Làm lần lượt từ bước 1 đến bước 7.

---

## Bước 1 — Cài công cụ trên máy mới
| Công cụ | Bắt buộc? | Ghi chú |
|---|---|---|
| Git | Có | https://git-scm.com/downloads |
| GitHub CLI (`gh`) | Nên có | https://cli.github.com — giúp tạo repo bằng 1 lệnh |
| Python 3.11+ | Chỉ khi muốn chạy demo trên máy | https://www.python.org/downloads/ |
| Node.js 20 LTS | Chỉ khi muốn chạy demo trên máy | https://nodejs.org |

> Việc viết code do Claude chạy trên cloud, nên máy mới **không bắt buộc** có Python/Node. Chỉ cần khi bạn muốn xem demo live trên máy.

## Bước 2 — Giải nén và tạo commit đầu tiên
```bash
# giải nén crosschain-sdlc-demo.zip, rồi:
cd crosschain-sdlc-demo
git init -b main
git add .
git commit -m "chore: initial scaffold for thesis demo"
```
Nếu Git báo thiếu danh tính:
```bash
git config --global user.name "Tên của bạn"
git config --global user.email "email@domain"
```

## Bước 3 — Tạo repo GitHub và đẩy code
**Cách A — GitHub CLI (khuyến nghị):**
```bash
gh auth login
gh repo create crosschain-sdlc-demo --private --source . --remote origin --push
```
**Cách B — trên web:** tạo repo trống tại https://github.com/new (không tick README/.gitignore), rồi:
```bash
git remote add origin https://github.com/<user>/crosschain-sdlc-demo.git
git push -u origin main
```
> Gợi ý để **private** cho tới khi bảo vệ/công bố; GitHub Pages cho repo private cần gói trả phí — nếu muốn link demo công khai miễn phí, chuyển repo sang public ở bước 7.

## Bước 4 — Kết nối Claude Code cloud với GitHub
1. Vào https://claude.ai/code và đăng nhập tài khoản có credit.
2. Chọn **Connect GitHub** → cài **Claude GitHub App** → cho phép truy cập repo `crosschain-sdlc-demo` (chỉ chọn repo này là đủ).
3. Chọn repo `crosschain-sdlc-demo` trong danh sách.

## Bước 5 — Tạo Environment (môi trường cloud)
Trong phần chọn/tạo environment:
- **Network access**: `Trusted` (mặc định — cho phép tải từ PyPI, npm, GitHub).
- **Setup script**: `bash scripts/setup_cloud.sh`
- Biến môi trường: không cần.

Repo còn có `.claude/settings.json` với SessionStart hook gọi lại `scripts/setup_cloud.sh` khi phiên cloud bắt đầu — script là idempotent nên chạy lại không tốn thời gian nếu đã cài.

## Bước 6 — Chạy các phiên theo lộ trình
1. Mở `docs/ROADMAP.md`, copy **Prompt P0** vào phiên cloud đầu tiên.
2. Khi phiên xong, Claude sẽ đẩy nhánh và mở Pull Request → vào GitHub xem PR, CI (tab *Checks*) xanh thì **Merge**.
3. Mở phiên mới cho phase kế tiếp (P1 → P2 → P3 → P4 → P5), mỗi phase một phiên.
4. Theo dõi credit đã dùng trong trang usage/billing của claude.ai; bảng ước tính ở đầu ROADMAP.

Mẹo:
- Nếu phiên báo lỗi cài đặt, quay lại làm P0 trước khi đi tiếp.
- P2, P3, P4 độc lập nhau (3 module rời) — có thể làm theo thứ tự bất kỳ sau P1, thậm chí song song ở 3 phiên khác nhau vì chúng không đụng chung file.
- Phiên cloud không mở được trình duyệt cho bạn xem; hãy xem kết quả qua GitHub Pages (bước 7) hoặc chạy trên máy (bước 8).

## Bước 7 — Bật GitHub Pages (link demo không cần backend)
1. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Mỗi lần merge vào `main`, workflow `Deploy demo (GitHub Pages)` build frontend ở chế độ replay.
3. Link dạng: `https://<user>.github.io/crosschain-sdlc-demo/`.

## Bước 8 — Chạy demo live trên máy (tùy chọn)
```bash
git pull
```
Windows:
```powershell
./scripts/setup_local.ps1
./scripts/dev.ps1
```
Linux/macOS:
```bash
bash scripts/setup_local.sh
bash scripts/dev.sh
```
Mở http://localhost:5173. Nếu PowerShell chặn script: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Xử lý sự cố thường gặp
| Hiện tượng | Cách xử lý |
|---|---|
| `safe-pysha3` build lỗi khi pip install | Không dùng `eth-tester[py-evm]`; requirements đã cài `eth-tester` + `py-evm` riêng — kiểm tra không ai thêm lại extra. |
| `npm ci` lỗi do chưa có `package-lock.json` | Script tự chuyển sang `npm install`; P0 sẽ commit lock file. |
| Frontend báo "Không kết nối được backend" | Backend chưa chạy ở :8000 — chạy `scripts/dev` hoặc dùng bản GitHub Pages (replay). |
| Pages 404 | Kiểm tra Source = GitHub Actions và workflow chạy xanh; repo private cần gói trả phí. |
