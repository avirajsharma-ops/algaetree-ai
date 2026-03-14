"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLiveData } from "./hooks/useLiveData";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const rise = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

/* ── Animated Semicircle Gauge ── */
function SemiGauge({ value, min, max, label, unit, color, icon, delay = 0 }: {
  value: number; min: number; max: number; label: string; unit: string;
  color: string; icon: ReactNode; delay?: number;
}) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const r = 58;
  const circumHalf = Math.PI * r;
  const dashLen = pct * circumHalf;
  const trackColor = "rgba(255,255,255,0.06)";

  return (
    <motion.div
      className="card flex flex-col items-center"
      style={{ padding: "24px 20px 18px" }}
      variants={rise}
    >
      <div style={{ position: "relative", width: 140, height: 80 }}>
        <svg width="140" height="80" viewBox="0 0 140 80">
          {/* Track */}
          <path
            d="M 10 75 A 58 58 0 0 1 130 75"
            fill="none"
            stroke={trackColor}
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.path
            d="M 10 75 A 58 58 0 0 1 130 75"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumHalf}`}
            initial={{ strokeDashoffset: circumHalf }}
            animate={{ strokeDashoffset: circumHalf - dashLen }}
            transition={{ duration: 1.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        {/* Center value */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <motion.span
            className="font-extrabold"
            style={{ fontSize: 28, lineHeight: 1 }}
            key={String(value)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {value}
          </motion.span>
          <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 2 }}>{unit}</span>
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 6, marginTop: 10 }}>
        {icon}
        <span className="font-semibold" style={{ fontSize: 13, color: "var(--text-2)" }}>{label}</span>
      </div>
    </motion.div>
  );
}

/* ── Animated Vertical Bar Chart ── */
function BarChart({ bars, delay = 0 }: {
  bars: { label: string; value: number; max: number; color: string }[];
  delay?: number;
}) {
  return (
    <div className="flex items-end justify-center" style={{ gap: 10, height: 80 }}>
      {bars.map((b, i) => {
        const pct = Math.min(b.value / b.max, 1);
        return (
          <div key={b.label} className="flex flex-col items-center" style={{ gap: 4 }}>
            <div
              style={{
                width: 20, height: 70, borderRadius: 6,
                background: "rgba(255,255,255,0.06)",
                position: "relative", overflow: "hidden",
                display: "flex", alignItems: "flex-end",
              }}
            >
              <motion.div
                style={{
                  width: "100%", borderRadius: 6,
                  background: `linear-gradient(to top, ${b.color}, ${b.color}aa)`,
                  boxShadow: `0 0 10px ${b.color}30`,
                }}
                initial={{ height: 0 }}
                animate={{ height: `${pct * 100}%` }}
                transition={{ duration: 1, delay: delay + i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
            <span style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 600 }}>{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Badge({ label, color = "green" }: { label: string; color?: string }) {
  const bg = color === "green" ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)";
  const fg = color === "green" ? "#4ade80" : "#f97316";
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full text-[11px] font-bold uppercase tracking-wide"
      style={{ background: bg, color: fg, padding: "6px 14px" }}
    >
      <span className={`w-[6px] h-[6px] rounded-full pulse-${color}`} style={{ background: fg }} />
      {label}
    </span>
  );
}

/* ── Animated horizontal progress bar ── */
function AnimBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  return (
    <div className="bar-track" style={{ marginTop: 10 }}>
      <motion.div
        style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 12px ${color}40`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const d = useLiveData();
  const router = useRouter();
  const [time, setTime] = useState("");
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Ambient BG */}
      <div className="ambient-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Fullscreen loading overlay */}
      {navigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            background: "var(--bg)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ position: "relative", width: 60, height: 60 }}>
            <svg width="60" height="60" viewBox="0 0 60 60" style={{ animation: "spin 1.2s linear infinite" }}>
              <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(34,197,94,0.15)" strokeWidth="4" />
              <path d="M30 4a26 26 0 0 1 26 26" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
            </span>
          </div>
          <p className="font-semibold" style={{ fontSize: 16, color: "var(--text-2)" }}>Loading AlgaeTree AI...</p>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Preparing your conversation</p>
        </motion.div>
      )}

      {/* ────── NAVBAR ────── */}
      <motion.nav
        className="card relative z-10 flex items-center justify-between dash-navbar"
        style={{ margin: "20px 24px 0", padding: "14px 28px", borderRadius: 20 }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "rgba(34,197,94,0.15)" }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.5 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          </div>
          <span className="font-bold" style={{ fontSize: 18 }}>AlgaeTree</span>
        </div>

        <div className="items-center dash-nav-tabs" style={{ gap: 8 }}>
          {["Bio-Reactor", "Environment", "Performance", "System"].map((t, i) => (
            <button
              key={t}
              className="font-medium transition-all cursor-pointer"
              style={{
                padding: "10px 22px",
                borderRadius: 14,
                fontSize: 14,
                background: i === 0 ? "rgba(34,197,94,0.12)" : "transparent",
                color: i === 0 ? "#4ade80" : "var(--text-3)",
                border: i === 0 ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="font-semibold tabular-nums dash-time" style={{ fontSize: 15, color: "var(--text-3)" }}>{time}</span>
      </motion.nav>

      {/* ────── BENTO GRID ────── */}
      <motion.main
        className="relative z-10 flex-1 grid overflow-hidden dash-grid"
        style={{
          padding: "20px 24px",
          gap: 20,
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr auto",
        }}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {/* ── HERO CARD (spans 1 col, 2 rows) — hidden on mobile ── */}
        <motion.div
          className="card flex flex-col dash-hero"
          style={{ padding: 32, gridRow: "1 / 3" }}
          variants={rise}
        >
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div
                className="rounded-2xl flex items-center justify-center"
                style={{ width: 48, height: 48, background: "rgba(34,197,94,0.1)" }}
              >
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14.21 10.43A2 2 0 0 1 14 9.53V2"/><path d="M8.5 2h7"/></svg>
              </div>
              <span className="font-bold" style={{ fontSize: 18 }}>Bio-Reactor Core</span>
            </div>
            <Badge label="Optimal" />
          </div>

          {/* Tree image */}
          <div className="flex-1 flex flex-col items-center justify-center dash-tree-section" style={{ gap: 8 }}>
            <div className="relative float-anim" style={{ width: 220, height: 260 }}>
              <Image
                src="https://iot.algaetree.in/Algaetree.png"
                alt="AlgaeTree"
                fill
                className="object-contain"
                style={{ filter: "drop-shadow(0 24px 48px rgba(34,197,94,0.15))" }}
                priority
              />
            </div>
            <motion.p
              className="font-black text-green-400 leading-none"
              style={{ fontSize: "4.5rem", filter: "drop-shadow(0 0 40px rgba(34,197,94,0.3))" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              {d.efficiency}%
            </motion.p>
            <p
              className="font-bold uppercase tracking-[0.3em]"
              style={{ fontSize: 11, color: "var(--text-3)" }}
            >
              Efficiency
            </p>
          </div>

          {/* CTA — desktop only, duplicated below for mobile */}
          <motion.button
            onClick={() => { setNavigating(true); router.push("/talk"); }}
            disabled={navigating}
            className="glow-btn flex items-center justify-center cursor-pointer dash-desktop-cta"
            style={{
              gap: 10,
              marginTop: 20,
              padding: "16px 0",
              borderRadius: 16,
              background: navigating
                ? "linear-gradient(135deg, #15803d, #16a34a)"
                : "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              boxShadow: "0 8px 30px rgba(34,197,94,0.3)",
              opacity: navigating ? 0.85 : 1,
            }}
            whileHover={navigating ? {} : { scale: 1.02 }}
            whileTap={navigating ? {} : { scale: 0.97 }}
          >
            {navigating ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <span>Loading…</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                <span>Talk to the Tree</span>
                <span className="pulse-dot rounded-full" style={{ width: 8, height: 8, background: "#fff" }} />
              </>
            )}
          </motion.button>

          {/* Mini stats */}
          <div className="grid grid-cols-3" style={{ gap: 10, marginTop: 16 }}>
            {[
              { l: "VOLUME", v: `${d.volume}L` },
              { l: "CYCLE", v: `${d.cycle}d` },
              { l: "MAINT.", v: `${d.maint}d` },
            ].map(s => (
              <div
                key={s.l}
                className="rounded-xl"
                style={{ padding: "14px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 9, color: "var(--text-3)" }}>{s.l}</p>
                <p className="font-bold" style={{ fontSize: 14, marginTop: 4 }}>{s.v}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── pH Gauge ── */}
        <SemiGauge
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45L14.21 10.43A2 2 0 0 1 14 9.53V2"/><path d="M8.5 2h7"/></svg>} label="pH Level" value={d.ph} unit="pH"
          min={0} max={14} color="#4ade80" delay={0.2}
        />

        {/* ── Dissolved Oxygen Gauge ── */}
        <SemiGauge
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>} label="Dissolved O₂" value={d.do2} unit="mg/L"
          min={0} max={14} color="#38bdf8" delay={0.3}
        />

        {/* ── Temperature Gauge ── */}
        <SemiGauge
          icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f97316" strokeWidth="2" strokeLinecap="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>} label="Temperature" value={d.temp} unit="°C"
          min={0} max={50} color="#f97316" delay={0.4}
        />

        {/* ── Efficiency ring (mobile only, next to Temperature) ── */}
        <motion.div
          className="card flex flex-col items-center dash-mobile-efficiency"
          style={{ padding: "20px 16px", display: "none" }}
          variants={rise}
        >
          <div style={{ position: "relative", width: 100, height: 60 }}>
            <svg width="100" height="60" viewBox="0 0 100 60">
              <path d="M 8 55 A 42 42 0 0 1 92 55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
              <motion.path
                d="M 8 55 A 42 42 0 0 1 92 55"
                fill="none" stroke="#4ade80" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${Math.PI * 42}`}
                initial={{ strokeDashoffset: Math.PI * 42 }}
                animate={{ strokeDashoffset: Math.PI * 42 * (1 - d.efficiency / 100) }}
                transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ filter: "drop-shadow(0 0 8px rgba(34,197,94,0.4))" }}
              />
            </svg>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
              <span className="font-extrabold text-green-400" style={{ fontSize: 24 }}>{d.efficiency}%</span>
            </div>
          </div>
          <p className="font-bold uppercase tracking-wider" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 6 }}>Efficiency</p>
        </motion.div>

        {/* ── Biomass + Growth with bar chart ── */}
        <motion.div className="card flex flex-col" style={{ padding: 24 }} variants={rise}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>
              <span className="font-semibold" style={{ fontSize: 14, color: "var(--text-2)" }}>Biomass & Growth</span>
            </div>
            <Badge label="Growing" />
          </div>

          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div>
              <motion.span
                className="font-extrabold"
                style={{ fontSize: 32 }}
                key={String(d.biomass)}
                initial={{ opacity: 0.6, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {d.biomass}
              </motion.span>
              <span style={{ fontSize: 13, color: "var(--text-3)", marginLeft: 4 }}>g/L</span>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-400" style={{ fontSize: 18 }}>+{d.growth}%</p>
              <p style={{ fontSize: 10, color: "var(--text-3)" }}>per hour</p>
            </div>
          </div>

          <AnimBar pct={(d.biomass / 5) * 100} color="#4ade80" delay={0.4} />

          <div style={{ marginTop: 16 }}>
            <BarChart
              delay={0.5}
              bars={[
                { label: "Mon", value: 1.8, max: 5, color: "#4ade80" },
                { label: "Tue", value: 2.0, max: 5, color: "#4ade80" },
                { label: "Wed", value: 1.9, max: 5, color: "#4ade80" },
                { label: "Thu", value: 2.2, max: 5, color: "#4ade80" },
                { label: "Fri", value: 2.1, max: 5, color: "#22c55e" },
                { label: "Sat", value: d.biomass, max: 5, color: "#16a34a" },
              ]}
            />
          </div>
        </motion.div>

        {/* ── Mobile CTA (hidden on desktop, next to Biomass) ── */}
        <motion.button
          className="glow-btn dash-mobile-cta cursor-pointer"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "20px 16px",
            borderRadius: 20,
            background: navigating
              ? "linear-gradient(135deg, #15803d, #16a34a)"
              : "linear-gradient(135deg, #16a34a, #22c55e)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            border: "1px solid rgba(34,197,94,0.3)",
            boxShadow: "0 8px 30px rgba(34,197,94,0.3)",
            opacity: navigating ? 0.85 : 1,
          }}
          variants={rise}
          onClick={() => { setNavigating(true); router.push("/talk"); }}
          disabled={navigating}
          whileTap={navigating ? {} : { scale: 0.97 }}
        >
          {navigating ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>Talk to the Tree</span>
            </>
          )}
        </motion.button>

        {/* ── FOOTER (spans full width) ── */}
        <motion.footer
          className="card flex items-center justify-between dash-footer"
          style={{ padding: "20px 32px", gridColumn: "1 / -1" }}
          variants={rise}
        >
          {[
            { icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>, l: "CO₂ Captured", v: `${d.co2}g`, bg: "rgba(34,197,94,0.12)" },
            { icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>, l: "O₂ Released", v: `${d.o2}g`, bg: "rgba(56,189,248,0.12)" },
            { icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C8.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>, l: "Air Purified", v: `${d.air.toLocaleString()} m³`, bg: "rgba(251,191,36,0.12)" },
            { icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, l: "System Uptime", v: d.uptime, bg: "rgba(168,85,247,0.12)" },
          ].map(s => (
            <div key={s.l} className="flex items-center" style={{ gap: 14 }}>
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 42, height: 42, background: s.bg }}
              >{s.icon}</div>
              <div>
                <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 10, color: "var(--text-3)" }}>{s.l}</p>
                <p className="font-bold" style={{ fontSize: 15, marginTop: 2 }}>{s.v}</p>
              </div>
            </div>
          ))}
        </motion.footer>
      </motion.main>
    </div>
  );
}
