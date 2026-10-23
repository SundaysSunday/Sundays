"use client";;
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";

const CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:";
const DIGITS = " 0123456789";
const DEFAULT_STATUSES = ["BOARDING", "ON TIME", "GATE B12", "FINAL CALL"];
/** 2 days, 14 hours, 37 minutes, 9 seconds. */
const DEFAULT_OFFSET = ((2 * 24 + 14) * 3600 + 37 * 60 + 9) * 1000;
const FONT = "ui-monospace, 'SF Mono', Menlo, monospace";

// A shared one-second clock. The server snapshot is null so the first client render matches the HTML.
const subscribe = (cb) => {
  const t = setInterval(cb, 250);
  return () => clearInterval(t);
};
const getSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = () => null;

/** One half of a tile. Sizes come from the board's `--fw`, `--fh` and `--ffs` variables. */
function Half({
  ch,
  top
}) {
  return (
    <span
      className="absolute left-0 w-full overflow-hidden"
      style={{
        height: "calc(var(--fh) / 2)",
        top: top ? 0 : "calc(var(--fh) / 2)",
        background: top ? "linear-gradient(#2c2c2e,#232325)" : "linear-gradient(#202022,#29292b)",
        borderRadius: top ? "5px 5px 0 0" : "0 0 5px 5px",
      }}
    >
      <span
        className="absolute left-0 flex w-full items-center justify-center font-semibold text-[#f5f5f7]"
        style={{ height: "var(--fh)", top: top ? 0 : "calc(var(--fh) / -2)", fontSize: "var(--ffs)", fontFamily: FONT }}
      >
        {ch}
      </span>
    </span>
  );
}

/** One flap. It steps through its character set until it reaches its target, like a real board. */
function Flap({
  target,
  speed = 55,
  set = CHARS,
  instant
}) {
  const [st, setSt] = useState({ cur: " ", old: " ", n: 0 });
  useEffect(() => {
    if (st.cur === target) return;
    const t = setTimeout(() => {
      setSt((s) => {
        const i = set.indexOf(s.cur);
        // Characters outside the set (and reduced motion) land in one flip instead of looping forever.
        const next = instant || !set.includes(target) ? target : set[(i + 1) % set.length];
        return { cur: next, old: s.cur, n: s.n + 1 };
      });
    }, speed);
    return () => clearTimeout(t);
  }, [st.cur, target, speed, set, instant]);
  const d = speed / 1000;
  return (
    <span className="relative inline-block flex-none" style={{ width: "var(--fw)", height: "var(--fh)", perspective: 200 }} aria-hidden="true">
      <Half ch={st.cur} top />
      <Half ch={st.old} top={false} />
      <motion.span
        key={`t${st.n}`}
        className="absolute left-0 top-0 w-full"
        style={{ height: "calc(var(--fh) / 2)", transformOrigin: "50% 100%", backfaceVisibility: "hidden" }}
        initial={{ rotateX: 0 }}
        animate={{ rotateX: -90 }}
        transition={{ duration: d * 0.9, ease: "easeIn" }}
      >
        <Half ch={st.old} top />
      </motion.span>
      <motion.span
        key={`b${st.n}`}
        className="absolute left-0 w-full"
        style={{ top: "calc(var(--fh) / 2)", height: "calc(var(--fh) / 2)", transformOrigin: "50% 0%", backfaceVisibility: "hidden" }}
        initial={{ rotateX: 90 }}
        animate={{ rotateX: 0 }}
        transition={{ duration: d * 0.9, delay: d * 0.45, ease: "easeOut" }}
      >
        <span className="absolute left-0 w-full" style={{ top: "calc(var(--fh) / -2)", height: "var(--fh)" }}>
          <Half ch={st.cur} top={false} />
        </span>
      </motion.span>
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-px bg-black/70" />
    </span>
  );
}

function Row({
  text,
  len,
  speed,
  set,
  instant
}) {
  const t = text.toUpperCase().padEnd(len, " ").slice(0, len);
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {t.split("").map((c, i) => (
        <Flap key={i} target={c} speed={speed} set={set} instant={instant} />
      ))}
    </span>
  );
}

const p2 = (v) => String(v).padStart(2, "0");

/**
 * A split-flap board, the kind that used to clatter in stations. Each tile
 * flips through the alphabet until it lands on its letter, so changes ripple
 * across the row. Shown as a launch countdown with a rotating status line.
 */
export function SplitFlapBoard({
  to,
  label = "Launch · MK 4.0",
  liveLabel = "Live",
  statusLabel = "Status",
  statuses = DEFAULT_STATUSES,
  status,
  onComplete,
  autoplay = false,
  className = ""
}) {
  const reduce = useReducedMotion() ?? false;
  const [fallbackTarget] = useState(() => Date.now() + DEFAULT_OFFSET);
  const target = to === undefined ? fallbackTarget : typeof to === "number" ? to : to.getTime();
  const nowSec = useSyncExternalStore(subscribe, getSecond, getServerSecond);
  const [s, setS] = useState(0);
  const touched = useRef(false);
  const done = useRef(false);

  useEffect(() => {
    if (!autoplay || statuses.length < 2) return;
    const t = setInterval(() => {
      if (touched.current) {
        clearInterval(t);
        return;
      }
      setS((k) => k + 1);
    }, 4200);
    return () => clearInterval(t);
  }, [autoplay, statuses.length]);

  const left = nowSec === null ? null : Math.max(0, Math.floor(target / 1000) - nowSec);

  useEffect(() => {
    if (left === null) return;
    if (left > 0) {
      done.current = false;
      return;
    }
    if (done.current) return;
    done.current = true;
    onComplete?.();
  }, [left, onComplete]);

  const dd = left === null ? null : Math.floor(left / 86400);
  const hh = left === null ? null : Math.floor((left % 86400) / 3600);
  const mm = left === null ? null : Math.floor((left % 3600) / 60);
  const ss = left === null ? null : left % 60;
  const fmt = (v) => (v === null ? "  " : p2(v));
  const line = status ?? (statuses.length ? statuses[s % statuses.length] : "");

  return (
    <div
      className={`flex flex-col gap-4 rounded-[24px] bg-[#111113] p-5 shadow-[0_24px_48px_-26px_rgba(0,0,0,.6)] [--ffs:24px] [--fh:40px] [--fw:26px] max-[400px]:p-4 max-[400px]:[--ffs:20px] max-[400px]:[--fh:34px] max-[400px]:[--fw:21px] dark:shadow-[0_0_0_1px_rgba(255,255,255,.08),0_24px_48px_-26px_rgba(0,0,0,.9)] ${className}`}
      onPointerDown={() => {
        touched.current = true;
      }}
    >
      <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8e8e93]">
        <span className="truncate">{label}</span>
        <span className="flex flex-none items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-[#30d158]"
            animate={reduce ? { opacity: 1 } : { opacity: [1, 0.3, 1] }}
            transition={reduce ? { duration: 0 } : { duration: 1.2, repeat: Infinity }}
          />
          {liveLabel}
        </span>
      </div>
      <div
        role="timer"
        aria-label={left === null ? "Countdown" : `${dd} days ${hh} hours ${mm} minutes ${ss} seconds remaining`}
        className="flex items-end gap-2"
      >
        {(
          [[fmt(dd), "Days"], [fmt(hh), "Hrs"], [fmt(mm), "Min"], [fmt(ss), "Sec"]]
        ).map(([v, l], i) => (
          <div key={l} className="flex items-end gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <Row text={v} len={Math.max(2, v.length)} speed={60} set={DIGITS} instant={reduce} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#636366]" aria-hidden="true">
                {l}
              </span>
            </div>
            {i < 3 && (
              <span className="mb-[26px] text-[20px] font-semibold text-[#48484a]" aria-hidden="true">
                :
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8e8e93]">{statusLabel}</span>
        <span className="sr-only" aria-live="polite">
          {line}
        </span>
        <Row text={line} len={10} speed={40} instant={reduce} />
      </div>
    </div>
  );
}
