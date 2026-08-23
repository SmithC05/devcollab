// src/components/auth/AuthShell.jsx
//
// ══ ANIMATION ARCHITECTURE ══════════════════════════════════════════════
//
// The card is a fixed container with overflow:hidden and two equal columns.
//
// Inside is a 200%-wide "track" div with three panels laid out horizontally:
//
// [ LOGIN FORM ][ INFO PANEL ][ REGISTER FORM ]
// ← 50% ──────→← 50% ───────→← 50% ──────────→
// x=0 x=100%
//
// Wait — that's 150%. Let's use:
//
// [ INFO PANEL ][ LOGIN FORM ] ← login (translateX = 0)
// [ REGISTER FORM ][ INFO PANEL ] ← register (translateX = -50%)
//
// But Info Panel is shared. We render two copies.
//
// Final clean architecture: Use two real columns in the DOM.
// Animate a "curtain" that slides ACROSS the card from one edge to the other.
// The curtain is 100% wide, 100% tall, dark.
// Content behind each column swaps instantly when the curtain covers it.
//
// LOGIN STATE:
// Left col: INFO PANEL (bg #0d0d0d)
// Right col: LOGIN FORM (bg #0a0a0a)
// Curtain: at x = -100% (off-screen left — completely hidden)
//
// WHEN USER CLICKS "Register":
// Curtain animates from x = -100% → x = 0% (slides in from left)
// At x = 50% (midpoint), swap left content to REGISTER FORM, right to INFO PANEL
// Curtain continues → x = 100% (off-screen right — hidden again)
// Final state shows: [REGISTER FORM][INFO PANEL]
//
// WHEN USER CLICKS "Sign In":
// Curtain animates from x = 100% → x = 0% → x = -100%
// Same midpoint swap
//
// This produces a seamless left→right or right→left wipe effect.

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import AuthInfoPanel from "./AuthInfoPanel";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const DURATION = 0.58; // seconds
const EASE = [0.76, 0, 0.24, 1];

// Which content each column shows
// login: left = INFO, right = LOGIN FORM
// register: left = REGISTER FORM, right = INFO
function LeftContent({ mode, onSwitchToLogin, onSwitchToRegister }) {
  if (mode === "login") {
    return (
      <div className="h-full">
        <AuthInfoPanel mode="login" />
      </div>
    );
  }
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ padding: "56px 78px 55px 78px" }}
    >
      <div className="w-full" style={{ maxWidth: 430 }}>
        <RegisterForm onSwitchToLogin={onSwitchToLogin} />
      </div>
    </div>
  );
}

function RightContent({ mode, onSwitchToLogin, onSwitchToRegister }) {
  if (mode === "login") {
    return (
      <div
        className="h-full flex items-center justify-center"
        style={{ padding: "56px 78px 55px 78px" }}
      >
        <div className="w-full" style={{ maxWidth: 430 }}>
          <LoginForm onSwitchToRegister={onSwitchToRegister} />
        </div>
      </div>
    );
  }
  return (
    <div className="h-full">
      <AuthInfoPanel mode="register" />
    </div>
  );
}

export default function AuthShell({ initialMode = "login" }) {
  // The "displayed" mode — what the columns actually show
  const [displayMode, setDisplayMode] = useState(initialMode);

  // curtainX controls the curtain position via framer-motion
  // We use a key to force re-animation when mode changes
  const [curtainAnim, setCurtainAnim] = useState({
    key: 0,
    from: "-100%",
    to: "-100%",
  });
  const [busy, setBusy] = useState(false);

  const switchMode = useCallback(
    (targetMode) => {
      if (busy || displayMode === targetMode) return;
      setBusy(true);

      const comingFromLeft = targetMode === "register"; // register means curtain comes from left
      const from = comingFromLeft ? "-100%" : "100%";
      const to = comingFromLeft ? "100%" : "-100%";

      // Phase 1: animate curtain from hidden edge → center (0%)
      // Phase 2: at midpoint, swap content
      // Phase 3: continue curtain to opposite hidden edge
      //
      // We do this by animating to 0% first, swapping, then animating to the far edge.
      // Framer Motion handles this via a keyframe sequence.

      setCurtainAnim((prev) => ({
        key: prev.key + 1,
        from,
        to,
      }));

      // Swap content at midpoint
      const midpoint = (DURATION * 1000) / 2;
      setTimeout(() => {
        setDisplayMode(targetMode);
      }, midpoint);

      // Release lock after full animation
      setTimeout(
        () => {
          setBusy(false);
        },
        DURATION * 1000 + 80,
      );
    },
    [busy, displayMode],
  );

  const toRegister = useCallback(() => switchMode("register"), [switchMode]);
  const toLogin = useCallback(() => switchMode("login"), [switchMode]);

  return (
    <div
      id="auth-card"
      className="
 relative w-full overflow-hidden
 border border-[var(--border-subtle)]
 rounded-[30px]
 shadow-xl
 bg-[var(--surface-card)]
 "
      style={{
        maxWidth: 1200,
        width: "calc(100vw - 80px)",
        height: "min(730px, calc(100vh - 80px))",
      }}
    >
      {/* ── Columns ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 h-full">
        {/* Left column */}
        <div className="relative h-full overflow-hidden bg-[var(--surface)] border-r border-[var(--border-strong)]">
          <LeftContent
            mode={displayMode}
            onSwitchToLogin={toLogin}
            onSwitchToRegister={toRegister}
          />
        </div>

        {/* Right column */}
        <div className="relative h-full overflow-hidden bg-[var(--surface)]">
          <RightContent
            mode={displayMode}
            onSwitchToLogin={toLogin}
            onSwitchToRegister={toRegister}
          />
        </div>
      </div>

      {/* ── Sliding curtain ──────────────────────────────────────────── */}
      {/*
 The curtain is a full-card-width dark panel.
 It starts off-screen on one side, slides through the card (covering
 both columns briefly), and exits off-screen on the other side.
 Content swaps at the midpoint while the curtain is fully visible.
 */}
      <motion.div
        key={curtainAnim.key}
        className="absolute inset-y-0 left-0 w-full z-50 pointer-events-none bg-[var(--surface-hover)]"
        style={{
          willChange: "transform",
        }}
        initial={{ x: curtainAnim.from }}
        animate={{ x: curtainAnim.to }}
        transition={{
          duration: DURATION,
          ease: EASE,
        }}
      >
        {/* Subtle vertical highlight on the leading edge */}
        <motion.div
          className="absolute top-0 bottom-0 w-[1px]"
          style={{
            // Leading edge changes based on direction
            ...(curtainAnim.to === "100%" ? { right: 0 } : { left: 0 }),
            background:
              "linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
