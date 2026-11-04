type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  /** Giá trị rời rạc (replay chỉ có các giá trị đã ghi). */
  options?: number[];
  color?: string;
  disabled?: boolean;
};

/** Thanh trượt có nhãn; nếu có `options` thì bám vào giá trị gần nhất. */
export default function Slider({ label, value, min, max, step = 0.01, onChange, format = (v) => String(v), options, color = "#a78bfa", disabled }: Props) {
  const pct = ((value - min) / (max - min)) * 100;
  const snap = (v: number) => (options ? options.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)) : v);
  return (
    <label className={`block space-y-1.5 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-slate-100">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(snap(Number(e.target.value)))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ink-950 [&::-webkit-slider-thumb]:shadow-lg"
        style={{ background: `linear-gradient(90deg, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)` }}
      />
    </label>
  );
}
