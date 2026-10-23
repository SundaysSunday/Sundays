"use client";;
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const VW = 380;
const VH = 230;
const FUSE = "M 22 168 C 70 168, 60 96, 112 104 S 160 196, 214 170 S 262 110, 300 182";
const START = { x: 22, y: 168 };
const ROCKET_X = 318;
const ROCKET_BASE = 186;
const SPARK_POOL = 192;
const BURST_COUNT = 90;
const BURST_COLORS = ["#ff375f", "#ffd60a", "#30d158", "#0a84ff", "#bf5af2"];

/** Moves a pool of pre-rendered circles to match the live particles, hiding the rest. */
function drawPool(pool, list, radius) {
  for (let i = 0; i < pool.length; i++) {
    const el = pool[i];
    if (!el) continue;
    const s = list[i];
    if (!s || s.life <= 0) {
      if (el.getAttribute("r") !== "0") el.setAttribute("r", "0");
      continue;
    }
    const k = Math.min(1, s.life * 2);
    el.setAttribute("cx", s.x.toFixed(1));
    el.setAttribute("cy", s.y.toFixed(1));
    el.setAttribute("r", (radius * k).toFixed(2));
    el.setAttribute("fill", s.c);
    el.setAttribute("opacity", k.toFixed(2));
  }
}

/**
 * A launch countdown on a lit fuse. The spark eats along a curling fuse at
 * exactly the pace of the clock, spitting sparks and leaving ash behind it.
 * When it reaches the rocket, the rocket goes up and bursts into the
 * announcement. Relight lights a fresh fuse. The fuse lights when the card
 * scrolls into view and holds while it is off screen or the tab is hidden.
 */
export function FuseCountdown({
  seconds = 24,
  title = "Doors open in",
  launchMessage = "Nexus 3.0 is out. Go look.",
  onLaunch,
  autoplay = false,
  className = ""
}) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/:/g, "");
  const root = useRef(null);
  const path = useRef(null);
  const sparkEls = useRef([]);
  const burstEls = useRef([]);
  const touched = useRef(false);
  const launchCb = useRef(onLaunch);
  const [left, setLeft] = useState(seconds);
  const [launched, setLaunched] = useState(false);
  const [run, setRun] = useState(0);
  const [burnt, setBurnt] = useState(0);
  const [tip, setTip] = useState(START);
  const [len, setLen] = useState(1);

  useEffect(() => {
    launchCb.current = onLaunch;
  }, [onLaunch]);

  const relight = useCallback(() => {
    setLaunched(false);
    setBurnt(0);
    setTip(START);
    setLeft(seconds);
    setRun((r) => r + 1);
  }, [seconds]);

  useEffect(() => {
    const p = path.current;
    const box = root.current;
    if (!p || !box) return;
    const L = p.getTotalLength();
    const sparks = [];
    const burst = [];
    const sparkPool = sparkEls.current;
    const burstPool = burstEls.current;
    let raf = 0;
    let prev = 0;
    let elapsed = 0;
    let sinceLaunch = 0;
    let spawn = 0;
    let done = false;
    let burstFired = false;
    let finished = false;

    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      // Time only advances while the card is drawing frames, so the fuse holds off screen and in hidden tabs.
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0;
      prev = now;
      elapsed = Math.min(seconds, elapsed + dt);
      const t = seconds > 0 ? elapsed / seconds : 1;
      // Reduced motion: the fuse steps once a second instead of creeping.
      const shown = reduce ? Math.min(seconds, Math.ceil(elapsed)) : elapsed;
      const b = (seconds > 0 ? shown / seconds : 1) * L;
      const pt = p.getPointAtLength(b);
      setLen(L);
      setBurnt(b);
      setTip({ x: pt.x, y: pt.y });
      setLeft(Math.max(0, seconds - shown));

      if (!reduce && t < 1) {
        spawn += dt * 180;
        while (spawn >= 1 && sparks.length < SPARK_POOL) {
          spawn -= 1;
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
          const s = 40 + Math.random() * 110;
          sparks.push({ x: pt.x, y: pt.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.4, c: Math.random() > 0.4 ? "#ffd60a" : "#ff9f0a" });
        }
        spawn = Math.min(spawn, 1);
      }
      if (t >= 1 && !done) {
        done = true;
        setLaunched(true);
        launchCb.current?.();
      }
      if (done) sinceLaunch += dt;
      if (done && !reduce && !burstFired && sinceLaunch >= 0.65) {
        burstFired = true;
        for (let k = 0; k < BURST_COUNT; k++) {
          const a = (k / BURST_COUNT) * Math.PI * 2;
          const s = 70 + Math.random() * 90;
          burst.push({ x: ROCKET_X, y: 46, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 + Math.random() * 0.6, c: BURST_COLORS[k % BURST_COLORS.length] });
        }
      }
      for (const arr of [sparks, burst]) {
        for (const s of arr) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy += 160 * dt;
          s.vx *= 0.98;
          s.life -= dt;
        }
        let i = arr.length;
        while (i--) if (arr[i].life <= 0) arr.splice(i, 1);
      }
      drawPool(sparkPool, sparks, 1.6);
      drawPool(burstPool, burst, 2.6);

      // Nothing left to animate: stop the loop until the next relight.
      if (done && sparks.length === 0 && burst.length === 0 && (burstFired || reduce)) {
        finished = true;
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const start = () => {
      if (raf || finished) return;
      prev = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    for (const el of [...sparkPool, ...burstPool]) el?.setAttribute("r", "0");

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.2 },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      stop();
    };
  }, [seconds, run, reduce]);

  // Autoplay: after a launch, hold for a moment, then light a fresh fuse. Stops for good once the button is pressed.
  useEffect(() => {
    if (!autoplay || reduce || !launched) return;
    const t = setTimeout(() => {
      if (!touched.current) relight();
    }, 4200);
    return () => clearTimeout(t);
  }, [autoplay, reduce, launched, relight]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(Math.floor(left % 60)).padStart(2, "0");
  const cs = String(Math.floor((left % 1) * 100)).padStart(2, "0");

  return (
    <div
      ref={root}
      onPointerDown={() => {
        touched.current = true;
      }}
      className={`w-[400px] max-w-full overflow-hidden rounded-[28px] bg-white text-[#1d1d1f] shadow-[0_0_0_1px_rgba(0,0,0,.05),0_20px_40px_-26px_rgba(0,0,0,.35)] dark:bg-[#1c1c1e] dark:text-[#f5f5f7] dark:shadow-[0_0_0_1px_rgba(255,255,255,.08),0_20px_40px_-26px_rgba(0,0,0,.9)] ${className}`}
    >
      <div className="flex items-baseline justify-between gap-3 px-6 pt-6 max-[400px]:px-4 max-[400px]:pt-4">
        <span className="text-[14px] font-medium text-[#6e6e73] dark:text-[#a1a1a6]">{launched ? "We're live" : title}</span>
        <span className="text-[30px] font-semibold tabular-nums tracking-[-0.03em]" aria-hidden="true">
          {mm}:{ss}
          <span className="text-[18px] text-[#6e6e73] dark:text-[#a1a1a6]">.{cs}</span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="block h-auto w-full"
        aria-label={launched ? "The rocket has launched" : `${Math.ceil(left)} seconds left on the fuse`}
        role="img"
      >
        <defs>
          <pattern id={`${uid}-rope`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#c9a36b" />
            <rect width="3" height="6" fill="#b38a52" />
          </pattern>
          <linearGradient id={`${uid}-body`} x1="0" x2="1">
            <stop offset="0" stopColor="#d2d2d7" />
            <stop offset=".38" stopColor="#ffffff" />
            <stop offset="1" stopColor="#c7c7cc" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0" stopColor="#fff7d1" />
            <stop offset=".4" stopColor="#ffd60a" stopOpacity=".9" />
            <stop offset="1" stopColor="#ff9f0a" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* ash behind the spark, rope ahead of it */}
        <path d={FUSE} fill="none" stroke="#8e8e93" strokeOpacity=".45" strokeWidth="2" strokeDasharray={`${burnt} ${len}`} strokeLinecap="round" />
        <path ref={path} d={FUSE} fill="none" stroke={`url(#${uid}-rope)`} strokeWidth="5" strokeLinecap="round" strokeDasharray={`0 ${burnt} ${len}`} />
        {!launched && <circle cx={tip.x} cy={tip.y} r="14" fill={`url(#${uid}-glow)`} />}
        {!launched && <circle cx={tip.x} cy={tip.y} r="3" fill="#fffbe6" />}
        <g>
          {Array.from({ length: SPARK_POOL }, (_, i) => (
            <circle
              key={i}
              r="0"
              ref={(el) => {
                sparkEls.current[i] = el;
              }}
            />
          ))}
        </g>
        {/* the rocket */}
        <motion.g
          initial={false}
          animate={launched ? { y: -260, transition: reduce ? { duration: 0 } : { duration: 0.75, ease: [0.5, 0, 0.9, 0.6] } } : { y: 0, transition: { duration: 0 } }}
        >
          <g transform={`translate(${ROCKET_X} ${ROCKET_BASE})`}>
            {launched && !reduce && (
              <motion.path d="M -5 4 Q 0 60 5 4 Z" fill="#ff9f0a" initial={{ scaleY: 0 }} animate={{ scaleY: [0.6, 1.2, 0.8, 1.1] }} transition={{ duration: 0.4, repeat: Infinity }} />
            )}
            <path d="M -8 -12 L -15 1 L -8 -1 Z M 8 -12 L 15 1 L 8 -1 Z" className="fill-[#1d1d1f] dark:fill-[#f5f5f7]" />
            <rect x="-8" y="-60" width="16" height="60" rx="4" fill={`url(#${uid}-body)`} />
            <rect x="-8" y="-24" width="16" height="5" fill="#0a84ff" />
            <path d="M -8 -58 Q -7 -74 0 -84 Q 7 -74 8 -58 Z" className="fill-[#1d1d1f] dark:fill-[#f5f5f7]" />
          </g>
        </motion.g>
        <g>
          {Array.from({ length: BURST_COUNT }, (_, i) => (
            <circle
              key={i}
              r="0"
              ref={(el) => {
                burstEls.current[i] = el;
              }}
            />
          ))}
        </g>
        {!launched && <rect x={ROCKET_X - 22} y={ROCKET_BASE + 4} width="44" height="6" rx="3" className="fill-[#e8e8ed] dark:fill-[#3a3a3c]" />}
      </svg>
      <div className="flex items-center justify-between gap-3 px-6 pb-6 max-[400px]:px-4 max-[400px]:pb-4">
        <div aria-live="polite" className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {launched ? (
              <motion.span
                key="live"
                className="block text-[15px] font-semibold"
                initial={reduce ? false : { opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: reduce ? { duration: 0 } : { delay: 0.7 } }}
                exit={{ opacity: 0 }}
              >
                {launchMessage}
              </motion.span>
            ) : (
              <motion.span
                key="wait"
                className="block text-[13px] text-[#6e6e73] dark:text-[#a1a1a6]"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                The fuse burns at the speed of the clock.
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <button
          type="button"
          onClick={() => {
            touched.current = true;
            relight();
          }}
          className="h-9 flex-none rounded-full bg-[#1d1d1f] px-4 text-[13px] font-medium text-white outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] dark:bg-[#f5f5f7] dark:text-[#1d1d1f] dark:focus-visible:outline-[#0a84ff]"
        >
          {launched ? "Light another" : "Relight"}
        </button>
      </div>
    </div>
  );
}
