// HTLC (Hashed Timelock Contract) — hoán đổi nguyên tử giữa Alice (chuỗi A) và Bob (chuỗi B).
// normal: chọn s, chia sẻ H → Alice khóa (T1=48h) → Bob khóa (T2=24h) → Alice lộ s để nhận ở B → Bob dùng s nhận ở A.
// attack (lỗi sống còn): Alice nhận ở B sát hạn → Bob mất kết nối / giao dịch bị chặn → T1 hết hạn, Alice hoàn tiền → Bob mất cả hai.
import { useT } from "../../../i18n/useT";
import { Beam, ChainBox, Coin, Envelope, Fly, K, KeyIcon, Lock, Person, Stage, Tag, Timer, Token, Verdict } from "../svg";
import type { SceneProps } from "../protocols";

const A_SLOT = { x: 100, y: 128 };
const B_SLOT = { x: 458, y: 128 };
const ALICE = { x: 110, y: 252 };
const BOB = { x: 490, y: 252 };

export default function HtlcScene({ step, mode }: SceneProps) {
  const { t } = useT();
  const atk = mode === "attack";
  const s = step;

  // thời gian minh họa (giờ) theo bước
  const hour = atk ? ([0, 23, 47, 49, 49][s] ?? 49) : ([0, 0, 1, 2, 3, 3][s] ?? 3);
  const lockedA = atk ? s < 3 : s >= 1 && s < 4;
  const lockedB = atk ? s < 1 : s >= 2 && s < 3;
  const openA = atk ? s >= 3 : s >= 4;
  const openB = atk ? s >= 1 : s >= 3;
  const aliceCoin = atk ? s >= 3 : s < 1;
  const aliceToken = atk ? s >= 1 : s >= 3;
  const bobCoin = !atk && s >= 4;
  const bobToken = !atk && s < 2;
  const sPublic = atk ? s >= 1 : s >= 3;
  const activeA = atk || s >= 1;
  const activeB = atk || s >= 2;
  // phần tử đang bay trong bước hiện tại không vẽ tĩnh
  const moving = (k: string) =>
    (!atk && ((k === "coinA" && s === 1) || (k === "tokB" && s === 2) || (k === "tokAlice" && s === 3) || (k === "coinBob" && s === 4))) || (atk && ((k === "tokAlice" && s === 1) || (k === "coinAlice" && s === 3)));

  return (
    <Stage label={t("proto.htlc.name")}>
      <ChainBox x={16} y={30} w={210} h={150} color={K.a} title={t("proto.s.chainA")} />
      <ChainBox x={374} y={30} w={210} h={150} color={K.b} title={t("proto.s.chainB")} />

      {/* hợp đồng HTLC trên mỗi chuỗi */}
      {[
        {
          x: 32,
          act: activeA,
          color: K.a,
          name: "HTLC_A",
          par: "H · Bob · T1 = 48h",
          locked: lockedA,
          open: openA,
          frac: hour / 48,
          tl: atk && s >= 3 ? "0h" : `${Math.max(0, 48 - hour)}h`,
          exp: atk && s >= 3,
          slot: A_SLOT,
        },
        { x: 390, act: activeB, color: K.b, name: "HTLC_B", par: "H · Alice · T2 = 24h", locked: lockedB, open: openB, frac: Math.min(1, hour / 24), tl: `${Math.max(0, 24 - hour)}h`, exp: false, slot: B_SLOT },
      ].map((c) => (
        <g key={c.name} opacity={c.act ? 1 : 0.35}>
          <rect x={c.x} y={50} width={178} height={116} rx={10} fill={`${c.color}10`} stroke={c.color} strokeDasharray={c.act ? undefined : "4 4"} strokeWidth={1.5} />
          <text x={c.x + 10} y={68} fontSize={10} fontWeight={800} fill={c.color}>
            {c.name}
          </text>
          <text x={c.x + 10} y={82} fontSize={8.5} fontFamily="JetBrains Mono" className="fill-slate-400">
            {c.par}
          </text>
          <Lock x={c.x + 26} y={124} open={c.open} color={c.open ? K.green : c.color} label="H" />
          {c.act && <Timer x={c.x + 150} y={126} frac={c.frac} label={c.tl} color={c.color} expired={c.exp} />}
        </g>
      ))}
      {lockedA && !moving("coinA") && (
        <g transform={`translate(${A_SLOT.x} ${A_SLOT.y})`}>
          <Coin />
        </g>
      )}
      {lockedB && !moving("tokB") && (
        <g transform={`translate(${B_SLOT.x} ${B_SLOT.y})`}>
          <Token />
        </g>
      )}

      {/* đồng hồ chung */}
      <text x={300} y={60} textAnchor="middle" fontSize={9} className="fill-slate-400">
        {t("proto.htlc.clock")}
      </text>
      <text x={300} y={82} textAnchor="middle" fontSize={20} fontWeight={800} fontFamily="JetBrains Mono" fill={atk && s >= 2 ? K.red : "rgb(var(--c-slate-100))"}>
        t = {hour}h
      </text>
      {sPublic && <Tag x={479} y={160} text={t("proto.htlc.sPublic")} color={K.gold} delay={0.6} size={8.5} />}

      {/* Alice & Bob + tài sản đang giữ */}
      <line x1={140} y1={238} x2={460} y2={238} className="stroke-slate-500" strokeDasharray="3 6" />
      <text x={300} y={232} textAnchor="middle" fontSize={8.5} className="fill-slate-500">
        {t("proto.htlc.offchain")}
      </text>
      <Person x={ALICE.x} y={ALICE.y} label="Alice" />
      <Person x={BOB.x} y={BOB.y} label="Bob" off={atk && s >= 2} />
      <g transform="translate(146 270)">
        <KeyIcon />
      </g>
      {aliceCoin && !moving("coinAlice") && (
        <g transform="translate(74 262)">
          <Coin />
        </g>
      )}
      {aliceToken && !moving("tokAlice") && (
        <g transform="translate(52 262)">
          <Token />
        </g>
      )}
      {bobCoin && !moving("coinBob") && (
        <g transform="translate(528 262)">
          <Coin />
        </g>
      )}
      {bobToken && (
        <g transform="translate(528 262)">
          <Token />
        </g>
      )}

      {/* ---------- luồng chuẩn ---------- */}
      {!atk && s === 0 && (
        <>
          <Tag x={146} y={214} text="H = SHA-256(s)" color={K.gold} size={8.5} />
          <Fly key="h" from={{ x: 170, y: 252 }} to={{ x: 450, y: 252 }} dur={1.6}>
            <Tag x={0} y={0} text="H" color={K.gold} solid size={9} />
          </Fly>
        </>
      )}
      {!atk && s === 1 && (
        <Fly key="c1" from={{ x: 74, y: 262 }} to={A_SLOT} dur={1.2}>
          <Coin />
        </Fly>
      )}
      {!atk && s === 2 && (
        <>
          <Beam a={{ x: 470, y: 230 }} b={{ x: 210, y: 140 }} color={K.b} dash />
          <Fly key="t2" from={{ x: 528, y: 262 }} to={B_SLOT} dur={1.2} delay={0.5}>
            <Token />
          </Fly>
        </>
      )}
      {!atk && s === 3 && (
        <>
          <Fly key="s3" from={{ x: 146, y: 270 }} via={[{ x: 300, y: 200 }]} to={{ x: 416, y: 124 }} dur={1.3} keep={false}>
            <KeyIcon />
          </Fly>
          <Fly key="t3" from={B_SLOT} via={[{ x: 300, y: 220 }]} to={{ x: 52, y: 262 }} dur={1.3} delay={1.2}>
            <Token />
          </Fly>
        </>
      )}
      {!atk && s === 4 && (
        <>
          <Beam a={{ x: 470, y: 160 }} b={{ x: 490, y: 226 }} color={K.gold} dash />
          <Fly key="s4" from={{ x: 470, y: 232 }} via={[{ x: 300, y: 200 }]} to={{ x: 58, y: 124 }} dur={1.3} delay={0.4} keep={false}>
            <KeyIcon />
          </Fly>
          <Fly key="c4" from={A_SLOT} via={[{ x: 300, y: 220 }]} to={{ x: 528, y: 262 }} dur={1.3} delay={1.6}>
            <Coin />
          </Fly>
        </>
      )}
      {!atk && s >= 5 && (
        <>
          <Verdict x={300} y={130} ok r={16} />
          <Tag x={300} y={168} text={t("proto.htlc.atomic")} color={K.green} solid />
        </>
      )}

      {/* ---------- sự cố: Bob mất khả năng phản hồi ---------- */}
      {atk && s === 0 && <Tag x={300} y={130} text={t("proto.htlc.bothLocked")} color={K.v} />}
      {atk && s === 1 && (
        <>
          <Fly key="as1" from={{ x: 146, y: 270 }} via={[{ x: 300, y: 200 }]} to={{ x: 416, y: 124 }} dur={1.2} keep={false}>
            <KeyIcon />
          </Fly>
          <Fly key="at1" from={B_SLOT} via={[{ x: 300, y: 220 }]} to={{ x: 52, y: 262 }} dur={1.3} delay={1.1}>
            <Token />
          </Fly>
        </>
      )}
      {atk && s >= 2 && (
        <g>
          <Fly key="stuck" from={{ x: 470, y: 228 }} to={{ x: 410, y: 196 }} dur={1.2} keep>
            <Envelope bad label={t("proto.htlc.stuck")} />
          </Fly>
          <Verdict x={432} y={186} ok={false} r={9} />
        </g>
      )}
      {atk && s >= 2 && <Tag x={520} y={214} text={t("proto.htlc.offline")} color={K.red} solid size={8.5} />}
      {atk && s === 3 && (
        <Fly key="ref" from={A_SLOT} to={{ x: 74, y: 262 }} dur={1.2} delay={0.4}>
          <Coin />
        </Fly>
      )}
      {atk && s >= 3 && <Tag x={121} y={100} text={t("proto.htlc.refund")} color={K.red} delay={0.3} size={8.5} />}
      {atk && s >= 4 && <Tag x={300} y={118} text={t("proto.htlc.unfair")} color={K.red} solid size={8.5} />}
    </Stage>
  );
}
