"use client";

import { useState, useEffect, useCallback } from "react";
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

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="bar-track" style={{ marginTop: 14 }}>
      <motion.div
        className={`bar-fill ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
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

function Metric({ icon, label, value, unit, target, badge, bar, barColor }: {
  icon: string; label: string; value: number | string; unit: string;
  target?: string; badge: string; bar?: number; barColor?: string;
}) {
  return (
    <motion.div className="card flex flex-col" style={{ padding: 28 }} variants={rise}>
      {/* Top row */}
      <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
        <div
          className="flex items-center justify-center rounded-2xl text-xl"
          style={{ width: 48, height: 48, background: "rgba(34,197,94,0.08)" }}
        >
          {icon}
        </div>
        <div className="text-right">
          <motion.span
            className="font-extrabold leading-none"
            style={{ fontSize: "2.25rem" }}
            key={String(value)}
            initial={{ opacity: 0.6, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {value}
          </motion.span>
          <span className="font-medium" style={{ fontSize: 13, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>
        </div>
      </div>

      {/* Label + bar */}
      <p className="font-medium" style={{ fontSize: 14, color: "var(--text-2)" }}>{label}</p>
      {bar !== undefined && <Bar pct={bar} color={barColor || "green"} />}

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{ marginTop: "auto", paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {target && (
          <div>
            <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 10, color: "var(--text-3)" }}>Target</p>
            <p className="font-semibold" style={{ fontSize: 14, marginTop: 2 }}>{target}</p>
          </div>
        )}
        <Badge label={badge} />
      </div>
    </motion.div>
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
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</span>
          </div>
          <p className="font-semibold" style={{ fontSize: 16, color: "var(--text-2)" }}>Loading AlgaeTree AI...</p>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Preparing your conversation</p>
        </motion.div>
      )}

      {/* ────── NAVBAR ────── */}
      <motion.nav
        className="card relative z-10 flex items-center justify-between"
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
            <span style={{ fontSize: 18 }}>🌿</span>
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

        <span className="font-semibold tabular-nums" style={{ fontSize: 15, color: "var(--text-3)" }}>{time}</span>
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
        {/* ── HERO CARD (spans 1 col, 2 rows) ── */}
        <motion.div
          className="card flex flex-col"
          style={{ padding: 32, gridRow: "1 / 3" }}
          variants={rise}
        >
          {/* Header */}
          <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <div
                className="rounded-2xl flex items-center justify-center text-xl"
                style={{ width: 48, height: 48, background: "rgba(34,197,94,0.1)" }}
              >🔬</div>
              <span className="font-bold" style={{ fontSize: 18 }}>Bio-Reactor Core</span>
            </div>
            <Badge label="Optimal" />
          </div>

          {/* Tree image */}
          <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: 8 }}>
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

          {/* CTA */}
          <motion.button
            onClick={() => { setNavigating(true); router.push("/talk"); }}
            disabled={navigating}
            className="glow-btn flex items-center justify-center cursor-pointer"
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
                <span style={{ fontSize: 20 }}>🌿</span>
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

        {/* ── pH ── */}
        <Metric
          icon="🧪" label="pH Level" value={d.ph} unit="pH"
          target="6.8 – 7.2" badge="Optimal"
          bar={(d.ph / 14) * 100} barColor="green"
        />

        {/* ── DO₂ ── */}
        <Metric
          icon="💧" label="Dissolved Oxygen" value={d.do2} unit="mg/L"
          target="6 – 10" badge="Optimal"
          bar={(d.do2 / 14) * 100} barColor="blue"
        />

        {/* ── Temp ── */}
        <Metric
          icon="🌡️" label="Temperature" value={d.temp} unit="°C"
          target="25 – 30°C" badge="Optimal"
          bar={(d.temp / 50) * 100} barColor="orange"
        />

        {/* ── Biomass + Growth (stacked) ── */}
        <motion.div className="flex flex-col" style={{ gap: 16 }} variants={rise}>
          <Metric
            icon="🧬" label="Biomass Density" value={d.biomass} unit="g/L"
            badge="Growing" bar={(d.biomass / 5) * 100} barColor="green"
          />
          <div
            className="card flex items-center justify-between"
            style={{ padding: "18px 24px" }}
          >
            <div>
              <p className="font-semibold uppercase tracking-wider" style={{ fontSize: 10, color: "var(--text-3)" }}>Growth Rate</p>
              <p className="font-bold text-green-400" style={{ fontSize: 15, marginTop: 2 }}>+{d.growth}%/hr</p>
            </div>
            <Badge label="Growing" />
          </div>
        </motion.div>

        {/* ── FOOTER (spans full width) ── */}
        <motion.footer
          className="card flex items-center justify-between dash-footer"
          style={{ padding: "20px 32px", gridColumn: "1 / -1" }}
          variants={rise}
        >
          {[
            { icon: "🫧", l: "CO₂ Captured", v: `${d.co2}g`, bg: "rgba(34,197,94,0.12)" },
            { icon: "🌬️", l: "O₂ Released", v: `${d.o2}g`, bg: "rgba(56,189,248,0.12)" },
            { icon: "🛡️", l: "Air Purified", v: `${d.air.toLocaleString()} m³`, bg: "rgba(251,191,36,0.12)" },
            { icon: "⏱️", l: "System Uptime", v: d.uptime, bg: "rgba(168,85,247,0.12)" },
          ].map(s => (
            <div key={s.l} className="flex items-center" style={{ gap: 14 }}>
              <div
                className="rounded-full flex items-center justify-center"
                style={{ width: 42, height: 42, background: s.bg, fontSize: 18 }}
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
