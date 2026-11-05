// Relay chain / hub (blockchain of blockchains — Polkadot, Cosmos): các chuỗi con dùng chung bảo mật của chuỗi chuyển tiếp,
// thông điệp (XCM/IBC) đi qua hub. attack: chuỗi ngoài hệ sinh thái vẫn cần cầu nối; lỗi cấu hình ở một chuỗi con (Acala 2022)
// mint tài sản không bảo chứng và có thể lan qua hub → quản trị phải dừng chuỗi.
import { motion } from "framer-motion";
import { useT } from "../../../i18n/useT";
import { Envelope, Fly, K, Stage, Tag, Token } from "../svg";
import type { SceneProps } from "../protocols";

const HUB = { x: 300, y: 150 };
const PARAS = [
  { x: 95, y: 64, c: K.a },
  { x: 505, y: 64, c: K.teal },
  { x: 505, y: 236, c: K.b },
  { x: 95, y: 236, c: K.pink },
];

export default function HubScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;
  const ringOn = !atk ? s >= 1 : true;
  const bug = atk && s >= 1;
  const paused = atk && s >= 3;
  const names = [0, 1, 2, 3].map((i) => (atk && i === 3 ? t("proto.hub.buggy") : `${t("proto.hub.para")} ${i + 1}`));

  return (
    <Stage label={t("proto.hub.name")}>
      {/* chuỗi bên ngoài hệ sinh thái */}
      {atk &&
        [
          { x: 236, n: "Ethereum" },
          { x: 364, n: "Bitcoin" },
        ].map((e, i) => (
          <motion.g key={e.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 * i }}>
            <line x1={e.x} y1={32} x2={i ? 330 : 270} y2={102} stroke={K.red} strokeDasharray="5 5" strokeWidth={1.6} />
            <rect x={e.x - 44} y={10} width={88} height={22} rx={11} className="fill-surface-1" stroke={K.gray} strokeDasharray="4 3" strokeWidth={1.5} />
            <text x={e.x} y={25} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-slate-300">
              {e.n}
            </text>
            <text x={i ? 352 : 248} y={70} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={K.red}>
              bridge?
            </text>
          </motion.g>
        ))}

      {/* đường nối chuỗi con ↔ hub */}
      {PARAS.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={HUB.x} y2={HUB.y} stroke={p.c} strokeOpacity={0.45} strokeWidth={3} />
      ))}

      {/* hub */}
      <motion.circle cx={HUB.x} cy={HUB.y} r={58} className="fill-surface-1" initial={false} animate={{ stroke: ringOn ? K.v : K.gray, strokeWidth: ringOn ? 3 : 2 }} />
      <motion.circle cx={HUB.x} cy={HUB.y} r={58} fill={K.v} initial={false} animate={{ opacity: !atk && s === 1 ? [0.05, 0.25, 0.05] : 0.06 }} transition={{ duration: 1.4, repeat: !atk && s === 1 ? Infinity : 0 }} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        return (
          <motion.circle key={i} cx={HUB.x + 46 * Math.cos(a)} cy={HUB.y + 46 * Math.sin(a)} r={4.5} initial={false} animate={{ fill: ringOn ? K.green : K.gray }} transition={{ delay: !atk && s === 1 ? i * 0.08 : 0 }} />
        );
      })}
      <text x={HUB.x} y={HUB.y - 4} textAnchor="middle" fontSize={11} fontWeight={800} className="fill-slate-100">
        {t("proto.hub.relay")}
      </text>
      <text x={HUB.x} y={HUB.y + 10} textAnchor="middle" fontSize={7.5} className="fill-slate-400">
        {t("proto.hub.shared")}
      </text>

      {/* chuỗi con */}
      {PARAS.map((p, i) => {
        const red = bug && i === 3;
        return (
          <g key={i}>
            <motion.rect x={p.x - 70} y={p.y - 24} width={140} height={48} rx={12} className="fill-surface-1" initial={false} animate={{ stroke: red ? K.red : p.c }} strokeWidth={red ? 3 : 2} />
            <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize={10.5} fontWeight={700} className="fill-slate-100">
              {names[i]}
            </text>
            {[0, 1, 2, 3].map((b) => (
              <rect key={b} x={p.x - 40 + b * 21} y={p.y + 3} width={16} height={11} rx={2} fill={`${p.c}33`} stroke={p.c} strokeWidth={1} />
            ))}
          </g>
        );
      })}

      {/* ---------- luồng chuẩn ---------- */}
      {!atk &&
        s === 0 &&
        PARAS.map((p, i) => (
          <Fly key={`c${i}`} from={p} to={HUB} dur={1.1} delay={0.15 * i} keep={false}>
            <rect x={-8} y={-6} width={16} height={12} rx={2} fill={p.c} />
          </Fly>
        ))}
      {!atk && s === 0 && <Tag x={300} y={240} text={t("proto.hub.collate")} color={K.v} delay={0.8} size={8.5} />}
      {!atk && s === 1 && <Tag x={300} y={240} text={t("proto.hub.validated")} color={K.green} solid delay={0.6} size={8.5} />}
      {!atk && s === 2 && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ originX: "175px", originY: "100px" }}>
          <g transform="translate(175 100)">
            <Envelope label="XCM: 10 → Para 3" color={K.a} />
          </g>
        </motion.g>
      )}
      {!atk && s === 3 && (
        <Fly key="x3" from={{ x: 175, y: 100 }} via={[HUB]} to={{ x: 430, y: 200 }} dur={1.8}>
          <Envelope color={K.a} />
        </Fly>
      )}
      {!atk && s >= 4 && (
        <>
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ originX: "580px", originY: "236px" }}>
            <g transform="translate(560 236)">
              <Token />
            </g>
          </motion.g>
          <Tag x={300} y={240} text={t("proto.hub.trustHub")} color={K.green} solid size={8.5} />
        </>
      )}

      {/* ---------- sự cố ---------- */}
      {atk && s === 0 && <Tag x={450} y={150} text={t("proto.hub.outside")} color={K.red} size={8.5} />}
      {bug &&
        [0, 1, 2].map((i) => (
          <motion.g key={`b${i}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 * i }}>
            <g transform={`translate(${64 + i * 18} 198)`}>
              <Token bad s={12} />
            </g>
          </motion.g>
        ))}
      {atk && s === 1 && <Tag x={95} y={180} text="+3,0B aUSD" color={K.red} solid size={8.5} />}
      {atk &&
        s === 2 &&
        [PARAS[0], PARAS[1], PARAS[2]].map((p, i) => (
          <Fly key={`sp${i}`} from={PARAS[3]} via={[HUB]} to={p} dur={1.6} delay={0.35 * i} keep={false}>
            <Envelope bad />
          </Fly>
        ))}
      {atk && s === 2 && <Tag x={300} y={240} text={t("proto.hub.spread")} color={K.red} delay={0.5} size={8.5} />}
      {paused && (
        <g>
          <rect x={172} y={222} width={8} height={28} rx={2} fill={K.red} />
          <rect x={184} y={222} width={8} height={28} rx={2} fill={K.red} />
          <Tag x={300} y={240} text={t("proto.hub.govHalt")} color={K.red} solid size={8.5} />
        </g>
      )}
      {atk && s >= 4 && <Tag x={450} y={150} text={t("proto.hub.lesson")} color={K.red} solid size={8.5} />}
    </Stage>
  );
}
