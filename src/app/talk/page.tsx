"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@elevenlabs/react";

const Avatar3D = dynamic(() => import("../components/Avatar3D"), { ssr: false });

function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-center h-8" style={{ gap: 5 }}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            active ? "bg-green-400 sound-bar" : "bg-gray-700"
          }`}
          style={{
            width: 4,
            height: active ? undefined : 8,
            animationDelay: active ? `${i * 0.1}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function TalkPage() {
  const router = useRouter();
  const [conversationStarted, setConversationStarted] = useState(false);

  const conversation = useConversation({
    onConnect: () => setConversationStarted(true),
    onDisconnect: () => setConversationStarted(false),
    onError: (error: string) => console.error("ElevenLabs error:", error),
  });

  const isSpeaking = conversation.isSpeaking;

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: "agent_5401kkk79wrxf6krs5t8gby7y2ah",
        connectionType: "websocket",
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error("Failed to end conversation:", err);
    }
  }, [conversation]);

  // Auto-start on mount
  useEffect(() => {
    startConversation();
    return () => { conversation.endSession().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Ambient BG */}
      <div className="ambient-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ── Topbar ── */}
      <motion.nav
        className="card relative z-10 flex items-center justify-between"
        style={{ margin: "20px 24px 0", padding: "14px 28px", borderRadius: 20 }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            onClick={() => { if (conversationStarted) endConversation(); router.push("/"); }}
            className="flex items-center justify-center rounded-xl transition-colors cursor-pointer"
            style={{
              width: 36, height: 36,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-3)",
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            className="rounded-full flex items-center justify-center"
            style={{ width: 36, height: 36, background: "rgba(34,197,94,0.15)" }}
          >
            <span style={{ fontSize: 18 }}>🌿</span>
          </div>
          <span className="font-bold" style={{ fontSize: 18 }}>AlgaeTree</span>
        </div>

        {conversationStarted && (
          <motion.div
            className="flex items-center rounded-full"
            style={{ gap: 8, padding: "8px 16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="rounded-full animate-pulse" style={{ width: 8, height: 8, background: "#22c55e" }} />
            <span className="font-medium" style={{ fontSize: 12, color: "#4ade80" }}>Live Conversation</span>
          </motion.div>
        )}
      </motion.nav>

      {/* ── Main: 3-column layout ── */}
      <div
        className="relative z-10 flex items-center justify-between"
        style={{ flex: 1, minHeight: 0, padding: "0 clamp(16px, 3vw, 56px)" }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full blur-3xl transition-all duration-1000"
            style={{
              width: "30vw", height: "30vw", maxWidth: 420, maxHeight: 420,
              background: isSpeaking
                ? "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)"
                : "radial-gradient(circle, rgba(34,197,94,0.06), transparent 70%)",
            }}
          />
        </div>

        {/* ── LEFT INFO PANEL ── */}
        <motion.div
          className="relative flex flex-col"
          style={{ width: "clamp(160px, 17vw, 240px)", gap: "clamp(6px, 1.2vh, 14px)", flexShrink: 0 }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { icon: "🔬", label: "Bio-Reactor", value: "Active", sub: "Photosynthetic microalgae cultivation" },
            { icon: "🫧", label: "CO₂ Captured", value: "48.2g", sub: "Today's carbon sequestration" },
            { icon: "🌬️", label: "O₂ Released", value: "36.1g", sub: "Oxygen produced today" },
            { icon: "🧬", label: "Biomass Density", value: "2.4 g/L", sub: "Growing at +2.1%/hr" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="card"
              style={{ padding: "clamp(10px, 1.4vh, 16px) clamp(12px, 1.2vw, 18px)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: "clamp(4px, 0.6vh, 8px)" }}>
                <span style={{ fontSize: "clamp(14px, 1.4vw, 18px)" }}>{item.icon}</span>
                <span className="font-bold" style={{ fontSize: "clamp(11px, 1vw, 13px)", color: "var(--text-2)" }}>{item.label}</span>
              </div>
              <p className="font-extrabold" style={{ fontSize: "clamp(16px, 1.8vw, 22px)", color: "#4ade80" }}>{item.value}</p>
              <p style={{ fontSize: "clamp(9px, 0.85vw, 11px)", color: "var(--text-3)", marginTop: "clamp(2px, 0.4vh, 4px)", lineHeight: 1.4 }}>{item.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── CENTER: Avatar + controls ── */}
        <div
          className="relative flex flex-col items-center"
          style={{ flex: 1, minWidth: 0, minHeight: 0, gap: "clamp(8px, 1.2vh, 20px)", padding: "0 clamp(8px, 1.5vw, 24px)" }}
        >
          {/* Avatar container — fluid sizing */}
          <div
            onClick={conversationStarted ? undefined : startConversation}
            className={conversationStarted ? "" : "cursor-pointer"}
            style={{
              width: "clamp(280px, 32vw, 520px)",
              height: "clamp(300px, 52vh, 600px)",
              flexShrink: 1,
              minHeight: 0,
            }}
          >
            <Avatar3D isSpeaking={isSpeaking} />
          </div>

          <SoundWave active={isSpeaking} />

          <AnimatePresence mode="wait">
            <motion.div
              key={conversationStarted ? "on" : "off"}
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!conversationStarted ? (
                <>
                  <p className="font-semibold" style={{ fontSize: "clamp(14px, 1.4vw, 20px)", color: "var(--text-2)" }}>Connecting...</p>
                  <p style={{ fontSize: "clamp(11px, 1vw, 14px)", color: "var(--text-3)", marginTop: 4 }}>Setting up your conversation with AlgaeTree AI</p>
                </>
              ) : (
                <>
                  <p className="font-semibold" style={{ fontSize: "clamp(14px, 1.4vw, 20px)", color: isSpeaking ? "#4ade80" : "var(--text-2)" }}>
                    {isSpeaking ? "AlgaeTree is speaking..." : "Listening..."}
                  </p>
                  <p style={{ fontSize: "clamp(11px, 1vw, 14px)", color: "var(--text-3)", marginTop: 4 }}>
                    {isSpeaking ? "Processing your request" : "Speak naturally, I'm listening"}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center" style={{ gap: 16 }}>
            {!conversationStarted ? (
              <motion.button
                onClick={startConversation}
                className="flex items-center cursor-pointer font-semibold text-white"
                style={{
                  gap: 10, padding: "clamp(10px, 1.2vh, 16px) clamp(20px, 2.5vw, 36px)", borderRadius: 50,
                  background: "linear-gradient(135deg, #16a34a, #22c55e)",
                  boxShadow: "0 8px 30px rgba(34,197,94,0.3)",
                  border: "none", fontSize: "clamp(12px, 1.1vw, 15px)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                Reconnect
              </motion.button>
            ) : (
              <motion.button
                onClick={endConversation}
                className="flex items-center cursor-pointer font-semibold"
                style={{
                  gap: 10, padding: "clamp(10px, 1.2vh, 16px) clamp(20px, 2.5vw, 36px)", borderRadius: 50,
                  background: "rgba(239,68,68,0.12)", color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.25)", fontSize: "clamp(12px, 1.1vw, 15px)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                End Conversation
              </motion.button>
            )}
          </div>
        </div>

        {/* ── RIGHT INFO PANEL ── */}
        <motion.div
          className="relative flex flex-col"
          style={{ width: "clamp(160px, 17vw, 240px)", gap: "clamp(6px, 1.2vh, 14px)", flexShrink: 0 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { icon: "🧪", label: "pH Level", value: "6.96", sub: "Optimal range 6.8 – 7.2" },
            { icon: "🌡️", label: "Temperature", value: "28.6°C", sub: "Maintained at 25 – 30°C" },
            { icon: "💧", label: "Dissolved O₂", value: "7.2 mg/L", sub: "Healthy dissolved oxygen" },
            { icon: "⚡", label: "Efficiency", value: "98%", sub: "System operating at peak" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="card"
              style={{ padding: "clamp(10px, 1.4vh, 16px) clamp(12px, 1.2vw, 18px)" }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <div className="flex items-center" style={{ gap: 8, marginBottom: "clamp(4px, 0.6vh, 8px)" }}>
                <span style={{ fontSize: "clamp(14px, 1.4vw, 18px)" }}>{item.icon}</span>
                <span className="font-bold" style={{ fontSize: "clamp(11px, 1vw, 13px)", color: "var(--text-2)" }}>{item.label}</span>
              </div>
              <p className="font-extrabold" style={{ fontSize: "clamp(16px, 1.8vw, 22px)", color: "#4ade80" }}>{item.value}</p>
              <p style={{ fontSize: "clamp(9px, 0.85vw, 11px)", color: "var(--text-3)", marginTop: "clamp(2px, 0.4vh, 4px)", lineHeight: 1.4 }}>{item.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
