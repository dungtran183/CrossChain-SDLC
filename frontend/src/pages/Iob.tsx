// Internet of Blockchains: bức tranh hệ sinh thái nhiều chuỗi và vì sao giao tiếp liên chuỗi trở thành bề mặt tấn công lớn nhất.
// Gồm: đồ thị chuỗi–cầu nối có phát lại sự cố, số liệu, bài toán N², mô hình phân lớp và dòng thời gian.
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Milestone, Network, Sparkles, Target, Waypoints } from "lucide-react";
import { useT } from "../i18n/useT";
import AnimatedNumber from "../components/fx/AnimatedNumber";
import { TOTAL_LOSS } from "./incidents/data";
import IobGraph from "./iob/Graph";
import Scale from "./iob/Scale";
import Layers from "./iob/Layers";

function Section({ label, title, body, children, id }: { label: string; title: string; body?: string; children: React.ReactNode; id?: string }) {
  return (
    <motion.section id={id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5 }} className="glass scroll-mt-24 space-y-4 p-4 sm:p-6">
      <div>
        <div className="label">{label}</div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {body && <p className="mt-1 max-w-4xl text-sm text-slate-300">{body}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function Stats() {
  const { tl, lang } = useT();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.5 });
  const loc = lang === "vi" ? "vi-VN" : "en-US";
  const items = tl("iob.stats").map((s) => s.split("|"));
  // số liệu: [giá trị, số lẻ, tiền tố, hậu tố] — giá trị thứ 3 lấy từ dữ liệu demo
  const vals = [2, 69, TOTAL_LOSS / 1000, 6];
  const dec = [0, 0, 1, 0];
  const colors = ["from-rose-500 to-orange-400", "from-orange-400 to-amber-300", "from-violet-400 to-fuchsia-400", "from-sky-400 to-cyan-300"];
  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="iob-stats">
      {items.map(([pre, suf, body, src], i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={seen ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 * i }} className="glass p-4">
          <div className={`bg-gradient-to-r ${colors[i]} bg-clip-text font-display text-3xl font-extrabold text-transparent`}>
            <AnimatedNumber value={seen ? vals[i] : 0} decimals={dec[i]} duration={1.4} locale={loc} prefix={pre} suffix={suf} />
          </div>
          <p className="mt-1 text-sm text-slate-300">{body}</p>
          <p className="mt-1 text-[10px] text-slate-500">{src}</p>
        </motion.div>
      ))}
    </div>
  );
}

const KIND: Record<string, { c: string; icon: typeof Milestone }> = {
  m: { c: "#3d8bff", icon: Milestone },
  h: { c: "#ff4b4b", icon: Flame },
  t: { c: "#00c9b0", icon: Sparkles },
};

function Timeline() {
  const { tl } = useT();
  const items = tl("iob.time.items").map((s) => {
    const [year, kind, title, body] = s.split("|");
    return { year, kind, title, body };
  });
  return (
    <div className="relative" data-testid="iob-timeline">
      <div className="absolute bottom-2 left-[15px] top-2 w-[3px] rounded bg-gradient-to-b from-sky-400 via-rose-400 to-teal-400 opacity-60 lg:left-1/2 lg:-translate-x-1/2" />
      <ol className="space-y-3">
        {items.map((x, i) => {
          const k = KIND[x.kind] ?? KIND.m;
          const Icon = k.icon;
          const right = i % 2 === 1;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: right ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4 }}
              className={`relative flex gap-3 pl-0 lg:w-1/2 ${right ? "lg:ml-auto lg:pl-8" : "lg:flex-row-reverse lg:pr-8 lg:text-right"}`}
            >
              <span
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-surface-0 text-white lg:absolute lg:top-1 ${right ? "lg:-left-4" : "lg:-right-4"}`}
                style={{ background: k.c }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className={`min-w-0 flex-1 rounded-xl border p-3 ${x.kind === "t" ? "border-teal-400/50 bg-teal-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                <div className={`flex flex-wrap items-baseline gap-2 ${right ? "" : "lg:flex-row-reverse"}`}>
                  <span className="font-mono text-xs font-bold" style={{ color: k.c }}>
                    {x.year}
                  </span>
                  <span className="text-sm font-bold">{x.title}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{x.body}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default function Iob() {
  const { t } = useT();
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">
          <Network className="h-3 w-3" /> {t("iob.badge")}
        </span>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("iob.title")}</h1>
        <p className="max-w-4xl text-slate-300">{t("iob.body")}</p>
      </header>

      <section className="glass space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="label">{t("iob.graph.label")}</div>
            <h2 className="text-lg font-bold">{t("iob.graph.title")}</h2>
          </div>
          <p className="max-w-xl text-xs text-slate-400">{t("iob.graph.body")}</p>
        </div>
        <IobGraph />
      </section>

      <Stats />

      <Section label={t("iob.scale.label")} title={t("iob.scale.title")}>
        <Scale />
      </Section>

      <Section label={t("iob.layers.label")} title={t("iob.layers.title")} body={t("iob.layers.body")}>
        <Layers />
      </Section>

      <Section label={t("iob.time.label")} title={t("iob.time.title")}>
        <Timeline />
      </Section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { to: "/protocols", icon: <Waypoints className="h-5 w-5" />, k: "protocols", c: "from-violet-500 to-fuchsia-500" },
          { to: "/method", icon: <Target className="h-5 w-5" />, k: "method", c: "from-emerald-400 to-teal-500" },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="glass group flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${x.c} text-ink-950`}>{x.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold">{t(`app.nav.${x.k}`)}</span>
              <span className="block text-xs text-slate-400">{t(`iob.next.${x.k}`)}</span>
            </span>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-white" />
          </Link>
        ))}
      </section>
      <p className="text-[11px] leading-relaxed text-slate-500">{t("iob.source")}</p>
    </div>
  );
}
