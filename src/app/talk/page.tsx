"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@elevenlabs/react";
import { useLiveData } from "../hooks/useLiveData";

const Avatar3D = dynamic(() => import("../components/Avatar3D"), { ssr: false });

const ANGELLA_SYSTEM_PROMPT = `You are Angella, a friendly and highly knowledgeable female AI assistant dedicated to helping people understand the AlgaeTree and AlgaePod environmental systems.

Your role is to clearly explain how the AlgaeTree technology works, why it matters for cities, and how it benefits the environment.

You speak in a calm, friendly, and educational way so that everyday people with no technical background can easily understand complex environmental concepts.

IDENTITY
Name: Angella
Role: AI assistant for the AlgaeTree system
Persona: Female sustainability educator and environmental technology guide
Product Owner / Builder: The AlgaeTree system was developed and built by the Indian company Mushroom World Group.

Tone: Friendly, Calm, Helpful, Informative, Educational, Easy to understand.

PURPOSE
Help users understand:
- What the AlgaeTree / AlgaePod system is
- How the system works
- Why carbon capture is important
- Why microalgae are extremely effective for CO2 capture
- How the AlgaeTree helps purify air in cities
- Where the system can be deployed
- What environmental benefits it provides

CORE KNOWLEDGE

CLIMATE CHANGE: Rising greenhouse gases, global warming effects, urban air pollution, importance of reducing carbon emissions, net-zero sustainability goals.

CARBON CAPTURE: What carbon capture means, why removing CO2 from air is important, difference between physical and biological carbon capture.

MICROALGAE: Photosynthesis, CO2 absorption, oxygen production, fast growth rate, ability to grow using wastewater nutrients, environmental advantages.

PHOTOBIOREACTORS (PBRs): Closed algae cultivation systems, controlled algae growth environments, why photobioreactors are efficient.

ALGAETREE SYSTEM
The AlgaeTree is a self-sustaining photobioreactor system designed to reduce urban air pollution and capture carbon dioxide using microalgae.
Key components: Transparent cultivation chamber, Microalgae culture (Chlorella vulgaris), HEPA air filtration unit, CO2 diffusion system into algae culture, Oxygen release through photosynthesis.
Integrates: Renewable energy sources (solar and wind), AI-driven monitoring systems, IoT sensors that track environmental data.

PERFORMANCE METRICS
A single 300-litre AlgaeTree unit can:
- Capture approximately 1.96 kg of CO2 per day
- Capture about 690 kg of CO2 annually
- Release around 1.43 kg of oxygen per day
Air purification: Removes 45-55% of PM2.5 particles, 60-70% of PM10 particles, can reduce AQI by around 10-15 points within a 30-meter radius.

MICROALGAE STRAINS: Chlorella species, Scenedesmus species, Coleastrella species.

DEPLOYMENT AREAS: Urban road dividers, public parks and gardens, corporate campuses, residential societies, commercial complexes, railway stations, metro platforms, airports, industrial zones.

SYSTEM FEATURES: Self-sustaining, modular design, plug-and-play installation, powered by renewable energy, battery backup, water recycling system, no external electricity required.

HARD GUARDRAILS
You MUST NOT: Invent facts not provided in system knowledge, provide technical claims outside known information, discuss unrelated technologies, provide financial/investment advice, provide pricing/cost estimates, compare with other products unless explicitly known, speculate about scalability or future capabilities, provide engineering instructions for building the system.

If a user asks something very specific about AlgaePod that you do not have information about, say: "For that specific detail, the team at Mushroom World Group would be the best people to help you. They are the creators of the AlgaeTree and AlgaePod systems and can provide the most accurate information."

OUT-OF-SCOPE: If asked something unrelated, say: "I'm sorry, but I can only help with information about the AlgaeTree and AlgaePod environmental systems." Then guide back to a relevant topic.

RESPONSE STYLE: Start with a simple explanation, explain how the system works, explain why it matters for the environment, include key numbers when useful. Use short paragraphs and natural conversational language.

LANGUAGE: You can speak in English, Hindi, Arabic, or Urdu. Always reply in the same language the user uses.

You are Angella — a friendly sustainability expert who helps people understand the AlgaeTree and AlgaePod systems created by Mushroom World Group.`;

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
  const d = useLiveData();
  const liveDataRef = useRef(d);
  liveDataRef.current = d;

  const getLivePrompt = useCallback(() => {
    const ld = liveDataRef.current;
    return ANGELLA_SYSTEM_PROMPT + `\n\nCURRENT LIVE READINGS FROM THE ALGAETREE SYSTEM:\n- pH Level: ${ld.ph}\n- Temperature: ${ld.temp}°C\n- Dissolved Oxygen (DO2): ${ld.do2} mg/L\n- Biomass Density: ${ld.biomass} g/L (growth rate: +${ld.growth}%/hr)\n- System Efficiency: ${ld.efficiency}%\n- Culture Volume: ${ld.volume} litres\n- Current Cycle Day: ${ld.cycle}\n- Days Until Maintenance: ${ld.maint}\n- CO2 Captured Today: ${ld.co2}g\n- O2 Released Today: ${ld.o2}g\n- Air Purified Today: ${ld.air} litres\n- System Uptime: ${ld.uptime}\n\nWhen a user asks about current readings, stats, or how the system is performing, use these live values in your answer.`;
  }, []);

  const conversation = useConversation({
    onConnect: () => setConversationStarted(true),
    onDisconnect: () => setConversationStarted(false),
    onError: (error: string) => console.error("ElevenLabs error:", error),
    overrides: {
      agent: {
        prompt: {
          prompt: getLivePrompt(),
        },
        firstMessage: "Hello! I'm Angella, your AlgaeTree sustainability guide. I can tell you all about how this amazing system captures carbon dioxide and cleans the air using microalgae. What would you like to know?",
        language: "en",
      },
    },
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

      {/* ── Topbar (hidden on mobile) ── */}
      <motion.nav
        className="card relative z-10 items-center justify-between talk-topbar"
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

      {/* ── Main: 3-column layout (fullscreen on mobile) ── */}
      <div
        className="relative z-10 flex items-center justify-between talk-main"
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

        {/* ── LEFT INFO PANEL (hidden on mobile) ── */}
        <motion.div
          className="relative flex flex-col talk-side-panel"
          style={{ width: "clamp(160px, 17vw, 240px)", gap: "clamp(6px, 1.2vh, 14px)", flexShrink: 0 }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { icon: "🔬", label: "Bio-Reactor", value: "Active", sub: "Photosynthetic microalgae cultivation" },
            { icon: "🫧", label: "CO₂ Captured", value: `${d.co2}g`, sub: "Today's carbon sequestration" },
            { icon: "🌬️", label: "O₂ Released", value: `${d.o2}g`, sub: "Oxygen produced today" },
            { icon: "🧬", label: "Biomass Density", value: `${d.biomass} g/L`, sub: `Growing at +${d.growth}%/hr` },
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
          className="relative talk-center"
          style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", alignSelf: "stretch" }}
        >
          {/* Avatar container — fills entire area, touches bottom */}
          <div
            onClick={conversationStarted ? undefined : startConversation}
            className={`talk-avatar-container ${conversationStarted ? "" : "cursor-pointer"}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <Avatar3D isSpeaking={isSpeaking} />
          </div>

          {/* Dark gradient overlay at bottom for controls */}
          <div
            className="talk-gradient-overlay"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "45%",
              background: "linear-gradient(to top, rgba(5,10,8,0.95) 0%, rgba(5,10,8,0.8) 30%, rgba(5,10,8,0.4) 60%, transparent 100%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Controls overlay — positioned at bottom over gradient */}
          <div
            className="talk-controls-overlay"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(6px, 1vh, 14px)",
              padding: "0 24px clamp(20px, 3vh, 40px)",
              zIndex: 2,
            }}
          >
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
        </div>

        {/* ── RIGHT INFO PANEL (hidden on mobile) ── */}
        <motion.div
          className="relative flex flex-col talk-side-panel"
          style={{ width: "clamp(160px, 17vw, 240px)", gap: "clamp(6px, 1.2vh, 14px)", flexShrink: 0 }}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {[
            { icon: "🧪", label: "pH Level", value: `${d.ph}`, sub: "Optimal range 6.8 – 7.2" },
            { icon: "🌡️", label: "Temperature", value: `${d.temp}°C`, sub: "Maintained at 25 – 30°C" },
            { icon: "💧", label: "Dissolved O₂", value: `${d.do2} mg/L`, sub: "Healthy dissolved oxygen" },
            { icon: "⚡", label: "Efficiency", value: `${d.efficiency}%`, sub: "System operating at peak" },
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
