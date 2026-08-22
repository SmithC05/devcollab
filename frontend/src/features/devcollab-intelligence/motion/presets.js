/**
 * DevCollab Intelligence — Motion System
 * Centralized Framer Motion variants.
 * Philosophy: QUIET BY DEFAULT. STRONG WHEN STATE CHANGES.
 */

/**
 * Checks if user prefers reduced motion.
 * Import and use in motion-enabled components.
 */
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Duration constants ────────────────────────────────────────────────────
export const duration = {
  instant:  0.05,
  fast:     0.12,
  normal:   0.2,
  slow:     0.35,
  slower:   0.5,
  slowest:  0.8,
};

// ── Easing constants ─────────────────────────────────────────────────────
export const ease = {
  default:  [0.16, 1, 0.3, 1],
  in:       [0.4, 0, 1, 1],
  out:      [0, 0, 0.2, 1],
  spring:   [0.175, 0.885, 0.32, 1.275],
  linear:   'linear',
};

// ── Motion reduction helper ───────────────────────────────────────────────
const safe = (variants) =>
  prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : variants;

// ── Core presets ──────────────────────────────────────────────────────────

export const fadeIn = safe({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.normal, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: duration.fast,   ease: ease.in  } },
});

export const fadeUp = safe({
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0,  transition: { duration: duration.slow, ease: ease.default } },
  exit:    { opacity: 0, y: -6, transition: { duration: duration.fast, ease: ease.in     } },
});

export const scaleIn = safe({
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: ease.default } },
  exit:    { opacity: 0, scale: 0.98, transition: { duration: duration.fast, ease: ease.in   } },
});

export const slideIn = safe({
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: ease.default } },
  exit:    { opacity: 0, x: 16, transition: { duration: duration.fast, ease: ease.in     } },
});

export const panelEnter = safe({
  hidden:  { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: duration.slow, ease: ease.default },
  },
  exit: {
    opacity: 0, y: -10, scale: 0.99,
    transition: { duration: duration.normal, ease: ease.in },
  },
});

export const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren:   0.04,
    },
  },
};

export const layoutTransition = {
  layout: true,
  layoutId: undefined,
  transition: { duration: duration.slow, ease: ease.default },
};

// ── Intelligence-specific presets ─────────────────────────────────────────

export const metricChange = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: ease.spring } },
};

export const statusTransition = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.fast, ease: ease.spring } },
};

export const subtlePulse = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration:   2,
      ease:       'easeInOut',
      repeat:     Infinity,
      repeatType: 'loop',
    },
  },
};

export const agentActivity = {
  hidden:  { opacity: 0, x: -8 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: duration.slow, ease: ease.default },
  },
  exit: {
    opacity: 0, x: 8,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

export const scenarioTransition = {
  hidden:  { opacity: 0, y: 16, filter: 'blur(2px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: duration.slower, ease: ease.default },
  },
  exit: {
    opacity: 0, y: -8, filter: 'blur(1px)',
    transition: { duration: duration.normal, ease: ease.in },
  },
};

// ── Cinematic flow preset ─────────────────────────────────────────────────
// Intended for major state transitions (observed → analyzing → predicted etc.)
export const cinematicTransition = safe({
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: duration.slowest, ease: ease.default },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.98,
    transition: { duration: duration.slow, ease: ease.in },
  },
});
