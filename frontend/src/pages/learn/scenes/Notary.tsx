// Notary scheme (công chứng / multisig / MPC): một ủy ban k-of-n quan sát chuỗi A rồi ký xác nhận cho chuỗi B.
// normal: khóa → quan sát → ký → chuyển → kiểm & mint. attack: chiếm 3/5 khóa → giả lệnh rút → ký → rút cạn kho → phát hiện muộn.
import { useT } from "../../../i18n/useT";
import { Arrows, Beam, ChainBox, Coin, Coins, Envelope, Fly, K, Node, Person, Stage, Tag, Token, Verdict, type NodeState } from "../svg";
import type { SceneProps } from "../protocols";

const NODES = [
  { x: 236, y: 112 },
  { x: 266, y: 82 },
  { x: 300, y: 70 },
  { x: 334, y: 82 },
  { x: 364, y: 112 },
];

export default function NotaryScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;

  // trạng thái tích lũy
  const vault = atk ? (s >= 3 ? 0 : 7) : s === 0 ? 6 : 7;
  const minted = !atk && s >= 4;
  const stolen = atk ? (s >= 0 ? 3 : 0) : 0;
  const nodeState = (i: number): NodeState => {
    if (atk) return i < stolen ? "bad" : s >= 4 ? "off" : "idle";
    if (s >= 2) return "ok";
    if (s >= 1) return "watch";
    return "idle";
  };
  const signed = atk ? (s >= 2 ? 3 : 0) : s >= 2 ? 5 : 0;

  return (
    <Stage label={t("proto.notary.name")}>
      <Arrows prefix="nt" />
      <ChainBox x={16} y={36} w={150} h={186} color={K.a} title={t("proto.s.chainA")} sub={t("proto.s.vault")} alert={atk && s >= 3} />
      <Coins x={91} y={200} n={vault} max={8} />
      <ChainBox x={434} y={36} w={150} h={186} color={K.b} title={t("proto.s.chainB")} sub={t("proto.s.mintContract")} />

      {/* ủy ban */}
      <text x={300} y={44} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-slate-200">
        {t("proto.notary.committee")}
      </text>
      <path d="M 222 124 Q 300 30 378 124" fill="none" stroke={K.v} strokeOpacity={0.35} strokeWidth={10} strokeLinecap="round" />
      {NODES.map((p, i) => (
        <Node key={i} x={p.x} y={p.y} r={10} state={nodeState(i)} check={i < signed} delay={(atk ? 0 : 0.18) * i} />
      ))}
      <text x={300} y={146} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" fontWeight={700} fill={atk && signed ? K.red : signed ? K.green : "rgb(var(--c-slate-400))"}>
        σ {signed}/5 · k = 3
      </text>

      <Person x={91} y={262} label={t("proto.s.user")} />
      {atk && <Person x={300} y={250} label={t("proto.s.attacker")} bad />}

      {/* ---------- luồng chuẩn ---------- */}
      {!atk && s === 0 && (
        <>
          <Fly key="n0" from={{ x: 91, y: 244 }} to={{ x: 91, y: 146 }} dur={1.2}>
            <Coin />
          </Fly>
          <Tag x={91} y={92} text="Locked(user, 10)" color={K.a} delay={1} size={8.5} />
        </>
      )}
      {!atk && s === 1 && NODES.map((p, i) => <Beam key={`b${i}`} a={{ x: 166, y: 120 }} b={p} color={K.a} dash delay={0.12 * i} />)}
      {!atk && s === 2 && <Tag x={300} y={170} text={t("proto.notary.signEach")} color={K.green} delay={0.9} />}
      {!atk && s === 3 && (
        <Fly key="n3" from={{ x: 300, y: 160 }} to={{ x: 470, y: 120 }} dur={1.3}>
          <Envelope label="σ ≥ 3/5" color={K.v} />
        </Fly>
      )}
      {!atk && s >= 4 && <Verdict x={560} y={58} ok />}
      {minted &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <Fly key={`t${i}`} from={{ x: 509, y: 60 }} to={{ x: 478 + (i % 3) * 30, y: 120 + Math.floor(i / 3) * 30 }} dur={0.6} delay={0.1 * i}>
            <Token />
          </Fly>
        ))}
      {minted && <Tag x={509} y={200} text="+10 wToken → user" color={K.b} delay={0.6} size={8.5} />}

      {/* ---------- tấn công ---------- */}
      {atk && s === 0 && NODES.slice(0, 3).map((p, i) => <Beam key={`k${i}`} a={{ x: 300, y: 228 }} b={p} color={K.red} delay={0.25 * i} arrow="nt-red" width={2.4} />)}
      {atk && s >= 0 && <Tag x={300} y={170} text={t("proto.notary.keysStolen")} color={K.red} delay={0.8} />}
      {atk && s === 1 && (
        <>
          <Fly key="a1" from={{ x: 300, y: 236 }} to={{ x: 300, y: 196 }} dur={0.9}>
            <Envelope bad label="Unlock(ALL → attacker)" />
          </Fly>
          <Tag x={509} y={140} text={t("proto.notary.noBurn")} color={K.gray} delay={0.6} size={8.5} />
        </>
      )}
      {atk && s === 2 && <Tag x={300} y={196} text={t("proto.notary.validSig")} color={K.red} solid delay={0.6} />}
      {atk && s === 3 && (
        <>
          <Fly key="a3" from={{ x: 300, y: 160 }} to={{ x: 150, y: 110 }} dur={1}>
            <Envelope bad />
          </Fly>
          {[0, 1, 2, 3, 4].map((i) => (
            <Fly key={`d${i}`} from={{ x: 110, y: 150 }} via={[{ x: 210, y: 220 }]} to={{ x: 286, y: 246 }} dur={1.2} delay={0.9 + i * 0.2} keep={false}>
              <Coin />
            </Fly>
          ))}
        </>
      )}
      {atk && s >= 3 && <Verdict x={150} y={206} ok={false} />}
      {atk && s >= 4 && <Tag x={509} y={262} text={t("proto.notary.late")} color={K.red} solid />}
    </Stage>
  );
}
