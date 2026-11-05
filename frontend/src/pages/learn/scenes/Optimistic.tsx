// Optimistic bridge: updater (có ký quỹ) đăng gốc thông điệp lên B; trong cửa sổ thách thức, chỉ cần một watcher trung thực
// phát hiện gian lận. attack (kiểu Nomad 2022): nâng cấp khởi tạo gốc tin cậy = 0x00 → mọi thông điệp chưa chứng minh đều
// "hợp lệ" → kẻ tấn công và hàng trăm địa chỉ sao chép giao dịch rút cạn kho; watcher không có gốc gian lận nào để thách thức.
import { motion } from "framer-motion";
import { useT } from "../../../i18n/useT";
import { Beam, ChainBox, Coin, Coins, Envelope, Fly, K, Node, Person, Stage, Tag, Token, Verdict } from "../svg";
import type { SceneProps } from "../protocols";

const W = [
  { x: 236, y: 200 },
  { x: 300, y: 212 },
  { x: 364, y: 200 },
];

export default function OptimisticScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;
  const win = atk ? 0 : ([0.05, 0.6, 0.85, 1, 1][s] ?? 1);
  const vault = atk ? (s >= 2 ? 0 : s >= 1 ? 4 : 6) : 6;
  const row = atk ? (s >= 0 ? "bug" : "") : s >= 3 ? "ok" : s >= 0 ? "pending" : "";

  return (
    <Stage label={t("proto.optimistic.name")}>
      <ChainBox x={16} y={40} w={150} h={176} color={K.a} title={t("proto.s.chainA")} sub={t("proto.optimistic.home")} />
      {!atk && (
        <g transform="translate(91 110)">
          <Envelope color={K.a} label="msg #42" />
        </g>
      )}
      {atk && (
        <text x={91} y={120} textAnchor="middle" fontSize={9} className="fill-slate-400">
          {t("proto.optimistic.nothing")}
        </text>
      )}

      <ChainBox x={434} y={40} w={150} h={176} color={K.b} title={t("proto.s.chainB")} sub={t("proto.optimistic.replica")} alert={atk && s >= 1} />
      {row && (
        <motion.g key={`${mode}-${row}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: !atk && s === 0 ? 1.6 : 0 }}>
          <rect x={448} y={80} width={122} height={22} rx={5} fill={row === "bug" ? `${K.red}22` : row === "ok" ? `${K.green}22` : `${K.gold}22`} stroke={row === "bug" ? K.red : row === "ok" ? K.green : K.goldEdge} />
          <text x={509} y={95} textAnchor="middle" fontSize={8.5} fontWeight={700} fontFamily="JetBrains Mono" fill={row === "bug" ? K.red : row === "ok" ? K.green : K.goldEdge}>
            {row === "bug" ? "confirmAt[0x00] = 1" : row === "ok" ? "root R · confirmed" : "root R · pending"}
          </text>
        </motion.g>
      )}
      <Coins x={509} y={196} n={vault} max={6} rx={22} />

      {/* updater có ký quỹ */}
      <Person x={300} y={74} s={0.8} label={t("proto.optimistic.updater")} />
      <g transform="translate(326 70)">
        <Coin r={5} />
      </g>

      {/* cửa sổ thách thức */}
      <text x={300} y={134} textAnchor="middle" fontSize={8.5} className="fill-slate-400">
        {t("proto.optimistic.window")}
      </text>
      <rect x={200} y={140} width={200} height={10} rx={5} fill="rgb(var(--c-white) / 0.08)" stroke="rgb(var(--c-white) / 0.2)" />
      <motion.rect x={200} y={140} height={10} rx={5} fill={win >= 1 ? K.green : K.gold} initial={false} animate={{ width: 200 * win }} transition={{ duration: 1.6 }} />

      {/* watchers */}
      {W.map((p, i) => (
        <Node key={i} x={p.x} y={p.y} r={10} state={!atk && s === 2 ? "ok" : !atk && s >= 1 ? "watch" : "idle"} check={!atk && s >= 2} delay={0.2 * i} label={i === 1 ? "watcher" : undefined} />
      ))}

      {/* ---------- luồng chuẩn ---------- */}
      {!atk && s === 0 && (
        <Fly key="o0" from={{ x: 91, y: 110 }} via={[{ x: 300, y: 104 }]} to={{ x: 470, y: 91 }} dur={1.6} keep={false}>
          <Envelope color={K.a} label="R" />
        </Fly>
      )}
      {!atk && s === 1 && <Tag x={300} y={176} text={t("proto.optimistic.pending")} color={K.gold} size={8.5} />}
      {!atk &&
        s === 2 &&
        W.map((p, i) => (
          <g key={i}>
            <Beam a={p} b={{ x: 166, y: 150 }} color={K.a} dash delay={0.15 * i} />
            <Beam a={p} b={{ x: 434, y: 150 }} color={K.b} dash delay={0.15 * i + 0.3} />
          </g>
        ))}
      {!atk && s === 2 && <Tag x={300} y={250} text={t("proto.optimistic.match")} color={K.green} solid delay={0.8} size={8.5} />}
      {!atk && s >= 3 && <Verdict x={572} y={46} ok />}
      {!atk && s >= 4 && (
        <>
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ originX: "509px", originY: "124px" }}>
            <g transform="translate(509 124)">
              <Token />
            </g>
          </motion.g>
          <Tag x={300} y={250} text={t("proto.optimistic.assume")} color={K.green} solid size={8.5} />
        </>
      )}

      {/* ---------- tấn công kiểu Nomad ---------- */}
      {atk && <Person x={300} y={262} label={t("proto.s.attacker")} bad s={0.85} />}
      {atk && s === 0 && <Tag x={300} y={120} text={t("proto.optimistic.upgrade")} color={K.red} solid size={8.5} />}
      {atk && s === 1 && (
        <>
          <Fly key="p1" from={{ x: 310, y: 244 }} to={{ x: 470, y: 130 }} dur={1}>
            <Envelope bad label="process(msg*)" />
          </Fly>
          {[0, 1].map((i) => (
            <Fly key={`c${i}`} from={{ x: 509, y: 160 }} to={{ x: 318, y: 256 }} dur={1} delay={1.1 + i * 0.25} keep={false}>
              <Coin />
            </Fly>
          ))}
        </>
      )}
      {atk && s >= 1 && <Verdict x={572} y={46} ok={false} />}
      {atk &&
        s >= 2 &&
        [-120, -80, 80, 120].map((dx, i) => (
          <motion.g key={dx} initial={{ opacity: 0, x: 0 }} animate={{ opacity: 0.6, x: dx }} transition={{ delay: 0.1 * i }}>
            <Person x={300} y={268} s={0.6} bad />
          </motion.g>
        ))}
      {atk &&
        s === 2 &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <Fly key={`cp${i}`} from={{ x: 509, y: 170 }} to={{ x: 180 + (i % 4) * 80, y: 262 }} dur={1} delay={i * 0.2} keep={false}>
            <Coin />
          </Fly>
        ))}
      {atk && s === 2 && <Tag x={300} y={120} text={t("proto.optimistic.copy")} color={K.red} solid size={8.5} />}
      {atk &&
        s >= 3 &&
        W.map((p, i) => (
          <text key={i} x={p.x} y={p.y - 14} textAnchor="middle" fontSize={12} fontWeight={800} fill={K.gold}>
            ?
          </text>
        ))}
      {atk && s === 3 && <Tag x={300} y={120} text={t("proto.optimistic.noFraud")} color={K.gold} solid size={8.5} />}
      {atk && s >= 4 && <Tag x={300} y={120} text={t("proto.optimistic.lesson")} color={K.red} solid size={8.5} />}
    </Stage>
  );
}
