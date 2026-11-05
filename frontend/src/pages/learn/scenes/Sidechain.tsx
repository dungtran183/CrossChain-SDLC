// Sidechain + two-way peg: khóa trên chuỗi chính → liên minh/validator sidechain phát hành token neo giá → dùng nhanh trên sidechain
// → đốt để rút về (peg-out) kèm checkpoint. attack: sidechain ít validator, đa số bị chiếm → peg-out giả → kho trên chuỗi chính bị rút.
import { motion } from "framer-motion";
import { useT } from "../../../i18n/useT";
import { Arrows, Beam, Blocks, Coin, Coins, Envelope, Fly, K, Node, Person, Stage, Tag, Token, Verdict, type NodeState } from "../svg";
import type { SceneProps } from "../protocols";

const FED = [250, 280, 310, 340, 370].map((x) => ({ x, y: 156 }));
const PEG = { x: 545, y: 84 };

function Lane({ y, color, title, sub }: { y: number; color: string; title: string; sub: string }) {
  return (
    <g>
      <rect x={16} y={y} width={568} height={80} rx={14} className="fill-surface-1" stroke={color} strokeWidth={2} />
      <text x={30} y={y + 19} fontSize={12} fontWeight={700} className="fill-slate-100">
        {title}
      </text>
      <text x={30} y={y + 32} fontSize={8.5} fontFamily="JetBrains Mono" className="fill-slate-400">
        {sub}
      </text>
    </g>
  );
}

export default function SidechainScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;
  const pegCoins = atk ? (s >= 3 ? 0 : 5) : s === 0 ? 4 : s >= 4 ? 4 : 5;
  const sideToken = !atk && s >= 2 && s < 4;
  const nodeState = (i: number): NodeState => {
    if (atk) return s >= 1 && i < 3 ? "bad" : "idle";
    if (s === 1) return "watch";
    if (s === 2 || s === 4) return "ok";
    return "idle";
  };
  const signed = (i: number) => (atk ? s >= 2 && i < 3 : (s === 2 || s === 4) && i < 4);

  return (
    <Stage label={t("proto.sidechain.name")}>
      <Arrows prefix="sc" />
      <Lane y={14} color={K.a} title={t("proto.sidechain.main")} sub={t("proto.sidechain.mainSub")} />
      <Blocks x={30} y={60} n={8} color={K.a} w={36} h={20} gap={10} start={810} />
      <rect x={420} y={24} width={152} height={62} rx={10} fill={`${K.a}10`} stroke={K.a} strokeDasharray={atk && s >= 3 ? undefined : "4 3"} strokeWidth={1.4} />
      <text x={432} y={42} fontSize={9.5} fontWeight={800} fill={K.a}>
        {t("proto.sidechain.peg")}
      </text>
      <Coins x={PEG.x} y={PEG.y - 6} n={pegCoins} max={5} rx={13} />

      <Lane y={206} color={K.b} title={t("proto.sidechain.side")} sub={t("proto.sidechain.sideSub")} />
      <Blocks x={30} y={252} n={13} color={K.b} w={20} h={14} gap={6} />
      <rect x={420} y={216} width={152} height={62} rx={10} fill={`${K.b}10`} stroke={K.b} strokeDasharray="4 3" strokeWidth={1.4} />
      <text x={432} y={234} fontSize={9.5} fontWeight={800} fill={K.b}>
        {t("proto.sidechain.pegged")}
      </text>
      {sideToken && !(s === 2) && (
        <g transform="translate(500 256)">
          <Token />
        </g>
      )}

      {/* liên minh / validator sidechain */}
      <text x={310} y={188} textAnchor="middle" fontSize={10} fontWeight={700} className="fill-slate-200">
        {t("proto.sidechain.fed")}
      </text>
      {FED.map((p, i) => (
        <Node key={i} x={p.x} y={p.y} r={10} state={nodeState(i)} check={signed(i)} delay={0.15 * i} />
      ))}
      <Person x={70} y={160} label={t("proto.s.user")} s={0.9} />
      {atk && <Person x={170} y={160} label={t("proto.s.attacker")} bad s={0.9} />}

      {/* ---------- luồng chuẩn ---------- */}
      {!atk && s === 0 && (
        <>
          <Fly key="p0" from={{ x: 80, y: 140 }} via={[{ x: 300, y: 104 }]} to={{ x: PEG.x, y: PEG.y - 6 - 36 }} dur={1.4}>
            <Coin />
          </Fly>
          <Tag x={300} y={112} text={t("proto.sidechain.pegIn")} color={K.a} delay={0.8} size={8.5} />
        </>
      )}
      {!atk && s === 1 && (
        <>
          {FED.map((p, i) => (
            <Beam key={i} a={p} b={{ x: 200 + i * 40, y: 82 }} color={K.a} dash delay={0.1 * i} />
          ))}
          <Tag x={210} y={112} text={t("proto.sidechain.confirm")} color={K.a} delay={0.5} size={8.5} />
        </>
      )}
      {!atk && s === 2 && (
        <Fly key="m2" from={{ x: 310, y: 170 }} to={{ x: 500, y: 256 }} dur={1.2} delay={0.9}>
          <Token />
        </Fly>
      )}
      {!atk && s === 3 && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.circle
              key={i}
              r={4}
              fill={K.b}
              initial={{ cx: 30, cy: 240, opacity: 0 }}
              animate={{ cx: [30, 400], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.1, delay: i * 0.22, repeat: Infinity, repeatDelay: 0.3 }}
            />
          ))}
          <Tag x={300} y={196} text={t("proto.sidechain.fast")} color={K.b} solid size={8.5} />
        </>
      )}
      {!atk && s === 4 && (
        <>
          <Fly key="burn" from={{ x: 500, y: 256 }} to={{ x: 400, y: 240 }} dur={0.8} keep={false}>
            <Token />
          </Fly>
          <Fly key="cp" from={{ x: 310, y: 222 }} to={{ x: 310, y: 92 }} dur={1.3} delay={0.6} keep={false}>
            <Envelope label="checkpoint" color={K.b} />
          </Fly>
          <Fly key="out" from={{ x: PEG.x, y: PEG.y - 42 }} via={[{ x: 300, y: 104 }]} to={{ x: 80, y: 140 }} dur={1.4} delay={1.6}>
            <Coin />
          </Fly>
          <Tag x={210} y={112} text={t("proto.sidechain.pegOut")} color={K.b} delay={0.4} size={8.5} />
        </>
      )}

      {/* ---------- tấn công ---------- */}
      {atk && s === 0 && (
        <>
          <Tag x={300} y={46} text={t("proto.sidechain.strong")} color={K.a} solid size={8.5} />
          <Tag x={300} y={238} text={t("proto.sidechain.weak")} color={K.red} solid size={8.5} />
        </>
      )}
      {atk && s === 1 && FED.slice(0, 3).map((p, i) => <Beam key={i} a={{ x: 186, y: 150 }} b={p} color={K.red} delay={0.25 * i} arrow="sc-red" />)}
      {atk && s >= 1 && <Tag x={392} y={160} anchor="start" text={t("proto.sidechain.majority")} color={K.red} delay={0.6} size={8.5} />}
      {atk && s === 2 && (
        <Fly key="fake" from={{ x: 280, y: 150 }} to={{ x: 300, y: 110 }} dur={0.9} delay={0.6}>
          <Envelope bad label={t("proto.sidechain.fakeOut")} />
        </Fly>
      )}
      {atk && s === 3 && (
        <>
          <Fly key="fk3" from={{ x: 300, y: 110 }} to={{ x: 470, y: 60 }} dur={0.9} keep={false}>
            <Envelope bad />
          </Fly>
          {[0, 1, 2, 3, 4].map((i) => (
            <Fly key={`d${i}`} from={{ x: PEG.x, y: 60 }} via={[{ x: 330, y: 104 }]} to={{ x: 172, y: 150 }} dur={1.2} delay={0.8 + i * 0.2} keep={false}>
              <Coin />
            </Fly>
          ))}
        </>
      )}
      {atk && s >= 3 && <Verdict x={420} y={24} ok={false} r={10} />}
      {atk && s >= 4 && <Tag x={250} y={46} text={t("proto.sidechain.lesson")} color={K.red} solid size={8.5} />}
    </Stage>
  );
}
