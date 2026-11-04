// Thư viện sự cố cầu nối liên chuỗi tiêu biểu (số liệu ước tính theo báo cáo công khai) và chuyên đề nào phòng vệ.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Flame, ShieldCheck } from "lucide-react";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";
import { CHART } from "../lib/theme";

type ModId = "cd1" | "cd2" | "cd3";
const COLOR: Record<ModId, string> = { cd1: "#22d3ee", cd2: "#8b5cf6", cd3: "#f59e0b" };

/** Tổn thất ước tính (triệu USD) theo các báo cáo công khai; `cat` = nhóm lỗi của CĐ2; `by` = chuyên đề phòng vệ. */
const INCIDENTS: { id: string; name: string; date: string; loss: number; cat: string; by: ModId[]; demo: string }[] = [
  { id: "poly", name: "Poly Network", date: "2021-08", loss: 611, cat: "access_control", by: ["cd2", "cd3"], demo: "/cd2?tab=ex" },
  { id: "qubit", name: "Qubit Finance", date: "2022-01", loss: 80, cat: "bridge_logic", by: ["cd2"], demo: "/cd2?tab=m4" },
  { id: "wormhole", name: "Wormhole", date: "2022-02", loss: 326, cat: "message_verification", by: ["cd1", "cd2"], demo: "/cd1" },
  { id: "ronin", name: "Ronin Bridge", date: "2022-03", loss: 624, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd3" },
  { id: "harmony", name: "Harmony Horizon", date: "2022-06", loss: 100, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd1" },
  { id: "nomad", name: "Nomad Bridge", date: "2022-08", loss: 190, cat: "message_verification", by: ["cd2", "cd3"], demo: "/cd2?tab=ex" },
  { id: "bnb", name: "BNB Bridge", date: "2022-10", loss: 570, cat: "message_verification", by: ["cd1", "cd3"], demo: "/cd1" },
  { id: "multichain", name: "Multichain", date: "2023-07", loss: 126, cat: "access_control", by: ["cd1", "cd3"], demo: "/cd3" },
  { id: "orbit", name: "Orbit Bridge", date: "2024-01", loss: 81, cat: "validator_oracle", by: ["cd1", "cd3"], demo: "/cd3" },
];

export default function Incidents() {
  const { t, lang } = useT();
  const [filter, setFilter] = useState<ModId | "all">("all");
  const list = useMemo(() => INCIDENTS.filter((x) => filter === "all" || x.by.includes(filter)), [filter]);
  const total = list.reduce((s, x) => s + x.loss, 0);
  const fmt = (m: number) => (lang === "vi" ? `≈ ${m.toLocaleString("vi-VN")} triệu USD` : `≈ $${m.toLocaleString("en-US")}M`);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">
          <Flame className="h-3 w-3" /> {t("inc.badge")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight">{t("inc.title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("inc.body")}</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <section className="glass p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="label">{t("inc.chart")}</div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "cd1", "cd2", "cd3"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`chip ${filter === f ? "border-white/50 text-white" : ""}`}>
                  {f !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: COLOR[f] }} />}
                  {f === "all" ? t("inc.all") : `${f.toUpperCase()} · ${t(`${f}.name`)}`}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={list} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="name" stroke={CHART.axis} angle={-25} textAnchor="end" interval={0} height={50} />
                <YAxis stroke={CHART.axis} width={46} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="loss" radius={[6, 6, 0, 0]} animationDuration={900}>
                  {list.map((x) => (
                    <Cell key={x.id} fill={COLOR[x.by[0]]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-sm text-slate-300">
            {t("inc.total")}: <b className="text-rose-300">{fmt(total)}</b> · {list.length} {t("inc.cases")}
          </div>
        </section>
        <section className="glass space-y-3 p-5">
          <div className="label">{t("inc.lessons")}</div>
          {MODULES.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[m.id] }} />
                {m.id.toUpperCase()} · {t(`${m.id}.name`)}
              </div>
              <p className="text-xs text-slate-300">{t(`inc.lesson.${m.id}`)}</p>
            </div>
          ))}
        </section>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((x, i) => (
          <motion.article key={x.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-lg font-bold">{x.name}</div>
                <div className="text-xs text-slate-400">{x.date}</div>
              </div>
              <div className="rounded-lg bg-rose-500/15 px-2 py-1 text-right text-sm font-extrabold text-rose-200">{fmt(x.loss)}</div>
            </div>
            <div>
              <div className="label mb-0.5">{t("inc.cause")}</div>
              <p className="text-sm text-slate-200">{t(`inc.items.${x.id}.cause`)}</p>
            </div>
            <div>
              <div className="label mb-0.5">{t("inc.defense")}</div>
              <p className="text-sm text-slate-300">{t(`inc.items.${x.id}.defense`)}</p>
            </div>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {x.by.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-ink-950" style={{ background: COLOR[b] }}>
                    <ShieldCheck className="h-3 w-3" /> {b.toUpperCase()}
                  </span>
                ))}
                <span className="chip text-[10px]">{t(`inc.cat.${x.cat}`)}</span>
              </div>
              <Link to={x.demo} className="flex items-center gap-1 text-xs text-slate-200 hover:text-white">
                {t("inc.try")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.article>
        ))}
      </section>
      <p className="text-[11px] text-slate-500">{t("inc.source")}</p>
    </div>
  );
}
