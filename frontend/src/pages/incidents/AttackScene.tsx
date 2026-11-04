// Cảnh minh họa một cuộc tấn công cầu nối: chuỗi nguồn (vault) · hợp đồng cầu nối + validator · chuỗi đích,
// kẻ tấn công ở dưới. `upto` = bước đang xem; `guarded` = có công cụ của luận án (dừng tại bước bị chặn).
import { AnimatePresence, motion } from "framer-motion";
import { useT } from "../../i18n/useT";
import type { Story } from "./stories";

const COLOR = { cd1: "#00c9b0", cd2: "#a26bff", cd3: "#ff8f42" };
const RED = "#ff4b4b";
const GREEN = "#22c55e";

/** Trạng thái tích lũy của cảnh sau khi áp dụng các bước 0..upto. */
export function sceneState(story: Story, upto: number, guarded: boolean) {
  const { block } = story;
  let compromised = 0;
  let bug = false;
  let hijacked = false;
  let accepted = false;
  let minted = false;
  let drained = 0;
  let copy = false;
  let late = false;
  let stopped = false;
  const totalW = story.steps.filter((s) => s.kind === "drain").reduce((a, s) => a + (s.w ?? 1), 0) || 1;
  for (let i = 0; i <= upto && i < story.steps.length; i++) {
    if (guarded && (i > block.step || (i === block.step && block.by !== "cd3"))) {
      if (i === block.step) compromised += block.keys ?? 0;
      stopped = true;
      break;
    }
    const s = story.steps[i];
    if (s.kind === "keys") compromised += s.n ?? 1;
    if (s.kind === "upgrade") bug = true;
    if (s.kind === "hijack") hijacked = true;
    if (s.kind === "accept") accepted = true;
    if (s.kind === "mint") minted = true;
    if (s.kind === "drain") drained += (s.w ?? 1) / totalW;
    if (s.kind === "copy") copy = true;
    if (s.kind === "late") late = true;
  }
  const shield = guarded && upto >= block.step;
  return { compromised, bug, hijacked, accepted, minted, drained: Math.min(1, drained), copy, late, stopped, shield };
}

export default function AttackScene({ story, upto, guarded }: { story: Story; upto: number; guarded: boolean }) {
  const { t } = useT();
  const st = sceneState(story, upto, guarded);
  const step = story.steps[Math.min(upto, story.steps.length - 1)];
  const active = !(guarded && st.stopped && upto > story.block.step) && !(guarded && upto === story.block.step && story.block.by !== "cd3");
  const kind = step?.kind;
  const coins = Math.round(8 * (1 - st.drained));
  const shieldColor = COLOR[story.block.by];
  // vị trí khiên: chắn đường kẻ tấn công → cầu nối (CĐ1/CĐ2) hoặc dòng tiền kho → kẻ tấn công (CĐ3 giám sát)
  const shieldPos = story.block.by === "cd3" ? { x: 196, y: 196 } : { x: 300, y: 186 };

  return (
    <svg viewBox="0 0 600 300" className="h-auto w-full" role="img">
      <defs>
        <marker id="asArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill={RED} />
        </marker>
      </defs>
      {/* chuỗi nguồn */}
      <rect x={20} y={40} width={150} height={170} rx={14} className="fill-surface-1" stroke="#3d8bff" strokeWidth={2} />
      <text x={95} y={62} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-slate-100">
        {t("inc.scene.source")}
      </text>
      {Array.from({ length: 8 }, (_, i) => (
        <motion.ellipse key={i} cx={95} cy={190 - i * 13} rx={34} ry={8} initial={false} animate={{ opacity: i < coins ? 1 : 0.08 }} fill="#ffc730" stroke="#b98600" strokeWidth={1.5} />
      ))}
      <text x={95} y={228} textAnchor="middle" fontSize={10} fontFamily="JetBrains Mono" className="fill-slate-400">
        {t("inc.scene.vault")} {Math.round((1 - st.drained) * 100)}%
      </text>

      {/* hợp đồng cầu nối + validator */}
      <motion.rect x={225} y={30} width={150} height={120} rx={14} className="fill-surface-1" initial={false} animate={{ stroke: st.bug || st.hijacked || st.accepted ? RED : "#a26bff" }} strokeWidth={st.bug || st.hijacked || st.accepted ? 3 : 2} />
      <text x={300} y={52} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-slate-100">
        {t("inc.scene.bridge")}
      </text>
      {st.bug && (
        <text x={300} y={72} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          {t("inc.scene.bug")}
        </text>
      )}
      {st.hijacked && (
        <text x={300} y={72} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          {t("inc.scene.hijacked")}
        </text>
      )}
      {st.accepted && !st.bug && !st.hijacked && (
        <text x={300} y={72} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          {t("inc.scene.accepted")}
        </text>
      )}
      {Array.from({ length: story.validators }, (_, i) => {
        const w = Math.min(130, story.validators * 16);
        const x = 300 - w / 2 + (i + 0.5) * (w / story.validators);
        const bad = i < st.compromised;
        return (
          <motion.g key={i} initial={false} animate={{ scale: bad ? [1, 1.3, 1] : 1 }} style={{ originX: `${x}px`, originY: "128px" }}>
            <circle cx={x} cy={128} r={6} fill={bad ? RED : GREEN} stroke="rgb(var(--c-white))" strokeWidth={1.2} />
          </motion.g>
        );
      })}
      <text x={300} y={112} textAnchor="middle" fontSize={9.5} className="fill-slate-400">
        {t("inc.scene.validators")} {st.compromised > 0 ? `· ${st.compromised}/${story.validators} ${t("inc.scene.stolen")}` : ""}
      </text>

      {/* chuỗi đích */}
      <rect x={430} y={40} width={150} height={170} rx={14} className="fill-surface-1" stroke="#ff8f42" strokeWidth={2} />
      <text x={505} y={62} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-slate-100">
        {t("inc.scene.dest")}
      </text>
      <AnimatePresence>
        {st.minted &&
          Array.from({ length: 6 }, (_, i) => (
            <motion.rect key={i} x={470 + (i % 3) * 26} y={100 + Math.floor(i / 3) * 28} width={20} height={20} rx={4} fill={RED} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 0.85, y: 0 }} transition={{ delay: i * 0.06 }} />
          ))}
      </AnimatePresence>
      {st.minted && (
        <text x={505} y={176} textAnchor="middle" fontSize={10} fontWeight={700} fill={RED}>
          {t("inc.scene.unbacked")}
        </text>
      )}

      {/* kẻ tấn công */}
      <g>
        <circle cx={300} cy={236} r={14} className="fill-slate-200" />
        <path d="M286 276 Q300 248 314 276 Z" className="fill-slate-200" />
        <rect x={292} y={232} width={16} height={5} rx={2} fill={RED} />
        {st.copy &&
          [-60, -30, 30, 60].map((dx) => (
            <g key={dx} opacity={0.55}>
              <circle cx={300 + dx} cy={246} r={9} className="fill-slate-200" />
              <path d={`M${291 + dx} 272 Q${300 + dx} 254 ${309 + dx} 272 Z`} className="fill-slate-200" />
            </g>
          ))}
        <text x={300} y={292} textAnchor="middle" fontSize={10} className="fill-slate-400">
          {t("inc.scene.attacker")}
        </text>
      </g>

      {/* hoạt ảnh của bước hiện tại */}
      {active && kind === "keys" && <motion.path key={`k${upto}`} d="M 300 220 L 300 140" stroke={RED} strokeWidth={2.5} markerEnd="url(#asArrow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />}
      {active && (kind === "forge" || kind === "hijack" || kind === "upgrade") && (
        <motion.g key={`f${upto}`} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: 0, y: -150, opacity: [0, 1, 1, 0.9] }} transition={{ duration: 1.1 }}>
          <rect x={286} y={210} width={28} height={18} rx={3} fill="#fff" stroke={RED} strokeWidth={2} />
          <path d="M286 210 L300 221 L314 210" fill="none" stroke={RED} strokeWidth={2} />
        </motion.g>
      )}
      {active && (kind === "accept" || kind === "mint") && <motion.path key={`m${upto}`} d="M 375 90 L 450 110" stroke={RED} strokeWidth={2.5} markerEnd="url(#asArrow)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />}
      {active && kind === "drain" &&
        [0, 1, 2, 3].map((i) => (
          <motion.ellipse
            key={`d${upto}-${i}`}
            rx={10}
            ry={4}
            fill="#ffc730"
            stroke="#b98600"
            initial={{ cx: 120, cy: 150, opacity: 0 }}
            animate={{ cx: [120, 220, 290], cy: [150, 215, 232], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: i * 0.25, repeat: 1 }}
          />
        ))}
      {st.late && (
        <g>
          <rect x={410} y={232} width={170} height={30} rx={8} fill={`${RED}22`} stroke={RED} />
          <text x={495} y={252} textAnchor="middle" fontSize={11} fontWeight={700} fill={RED}>
            {t(`inc.story.${story.id}.late`)}
          </text>
        </g>
      )}

      {/* khiên của công cụ luận án */}
      <AnimatePresence>
        {st.shield && (
          <motion.g key="shield" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} style={{ originX: `${shieldPos.x}px`, originY: `${shieldPos.y}px` }}>
            <circle cx={shieldPos.x} cy={shieldPos.y} r={30} fill={shieldColor} opacity={0.18} />
            <path
              d={`M${shieldPos.x} ${shieldPos.y - 22} l17 7 v11 c0 11 -7 18 -17 22 c-10 -4 -17 -11 -17 -22 v-11 z`}
              fill={shieldColor}
              stroke="#16140f"
              strokeWidth={2}
            />
            <path d={`M${shieldPos.x - 7} ${shieldPos.y} l5 5 l10 -10`} fill="none" stroke="#16140f" strokeWidth={3} strokeLinecap="round" />
            <text x={shieldPos.x + 36} y={shieldPos.y + 4} textAnchor="start" fontSize={11} fontWeight={800} fill={shieldColor}>
              {story.block.by.toUpperCase()} {story.block.by === "cd3" ? "· R5" : ""}
            </text>
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
