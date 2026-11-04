// Thư viện sự cố cầu nối liên chuỗi tiêu biểu (số liệu ước tính theo báo cáo công khai) và chuyên đề nào phòng vệ.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Flame, PlayCircle, ShieldCheck, Swords } from "lucide-react";
import { useT } from "../i18n/useT";
import { MODULES } from "../modules/registry";
import { CHART } from "../lib/theme";
import { focusAnchor } from "../lib/activity";
import IncidentPlayer from "./incidents/IncidentPlayer";

import { COLOR, INCIDENTS, type ModId } from "./incidents/data";

export default function Incidents() {
  const { t, lang } = useT();
  const [filter, setFilter] = useState<ModId | "all">("all");
  const [pick, setPick] = useState("ronin");
  const picked = INCIDENTS.find((x) => x.id === pick) ?? INCIDENTS[0];
  const watch = (id: string) => {
    setPick(id);
    focusAnchor("inc-player");
  };
  const list = useMemo(() => INCIDENTS.filter((x) => filter === "all" || x.by.includes(filter)), [filter]);
  const total = list.reduce((s, x) => s + x.loss, 0);
  const fmt = (m: number) => (lang === "vi" ? `≈ ${m.toLocaleString("vi-VN")} triệu USD` : `≈ $${m.toLocaleString("en-US")}M`);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <span className="chip">
          <Flame className="h-3 w-3" /> {t("inc.badge")}
        </span>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t("inc.title")}</h1>
        <p className="max-w-3xl text-slate-300">{t("inc.body")}</p>
      </header>

      <section id="inc-player" className="glass space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-rose-300" />
            <div className="font-display text-base font-bold">{t("inc.player.title")}</div>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t("inc.player.pick")}>
            {[...INCIDENTS]
              .sort((a, b) => b.loss - a.loss)
              .map((x) => (
                <button key={x.id} role="tab" aria-selected={x.id === pick} onClick={() => setPick(x.id)} className={`chip text-[11px] ${x.id === pick ? "!bg-rose-500 !text-white" : ""}`}>
                  {x.name}
                </button>
              ))}
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-lg font-bold">{picked.name}</span>
          <span className="text-xs text-slate-400">{picked.date}</span>
          <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-extrabold text-rose-200">{fmt(picked.loss)}</span>
          <span className="chip text-[10px]">{t(`inc.cat.${picked.cat}`)}</span>
        </div>
        <IncidentPlayer key={picked.id} incident={picked} fmt={fmt} />
      </section>

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
              <div className="flex items-center gap-3">
                <button onClick={() => watch(x.id)} className="flex items-center gap-1 text-xs font-semibold text-rose-300 hover:text-rose-200">
                  <PlayCircle className="h-3.5 w-3.5" /> {t("inc.view")}
                </button>
                <Link to={x.demo} className="flex items-center gap-1 text-xs text-slate-200 hover:text-white">
                  {t("inc.try")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.article>
        ))}
      </section>
      <p className="text-[11px] text-slate-500">{t("inc.source")}</p>
    </div>
  );
}
