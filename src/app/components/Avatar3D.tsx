"use client";

import { useRef, useEffect, Suspense, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const AVATAR_URL =
  "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes&quality=high&textureAtlas=1024";

/* ── Error boundary ── */
class AvatarErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/*
 * ── Coarticulation-based lip sync engine ──
 *
 * Instead of cycling sine waves, this simulates how speech actually works:
 * 1. Words are sequences of phonemes (consonant-vowel patterns)
 * 2. Each phoneme maps to a specific set of morph targets with weights
 * 3. Phonemes blend into each other (coarticulation) — the mouth anticipates the next shape
 * 4. Between words there are brief closures (jaw nearly shut)
 * 5. Speaking tempo varies naturally
 */

// Phoneme definitions — each maps to the Oculus/ARKit viseme morph targets
// Weights are tuned for natural-looking positions
interface Phoneme {
  targets: Record<string, number>; // morph target name → weight
  hold: number; // how long to hold in seconds
}

const PHONEMES: Phoneme[] = [
  // Bilabial closure (P, B, M) — lips pressed
  { targets: { viseme_PP: 0.7, jawOpen: 0.02 }, hold: 0.06 },
  // Open vowel (AA) — wide mouth
  { targets: { viseme_aa: 0.65, jawOpen: 0.38 }, hold: 0.11 },
  // Mid vowel (E) — slightly spread
  { targets: { viseme_E: 0.6, jawOpen: 0.22 }, hold: 0.09 },
  // Rounded vowel (O) — lips rounded
  { targets: { viseme_O: 0.6, jawOpen: 0.3 }, hold: 0.1 },
  // Tight rounded (U) — small opening
  { targets: { viseme_U: 0.55, jawOpen: 0.12 }, hold: 0.08 },
  // Fricative (F, V) — lower lip to teeth
  { targets: { viseme_FF: 0.6, jawOpen: 0.08 }, hold: 0.06 },
  // Sibilant (S, Z) — teeth nearly closed
  { targets: { viseme_SS: 0.5, jawOpen: 0.05 }, hold: 0.07 },
  // Dental (TH) — tongue to teeth
  { targets: { viseme_TH: 0.45, jawOpen: 0.1 }, hold: 0.06 },
  // Alveolar (T, D, N) — tongue tap
  { targets: { viseme_DD: 0.4, jawOpen: 0.15 }, hold: 0.05 },
  // Velar (K, G) — back tongue
  { targets: { viseme_kk: 0.45, jawOpen: 0.18 }, hold: 0.06 },
  // Liquid (R, L) — slight opening
  { targets: { viseme_RR: 0.35, jawOpen: 0.2 }, hold: 0.08 },
  // Nasal (N, NG) — relaxed
  { targets: { viseme_nn: 0.3, jawOpen: 0.1 }, hold: 0.07 },
  // Affricate (CH, J)
  { targets: { viseme_CH: 0.5, jawOpen: 0.12 }, hold: 0.06 },
];

// Pre-built "word" patterns — sequences of phoneme indices that feel like real syllables
const WORD_PATTERNS = [
  [1, 8, 2, 5],        // "ah-d-eh-f"  (like "adverb")
  [0, 1, 9, 2],        // "p-ah-k-eh"  (like "packet")
  [6, 3, 10, 2],       // "s-oh-r-eh"  (like "sorry")
  [5, 3, 10],          // "f-oh-r"     (like "for")
  [8, 4, 6],           // "d-oo-s"     (like "deuce")
  [1, 11, 8],          // "ah-n-d"     (like "and")
  [7, 2],              // "th-eh"      (like "the")
  [9, 3, 0, 1],        // "k-oh-p-ah"  (like "copper")
  [2, 9, 6, 8],        // "eh-k-s-d"   (like "extend")
  [0, 10, 3, 6, 2, 6], // "p-r-oh-s-eh-s" (like "process")
  [1, 10],             // "ah-r"       (like "are")
  [12, 2, 9],          // "ch-eh-k"    (like "check")
  [8, 1, 8, 1],        // "d-ah-t-ah"  (like "data")
  [5, 10, 3, 0],       // "f-r-oh-p"   (free-form)
  [11, 3, 8],          // "n-oh-d"     (like "node")
];

// Pause between words (mouth nearly closed)
const WORD_GAP: Phoneme = { targets: { jawOpen: 0.01 }, hold: 0.1 };

class LipSyncEngine {
  private wordQueue: number[] = [];
  private currentWord: Phoneme[] = [];
  private phonemeIdx = 0;
  private phonemeTimer = 0;
  private prevTargets: Record<string, number> = {};
  private currentTargets: Record<string, number> = {};
  private inGap = false;
  private gapTimer = 0;
  private rng = 0;

  // Simple deterministic pseudo-random
  private rand() {
    this.rng = (this.rng * 16807 + 7) % 2147483647;
    return (this.rng % 1000) / 1000;
  }

  update(dt: number, isSpeaking: boolean): Record<string, number> {
    const result: Record<string, number> = {};

    if (!isSpeaking) {
      // Decay all to zero
      for (const key of Object.keys(this.currentTargets)) {
        this.currentTargets[key] = (this.currentTargets[key] || 0) * 0.88;
        if (this.currentTargets[key] < 0.005) this.currentTargets[key] = 0;
        result[key] = this.currentTargets[key];
      }
      this.currentWord = [];
      this.phonemeIdx = 0;
      this.wordQueue = [];
      return result;
    }

    // In word gap
    if (this.inGap) {
      this.gapTimer -= dt;
      if (this.gapTimer <= 0) {
        this.inGap = false;
        this.pickNextWord();
      }
      // Blend toward closed mouth
      for (const key of Object.keys(this.currentTargets)) {
        const target = WORD_GAP.targets[key] || 0;
        this.currentTargets[key] += (target - (this.currentTargets[key] || 0)) * 0.2;
        result[key] = this.currentTargets[key];
      }
      return result;
    }

    // Need a new word?
    if (this.currentWord.length === 0) {
      this.pickNextWord();
    }

    // Advance phoneme timer
    this.phonemeTimer -= dt;
    if (this.phonemeTimer <= 0 && this.currentWord.length > 0) {
      this.phonemeIdx++;
      if (this.phonemeIdx >= this.currentWord.length) {
        // Word finished — enter gap
        this.inGap = true;
        this.gapTimer = 0.04 + this.rand() * 0.12; // 40-160ms gap
        this.currentWord = [];
        this.phonemeIdx = 0;
      } else {
        this.prevTargets = { ...this.currentTargets };
        this.phonemeTimer = this.currentWord[this.phonemeIdx].hold * (0.85 + this.rand() * 0.3);
      }
    }

    // Interpolate toward current phoneme targets
    if (this.currentWord.length > 0 && this.phonemeIdx < this.currentWord.length) {
      const phoneme = this.currentWord[this.phonemeIdx];
      const allKeys = new Set([
        ...Object.keys(this.currentTargets),
        ...Object.keys(phoneme.targets),
      ]);
      // Coarticulation blend factor — how fast we transition (0.18 = smooth, 0.4 = snappy)
      const blend = 0.22;
      for (const key of allKeys) {
        const target = phoneme.targets[key] || 0;
        const current = this.currentTargets[key] || 0;
        this.currentTargets[key] = current + (target - current) * blend;
        result[key] = this.currentTargets[key];
      }
    }

    return result;
  }

  private pickNextWord() {
    if (this.wordQueue.length === 0) {
      // Shuffle and refill
      this.wordQueue = Array.from({ length: WORD_PATTERNS.length }, (_, i) => i);
      for (let i = this.wordQueue.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [this.wordQueue[i], this.wordQueue[j]] = [this.wordQueue[j], this.wordQueue[i]];
      }
    }
    const wordIdx = this.wordQueue.pop()!;
    this.currentWord = WORD_PATTERNS[wordIdx].map((pi) => PHONEMES[pi]);
    this.phonemeIdx = 0;
    this.phonemeTimer = this.currentWord[0].hold * (0.85 + this.rand() * 0.3);
    this.prevTargets = { ...this.currentTargets };
  }
}

/* ── 3D Model ── */
function AvatarModel({ isSpeaking }: { isSpeaking: boolean }) {
  const { scene } = useGLTF(AVATAR_URL);
  const morphMeshes = useRef<THREE.Mesh[]>([]);
  const headBone = useRef<THREE.Object3D | null>(null);
  const lipSync = useRef(new LipSyncEngine());
  const prevTime = useRef(0);

  useEffect(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        // Enhance skin textures
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat) => {
            const m = mat as THREE.MeshStandardMaterial;
            if (m.map) {
              m.map.anisotropy = 16;
              m.map.minFilter = THREE.LinearMipmapLinearFilter;
              m.map.magFilter = THREE.LinearFilter;
              m.map.needsUpdate = true;
            }
            if (m.normalMap) {
              m.normalScale = new THREE.Vector2(1.2, 1.2);
              m.normalMap.anisotropy = 16;
              m.normalMap.needsUpdate = true;
            }
            // Skin-like roughness
            m.roughness = Math.max(m.roughness ?? 0.5, 0.45);
            m.envMapIntensity = 0.4;
            m.needsUpdate = true;
          });
        }
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          meshes.push(mesh);
        }
      }
      if (obj.name === "Head") headBone.current = obj;
    });
    morphMeshes.current = meshes;
  }, [scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = t - prevTime.current;
    prevTime.current = t;

    // Subtle idle head sway
    if (headBone.current) {
      headBone.current.rotation.y = Math.sin(t * 0.3) * 0.04;
      headBone.current.rotation.x = Math.sin(t * 0.4 + 1) * 0.02;
      // Slight nod when speaking
      if (isSpeaking) {
        headBone.current.rotation.x += Math.sin(t * 1.8) * 0.012;
        headBone.current.rotation.y += Math.sin(t * 1.2 + 0.5) * 0.015;
      }
    }

    // Get lip sync targets
    const lsTargets = lipSync.current.update(dt, isSpeaking);

    morphMeshes.current.forEach((mesh) => {
      const d = mesh.morphTargetDictionary!;
      const inf = mesh.morphTargetInfluences!;

      // Blinking (~every 3-4s with slight variation)
      const blinkCycle = 3.2 + Math.sin(t * 0.13) * 0.8;
      const blinkPhase = (t % blinkCycle) / blinkCycle;
      const blinkVal =
        blinkPhase > 0.96 ? 1 : blinkPhase > 0.94 ? (blinkPhase - 0.94) * 50 : 0;
      if (d.eyeBlinkLeft !== undefined) inf[d.eyeBlinkLeft] = blinkVal;
      if (d.eyeBlinkRight !== undefined) inf[d.eyeBlinkRight] = blinkVal;

      // Apply lip-sync morph targets
      for (const [name, weight] of Object.entries(lsTargets)) {
        if (d[name] !== undefined) {
          inf[d[name]] = weight;
        }
      }

      if (isSpeaking) {
        // Micro-expressions that accompany speech
        if (d.mouthSmileLeft !== undefined)
          inf[d.mouthSmileLeft] = 0.04 + Math.sin(t * 0.9) * 0.03;
        if (d.mouthSmileRight !== undefined)
          inf[d.mouthSmileRight] = 0.04 + Math.sin(t * 0.9 + 0.3) * 0.03;
        if (d.browInnerUp !== undefined)
          inf[d.browInnerUp] = Math.max(0, Math.sin(t * 1.5) * 0.08);
        if (d.browOuterUpLeft !== undefined)
          inf[d.browOuterUpLeft] = Math.max(0, Math.sin(t * 1.1 + 1.0) * 0.04);
        if (d.browOuterUpRight !== undefined)
          inf[d.browOuterUpRight] = Math.max(0, Math.sin(t * 1.1 + 1.2) * 0.04);
        if (d.cheekSquintLeft !== undefined)
          inf[d.cheekSquintLeft] = Math.max(0, Math.sin(t * 1.3) * 0.04);
        if (d.cheekSquintRight !== undefined)
          inf[d.cheekSquintRight] = Math.max(0, Math.sin(t * 1.3 + 0.15) * 0.04);
        if (d.noseSneerLeft !== undefined)
          inf[d.noseSneerLeft] = Math.max(0, Math.sin(t * 2.3) * 0.02);
        if (d.noseSneerRight !== undefined)
          inf[d.noseSneerRight] = Math.max(0, Math.sin(t * 2.3 + 0.1) * 0.02);
      } else {
        // Idle — gentle resting expression
        const idleTargets = [
          "mouthSmileLeft", "mouthSmileRight", "browInnerUp",
          "browOuterUpLeft", "browOuterUpRight",
          "cheekSquintLeft", "cheekSquintRight",
          "noseSneerLeft", "noseSneerRight",
        ];
        idleTargets.forEach((name) => {
          if (d[name] !== undefined && inf[d[name]] > 0.001) {
            inf[d[name]] *= 0.9;
          }
        });
      }
    });
  });

  return <primitive object={scene} position={[0, -1.62, 0]} rotation={[-0.06, 0, 0]} />;
}

/* ── Loading placeholder ── */
function Loader() {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ width: 560, height: 680, gap: 12 }}
    >
      <div
        className="pulse-dot rounded-full"
        style={{ width: 14, height: 14, background: "#4ade80" }}
      />
      <span style={{ fontSize: 13, color: "var(--text-3)" }}>Loading avatar…</span>
    </div>
  );
}

/* ── Fallback orb if GLB fails ── */
function FallbackOrb({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center ${
        isSpeaking ? "orb-speaking" : "orb-idle"
      }`}
      style={{
        width: 200,
        height: 200,
        background: "radial-gradient(circle at 30% 30%, #1a3a2a, #0d1f17, #081210)",
        border: "2px solid rgba(34,197,94,0.25)",
        boxShadow: isSpeaking
          ? "0 0 80px rgba(34,197,94,0.2)"
          : "0 0 40px rgba(34,197,94,0.08)",
      }}
    >
      <span style={{ fontSize: 64 }}>🌿</span>
    </div>
  );
}

/* ── Public component ── */
export default function Avatar3D({ isSpeaking }: { isSpeaking: boolean }) {
  return (
    <AvatarErrorBoundary fallback={<FallbackOrb isSpeaking={isSpeaking} />}>
      <Suspense fallback={<Loader />}>
        <div style={{ width: 560, height: 680, borderRadius: 28, overflow: "hidden" }}>
          <Canvas
            camera={{ position: [0, 0.22, 0.95], fov: 26 }}
            gl={{ alpha: true, antialias: true }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.15;
              gl.outputColorSpace = THREE.SRGBColorSpace;
            }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[2, 3, 3]} intensity={1.0} />
            <directionalLight position={[-1.5, 2, 1]} intensity={0.35} color="#ffeedd" />
            <directionalLight position={[-2, 1, -1]} intensity={0.15} color="#4ade80" />
            <pointLight position={[0, 0.3, 0.9]} intensity={0.3} color="#ffe4c9" />
            <AvatarModel isSpeaking={isSpeaking} />
          </Canvas>
        </div>
      </Suspense>
    </AvatarErrorBoundary>
  );
}

