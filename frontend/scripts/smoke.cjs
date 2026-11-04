// Kiểm thử khói giao diện (bản replay): chạy với `npm run build:replay && npx vite preview --port 4173`
// rồi `node scripts/smoke.cjs` (BASE mặc định http://localhost:4173/). Thoát mã 1 nếu có lỗi.
const { chromium } = require("playwright");

const BASE = (process.env.BASE || "http://localhost:4173/").replace(/\/?$/, "/");
const ROUTES = ["/", "/cd1", "/cd2", "/cd3", "/incidents", "/playground"];
const RAW_KEY = /\b(cd[123]|inc|world|home|primer|newbie|dock|hint|pace|common|quest|app)\.[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*\b/;
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
};
const url = (route) => `${BASE}#${route}`;

async function page(browser, { theme = "light", width = 1440, height = 900, pace } = {}) {
  const p = await browser.newPage({ viewport: { width, height } });
  await p.addInitScript(
    ([th, pc]) => {
      localStorage.setItem("xchain-theme", th);
      localStorage.setItem("xchain-lang", "vi");
      if (pc) localStorage.setItem("xchain-pace", String(pc));
    },
    [theme, pace],
  );
  p.errors = [];
  p.on("pageerror", (e) => p.errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && p.errors.push(m.text()));
  return p;
}

const inViewport = (box, vp) => box && box.y >= 0 && box.x >= 0 && box.y + box.height <= vp.height + 1 && box.x + box.width <= vp.width + 1;

(async () => {
  const browser = await chromium.launch();

  // 1) mọi trang × theme × kích thước: không lỗi, không khóa i18n thô, không cuộn ngang
  for (const theme of ["light", "dark"]) {
    for (const width of [1440, 390]) {
      const p = await page(browser, { theme, width });
      for (const r of ROUTES) {
        await p.goto(url(r));
        await p.waitForTimeout(2200);
        const text = await p.evaluate(() => document.body.innerText);
        const raw = text.match(RAW_KEY);
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        ok(p.errors.length === 0, `${r} ${theme} ${width}px: không lỗi console ${p.errors.slice(0, 2).join(" | ")}`);
        ok(!raw, `${r} ${theme} ${width}px: không còn khóa i18n thô ${raw ? raw[0] : ""}`);
        ok(overflow <= 1, `${r} ${theme} ${width}px: không cuộn ngang (${overflow}px)`);
        p.errors.length = 0;
      }
      await p.close();
    }
  }

  // 2) trang chủ: số liệu và phần cho người mới
  {
    const p = await page(browser);
    await p.goto(url("/"));
    await p.waitForTimeout(3000);
    ok((await p.getByTestId("hero-stats").innerText()).includes("9"), "trang chủ: dải số liệu đếm tới 9 sự cố");
    await p.getByTestId("newcomer").scrollIntoViewIfNeeded();
    await p.waitForTimeout(1200);
    ok((await p.getByTestId("newcomer").locator("article").count()) === 4, "trang chủ: 4 thẻ \"Lần đầu đến đây?\"");
    ok((await p.getByTestId("world-auto").count()) === 1, "trang chủ: bản đồ SDLC tự giới thiệu");
    await p.close();
  }

  // 3) CĐ3: tốc độ 0,5× chậm hơn 1,5×
  const ticksAfter = async (pace, ms) => {
    const p = await page(browser, { pace });
    await p.goto(url("/cd3"));
    await p.waitForTimeout(2500);
    const before = Number((await p.getByTestId("cd3-tick").innerText()).replace(/\D/g, "")) || 0;
    await p.getByRole("button", { name: /^Chạy$/ }).first().click();
    await p.waitForTimeout(ms);
    const after = Number((await p.getByTestId("cd3-tick").innerText()).replace(/\D/g, "")) || 0;
    await p.close();
    return after - before;
  };
  const slow = await ticksAfter(0.5, 9000);
  const fast = await ticksAfter(1.5, 9000);
  ok(fast >= slow * 2 && slow >= 1, `CĐ3: 1,5× (${fast} tick) nhanh hơn rõ rệt 0,5× (${slow} tick) trong 9 s`);

  // 4) CĐ3: hộp thoại phê duyệt nằm trong màn hình kể cả khi đang cuộn ở cuối trang
  {
    const p = await page(browser, { pace: 1.5 });
    const vp = p.viewportSize();
    await p.goto(url("/cd3"));
    await p.waitForTimeout(2500);
    const hint = await p.getByTestId("event-ticker").innerText();
    await p.getByRole("button", { name: /^Chạy$/ }).first().click();
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.getByRole("dialog").waitFor({ timeout: 90000 });
    await p.waitForTimeout(800);
    const box = await p.getByRole("dialog").locator(".glass").boundingBox();
    ok(inViewport(box, vp), `CĐ3: hộp thoại phê duyệt nằm trọn trong cửa sổ (y=${box && Math.round(box.y)})`);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(1500);
    ok((await p.getByRole("dialog").count()) === 0, "CĐ3: Enter phê duyệt và đóng hộp thoại");
    const ticker = await p.getByTestId("event-ticker").innerText();
    ok(ticker && ticker !== hint, `CĐ3: dải thông báo trên header cập nhật ("${ticker.split("\n")[0].slice(0, 60)}")`);
    ok((await p.getByTestId("cd3-narrator").locator("[style*='border-left-color']").count()) >= 3, "CĐ3: khung diễn giải có các dòng giải thích");
    await p.getByTestId("event-bell").click();
    ok(await p.getByTestId("event-log").isVisible(), "header: chuông mở nhật ký sự kiện");
    ok(p.errors.length === 0, `CĐ3: không lỗi console ${p.errors.join(" | ")}`);
    await p.close();
  }

  // 5) kịch bản tự động: thanh phụ đề nằm trong cửa sổ, có giải thích chi tiết và tốc độ
  {
    const p = await page(browser);
    const vp = p.viewportSize();
    await p.goto(url("/cd1"));
    await p.waitForTimeout(2000);
    await p.getByRole("button", { name: /^Chạy kịch bản tấn công$/ }).first().click();
    await p.waitForTimeout(3000);
    const bar = p.getByRole("status");
    ok(inViewport(await bar.boundingBox(), vp), "kịch bản: thanh phụ đề nằm trong cửa sổ");
    ok((await bar.getByRole("radio").count()) === 4, "kịch bản: có bộ chọn tốc độ");
    await p.keyboard.press("Escape");
    await p.close();
  }

  // 6) sự cố: bước cuối hiện phần "giữ lại được"
  {
    const p = await page(browser);
    await p.goto(url("/incidents"));
    await p.waitForTimeout(1500);
    await p.locator("#inc-player button[title]").last().click();
    await p.waitForTimeout(1200);
    ok(await p.getByText("Giữ lại được").isVisible(), "sự cố: so sánh kết cục ở bước cuối");
    await p.close();
  }

  await browser.close();
  console.log(failures.length ? `\n${failures.length} lỗi` : "\nTất cả kiểm tra đều đạt");
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
