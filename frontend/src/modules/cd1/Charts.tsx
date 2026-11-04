import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import type { Timeline } from "./types";
import { CHART } from "../../lib/theme";
import { useT } from "../../i18n/useT";

/** Thời gian từng giai đoạn (ms, đo thật trên backend demo) + kích thước dữ liệu (byte). */
export default function Charts({ timeline, sizes }: { timeline: Timeline["phases"]; sizes: { name: string; bytes: number }[] }) {
  const { t } = useT();
  const phases = timeline.filter((p) => !p.phase.startsWith("tamper") && p.phase !== "abe").slice(-6);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <div className="label mb-2">{t("cd1.charts.time")}</div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={phases} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="phase" stroke={CHART.axis} />
              <YAxis stroke={CHART.axis} width={40} />
              <Tooltip />
              <Bar dataKey="ms" radius={[6, 6, 0, 0]} animationDuration={900}>
                {phases.map((_, i) => (
                  <Cell key={i} fill={["#22d3ee", "#14b8a6", "#67e8f9", "#2dd4bf", "#0891b2", "#5eead4"][i % 6]} />
                ))}
                <LabelList dataKey="ms" position="top" fill="#cbd5e1" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="label mb-2">{t("cd1.charts.size")}</div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={sizes} layout="vertical" margin={{ top: 8, right: 40, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" stroke={CHART.axis} />
              <YAxis type="category" dataKey="name" stroke={CHART.axis} width={110} />
              <Tooltip />
              <Bar dataKey="bytes" radius={[0, 6, 6, 0]} animationDuration={900}>
                {sizes.map((_, i) => (
                  <Cell key={i} fill={["#22d3ee", "#a78bfa", "#fbbf24"][i % 3]} />
                ))}
                <LabelList dataKey="bytes" position="right" fill="#cbd5e1" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
