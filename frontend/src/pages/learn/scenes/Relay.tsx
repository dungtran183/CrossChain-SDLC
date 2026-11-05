// Chain relay / light client: relayer (không cần tin cậy) chuyển tiêu đề khối A sang hợp đồng light client trên B;
// người dùng nộp bằng chứng Merkle để B tự kiểm giao dịch có trong khối A. attack (kiểu BNB Bridge 2022): bằng chứng giả
// lọt qua bộ xác minh có lỗi → mint không bảo chứng → validator phải dừng chuỗi.
import { motion } from "framer-motion";
import { useT } from "../../../i18n/useT";
import { ChainBox, Envelope, Fly, K, Stage, Tag, Token, Verdict } from "../svg";
import type { SceneProps } from "../protocols";

const HDR = [100, 101, 102, 103];

/** Cây Merkle 4 lá, đường bằng chứng được tô sáng. */
function Merkle({ bad, show, verified }: { bad?: boolean; show: boolean; verified?: boolean }) {
  const root = { x: 300, y: 92 };
  const mid = [
    { x: 262, y: 128 },
    { x: 338, y: 128 },
  ];
  const leaf = [
    { x: 243, y: 164 },
    { x: 281, y: 164 },
    { x: 319, y: 164 },
    { x: 357, y: 164 },
  ];
  const hiLeaf = 2;
  const c = bad ? K.red : K.gold;
  if (!show) return null;
  return (
    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: "300px", originY: "128px" }}>
      {mid.map((m, i) => (
        <line key={`r${i}`} x1={root.x} y1={root.y} x2={m.x} y2={m.y} stroke={i === 1 ? c : "rgb(var(--c-slate-500))"} strokeWidth={i === 1 ? 2.5 : 1.2} />
      ))}
      {leaf.map((l, i) => (
        <line key={`m${i}`} x1={mid[Math.floor(i / 2)].x} y1={mid[Math.floor(i / 2)].y} x2={l.x} y2={l.y} stroke={i === hiLeaf ? c : "rgb(var(--c-slate-500))"} strokeWidth={i === hiLeaf ? 2.5 : 1.2} />
      ))}
      <rect x={root.x - 22} y={root.y - 10} width={44} height={18} rx={4} fill={verified ? K.green : c} stroke={K.ink} strokeWidth={1.2} />
      <text x={root.x} y={root.y + 3} textAnchor="middle" fontSize={8.5} fontWeight={800} fill={K.ink}>
        root
      </text>
      {mid.map((m, i) => (
        <rect
          key={`mm${i}`}
          x={m.x - 13}
          y={m.y - 7}
          width={26}
          height={14}
          rx={3}
          className="fill-surface-1"
          stroke={i === 0 ? c : "rgb(var(--c-slate-500))"}
          strokeWidth={i === 0 ? 2 : 1.2}
          strokeDasharray={i === 0 ? "3 2" : undefined}
        />
      ))}
      {leaf.map((l, i) => (
        <rect
          key={`l${i}`}
          x={l.x - 11}
          y={l.y - 7}
          width={22}
          height={14}
          rx={3}
          fill={i === hiLeaf ? c : "rgb(var(--c-surface-1))"}
          stroke={i === 3 ? c : "rgb(var(--c-slate-500))"}
          strokeWidth={i === 3 || i === hiLeaf ? 2 : 1.2}
          strokeDasharray={i === 3 ? "3 2" : undefined}
        />
      ))}
      <text x={leaf[hiLeaf].x} y={leaf[hiLeaf].y + 3} textAnchor="middle" fontSize={7.5} fontWeight={800} fill={K.ink}>
        tx
      </text>
      <text x={300} y={186} textAnchor="middle" fontSize={8.5} className="fill-slate-400">
        π = (h₃, h₀₁) · leaf → root
      </text>
    </motion.g>
  );
}

export default function RelayScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;
  const stored = 4;
  const verifiedHdr = atk || s >= 1;
  const showTree = atk ? s >= 0 : s >= 2;
  const minted = atk ? s >= 2 : s >= 4;
  const halted = atk && s >= 3;

  return (
    <Stage label={t("proto.relay.name")}>
      <ChainBox x={16} y={30} w={170} h={200} color={K.a} title={t("proto.s.chainA")} sub={t("proto.relay.headers")} />
      {HDR.map((h, i) => (
        <g key={h}>
          <rect x={34} y={66 + i * 38} width={134} height={28} rx={6} fill={i === 2 && !atk ? `${K.gold}33` : `${K.a}14`} stroke={i === 2 && !atk ? K.goldEdge : K.a} strokeWidth={1.4} />
          <text x={44} y={79 + i * 38} fontSize={9} fontWeight={700} fontFamily="JetBrains Mono" className="fill-slate-200">
            #{h}
          </text>
          <text x={44} y={89 + i * 38} fontSize={7.5} fontFamily="JetBrains Mono" className="fill-slate-400">
            root r{h} · σ(validators)
          </text>
          {i < 3 && <line x1={101} y1={94 + i * 38} x2={101} y2={104 + i * 38} stroke={K.a} />}
        </g>
      ))}

      <ChainBox x={414} y={30} w={170} h={200} color={K.b} title={t("proto.s.chainB")} sub={t("proto.relay.lc")} alert={halted} />
      {HDR.map((h, i) => (
        <motion.g key={`${h}-${mode}`} initial={{ opacity: !atk && s === 0 ? 0.15 : 1 }} animate={{ opacity: i < stored ? 1 : 0.15 }} transition={{ delay: 0.25 * i + (s === 0 ? 1 : 0) }}>
          <rect x={430} y={64 + i * 21} width={138} height={17} rx={4} fill={`${K.b}14`} stroke={K.b} strokeWidth={1.1} />
          <text x={438} y={76 + i * 21} fontSize={8} fontFamily="JetBrains Mono" className="fill-slate-300">
            hdr #{h} · r{h}
          </text>
          {verifiedHdr && i < stored && <circle cx={556} cy={72.5 + i * 21} r={4} fill={K.green} />}
        </motion.g>
      ))}
      <rect x={430} y={154} width={138} height={66} rx={8} fill={`${K.b}10`} stroke={K.b} strokeDasharray="4 3" />
      <text x={440} y={170} fontSize={9} fontWeight={800} fill={K.b}>
        {t("proto.relay.app")}
      </text>
      {minted &&
        [0, 1, 2, 3].map((i) => (
          <motion.g key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
            <g transform={`translate(${452 + i * 26} 198)`}>
              <Token bad={atk} />
            </g>
          </motion.g>
        ))}

      {/* relayer (không tin cậy) */}
      <g>
        <rect x={270} y={236} width={60} height={34} rx={6} className="fill-surface-1" stroke="rgb(var(--c-slate-400))" strokeWidth={1.5} />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={282 + i * 8} cy={253} r={2.2} fill={i === 0 ? K.green : "rgb(var(--c-slate-500))"} />
        ))}
        <text x={300} y={284} textAnchor="middle" fontSize={9} className="fill-slate-400">
          {t("proto.relay.relayer")}
        </text>
      </g>

      <Merkle show={showTree} bad={atk} verified={!atk && s >= 3} />

      {/* ---------- luồng chuẩn ---------- */}
      {!atk &&
        s === 0 &&
        HDR.map((h, i) => (
          <Fly key={`h${h}`} from={{ x: 168, y: 80 + i * 38 }} via={[{ x: 300, y: 236 }]} to={{ x: 470, y: 72 + i * 21 }} dur={1.3} delay={0.25 * i} keep={false}>
            <rect x={-14} y={-6} width={28} height={12} rx={3} fill={K.a} />
          </Fly>
        ))}
      {!atk && s === 1 && <Tag x={300} y={60} text={t("proto.relay.checkSig")} color={K.green} solid size={8.5} />}
      {!atk && s === 2 && <Tag x={300} y={210} text={t("proto.relay.buildProof")} color={K.gold} delay={0.4} size={8.5} />}
      {!atk && s === 3 && (
        <>
          <Fly key="pf" from={{ x: 300, y: 92 }} to={{ x: 470, y: 108 }} dur={1.1} keep={false}>
            <Envelope label="π" color={K.gold} />
          </Fly>
          <Tag x={300} y={60} text="root(π) = r102 ✓" color={K.green} solid delay={1} />
        </>
      )}
      {!atk && s >= 4 && <Tag x={300} y={210} text={t("proto.relay.trustless")} color={K.green} solid size={8.5} />}

      {/* ---------- tấn công: bằng chứng giả ---------- */}
      {atk && s === 0 && <Tag x={300} y={210} text={t("proto.relay.fakeLeaf")} color={K.red} size={8.5} />}
      {atk && s === 1 && (
        <>
          <Fly key="fp" from={{ x: 300, y: 92 }} to={{ x: 470, y: 108 }} dur={1.1} keep={false}>
            <Envelope bad label="π*" />
          </Fly>
          <Tag x={300} y={60} text={t("proto.relay.bug")} color={K.red} solid delay={0.9} />
        </>
      )}
      {atk && s === 2 && <Tag x={300} y={60} text="+2,000,000 BNB" color={K.red} solid />}
      {atk && s >= 3 && (
        <>
          <Verdict x={572} y={34} ok={false} r={11} />
          <Tag x={300} y={60} text={t("proto.relay.halt")} color={K.red} solid />
          {s === 3 &&
            [0, 1, 2].map((i) => (
              <Fly key={`x${i}`} from={{ x: 500, y: 198 }} to={{ x: 600, y: 270 - i * 30 }} dur={1} delay={i * 0.3} keep={false}>
                <Token bad />
              </Fly>
            ))}
        </>
      )}
      {atk && s >= 4 && <Tag x={300} y={210} text={t("proto.relay.lesson")} color={K.red} solid size={8.5} />}
    </Stage>
  );
}
