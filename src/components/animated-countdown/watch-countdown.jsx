"use client";;
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

const RINGS = [
  { key: "d", label: "Days", color: "#bf5af2", max: 30 },
  { key: "h", label: "Hours", color: "#5e5ce6", max: 24 },
  { key: "m", label: "Minutes", color: "#0a84ff", max: 60 },
  { key: "s", label: "Seconds", color: "#64d2ff", max: 60 }
];

const SIZE = 300;
const C = SIZE / 2;
const STROKE = 16;
const GAP = 5;
/** 12 days, 7 hours, 43 minutes, 21 seconds. */
const DEFAULT_OFFSET = (((12 * 24 + 7) * 60 + 43) * 60 + 21) * 1000;

// A shared clock. The server snapshot is null so the first client render matches the HTML.
// `latest` is cached between ticks so getSnapshot stays stable for React.
let latest = 0;
let subscribers = 0;

function attach() {
  subscribers += 1;
  latest = Date.now();
  return () => {
    subscribers -= 1;
    if (subscribers === 0) latest = 0;
  };
}

/** Smooth clock: one update per animation frame (paused by the browser while the tab is hidden). */
function subscribeFrames(cb) {
  const detach = attach();
  let raf = 0;
  const loop = () => {
    latest = Date.now();
    cb();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    detach();
  };
}

/** Coarse clock: four checks a second, used off screen and under reduced motion. */
function subscribeCoarse(cb) {
  const detach = attach();
  const t = setInterval(() => {
    if (document.hidden) return;
    latest = Date.now();
    cb();
  }, 250);
  return () => {
    clearInterval(t);
    detach();
  };
}

const getNow = () => {
  if (latest === 0) latest = Date.now();
  return latest;
};
const getServerNow = () => null;

const two = (n) => String(n).padStart(2, "0");

function Digit({
  v,
  reduce
}) {
  return (
    <span className="relative inline-flex h-[1.15em] w-[0.62em] justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={v}
          className="absolute"
          initial={reduce ? false : { y: "100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32, filter: { duration: 0.2 } }}
        >
          {v}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * A countdown drawn as watch rings: days, hours, minutes and seconds each
 * empty around their own track, the seconds ring sweeping smoothly with a
 * bright head on its tip. The time in the middle rolls digit by digit, and
 * pointing at a ring (or focusing its readout underneath) names it.
 */
export function WatchCountdown({
  to,
  title = "Nexus 3.0 ships in",
  className = ""
}) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/:/g, "");
  const root = useRef(null);
  const onScreen = useInView(root, { amount: 0.1 });
  const now = useSyncExternalStore(reduce || !onScreen ? subscribeCoarse : subscribeFrames, getNow, getServerNow);
  const [hover, setHover] = useState(null);

  // Without an explicit target, the default is fixed from the first real clock reading, never during the server render.
  const explicit = to === undefined ? null : typeof to === "number" ? to : to.getTime();
  const [fallback, setFallback] = useState(null);
  if (explicit === null && fallback === null && now !== null) setFallback(now + DEFAULT_OFFSET);
  const end = explicit ?? fallback;

  const ready = now !== null && end !== null;
  const left = ready ? Math.max(0, end - (reduce ? Math.floor(now / 1000) * 1000 : now)) : 0;
  const parts = {
    d: left / 86400000,
    h: (left % 86400000) / 3600000,
    m: (left % 3600000) / 60000,
    s: (left % 60000) / 1000,
  };
  const whole = { d: Math.floor(parts.d), h: Math.floor(parts.h), m: Math.floor(parts.m), s: Math.floor(parts.s) };
  const show = (key) => (!ready ? "--" : key === "d" ? String(whole.d) : two(whole[key]));
  const big = hover === null ? `${show("d")}d` : show(RINGS[hover].key);

  return (
    <div
      ref={root}
      className={`flex w-[360px] max-w-full flex-col items-center rounded-[30px] bg-[#0b0b0d] px-6 pb-7 pt-6 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] max-[400px]:px-4 dark:shadow-[0_0_0_1px_rgba(255,255,255,.08),0_30px_60px_-30px_rgba(0,0,0,.9)] ${className}`}
    >
      <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/50">{title}</span>
      <div className="relative mt-4" style={{ width: SIZE, height: SIZE, maxWidth: "100%" }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" aria-hidden="true">
          <defs>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          {RINGS.map((r, i) => {
            const radius = C - STROKE / 2 - i * (STROKE + GAP);
            const circ = 2 * Math.PI * radius;
            const frac = Math.min(1, parts[r.key] / r.max);
            const a = frac * Math.PI * 2;
            const hx = C + Math.cos(a) * radius;
            const hy = C + Math.sin(a) * radius;
            const dim = hover !== null && hover !== i;
            return (
              <g
                key={r.key}
                style={{ opacity: dim ? 0.35 : 1, transition: reduce ? "none" : "opacity .2s" }}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
              >
                <circle cx={C} cy={C} r={radius} fill="none" stroke={r.color} strokeOpacity=".18" strokeWidth={STROKE} />
                <circle cx={C} cy={C} r={radius} fill="none" stroke={r.color} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={`${frac * circ} ${circ}`} />
                {frac > 0.01 && (
                  <>
                    <circle cx={hx} cy={hy} r={STROKE / 2 + 2} fill={r.color} filter={`url(#${uid}-glow)`} opacity=".9" />
                    <circle cx={hx} cy={hy} r={STROKE / 2 - 1} fill="#fff" opacity=".9" />
                  </>
                )}
                {/* invisible fat hit area so the ring is easy to point at */}
                <circle cx={C} cy={C} r={radius} fill="none" stroke="transparent" strokeWidth={STROKE + GAP} />
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={hover ?? "all"}
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: hover === null ? "rgba(255,255,255,.5)" : RINGS[hover].color }}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
              transition={reduce ? { duration: 0 } : undefined}
            >
              {hover === null ? "Remaining" : RINGS[hover].label}
            </motion.span>
          </AnimatePresence>
          <span className="mt-1 flex text-[34px] font-semibold leading-[1.15] tabular-nums tracking-[-0.03em] text-white" aria-hidden="true">
            {[...big].map((c, k) => (
              <Digit key={`${hover ?? "all"}-${k}`} v={c} reduce={reduce} />
            ))}
          </span>
          <span className="mt-1 text-[15px] font-medium tabular-nums text-white/70" aria-hidden="true">
            {ready ? `${two(whole.h)}:${two(whole.m)}:${two(whole.s)}` : "--:--:--"}
          </span>
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-4 gap-2">
        {RINGS.map((r, i) => (
          <button
            key={r.key}
            type="button"
            aria-label={ready ? `${show(r.key)} ${r.label.toLowerCase()}` : r.label}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="flex flex-col items-center rounded-[12px] py-2 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a84ff]"
          >
            <span className="text-[17px] font-semibold tabular-nums" style={{ color: r.color }}>
              {show(r.key)}
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">{r.label}</span>
          </button>
        ))}
      </div>
      <span className="sr-only" role="timer" aria-live="polite">
        {ready ? `${whole.d} days ${whole.h} hours ${whole.m} minutes left` : "Countdown"}
      </span>
    </div>
  );
}
