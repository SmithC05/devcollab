import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function HeroOverlay() {
  const shouldReduceMotion = useReducedMotion();

  // Mouse tilt logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the motion values
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Map mouse position (-0.5 to 0.5) to a subtle rotation (-14deg to 14deg)
  const rotateX = useTransform(springY, [-0.5, 0.5], [14, -14]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse coordinates to center of screen: [-0.5, 0.5]
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    if (!shouldReduceMotion) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, shouldReduceMotion]);

  // CSS clamp for massive responsive font size
  const wordmarkStyle = {
    fontSize: 'clamp(3rem, 12vw, 12rem)',
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
  };

  // Levitation Animation
  const levitationAnimation = shouldReduceMotion ? {} : {
    y: [0, -14, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity
    }
  };

  // Shadow Animation (shrinks and fades as text rises)
  const shadowAnimation = shouldReduceMotion ? {} : {
    scale: [1, 0.7, 1],
    opacity: [0.6, 0.2, 0.6],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity
    }
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-center items-center overflow-hidden">
      
      {/* 
        CENTERPIECE 
      */}
      <div 
        className="relative w-full flex flex-col items-center justify-center pointer-events-auto h-full"
        style={{ perspective: '1000px' }}
      >
        {/* Tilting Container */}
        <motion.div 
          className="relative flex flex-col items-center justify-center w-full"
          style={{ 
            rotateX: shouldReduceMotion ? 0 : rotateX, 
            rotateY: shouldReduceMotion ? 0 : rotateY,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Levitating Wordmark */}
          <motion.div 
            className="relative flex flex-col items-center"
            animate={levitationAnimation}
            style={{ transform: 'translateZ(50px)' }}
          >
            <h1 
              className="font-display font-bold text-center chrome-text select-none m-0 pb-4"
              style={wordmarkStyle}
            >
              DEV COLLAB
            </h1>
          </motion.div>
          
          {/* Faint elliptical orbit ring beneath wordmark */}
          <div 
            className="absolute top-1/2 left-1/2 w-[110%] md:w-[70%] h-[250px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] border-[1px] border-[#6fa8ff]/10 pointer-events-none"
            style={{ transform: 'translateZ(-50px) rotateX(75deg)' }}
          />

          {/* Dynamic Drop Shadow beneath levitating text */}
          <motion.div 
            className="absolute top-[60%] left-1/2 w-[50%] h-[80px] -translate-x-1/2 rounded-[100%] pointer-events-none"
            style={{ 
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)',
              transform: 'translateZ(-20px) rotateX(75deg)' 
            }}
            animate={shadowAnimation}
          />
        </motion.div>

        {/* Copy Block & CTAs (Not tilted) */}
        <div className="mt-8 md:mt-16 text-center max-w-[600px] px-6 relative z-20 flex flex-col items-center">
          <p className="font-mono text-[10px] md:text-[11px] text-[#6fa8ff] tracking-[0.25em] uppercase mb-6">
            Engineering Decision Intelligence Platform
          </p>
          <div className="font-body text-[#8b8d94] text-sm md:text-base mb-10 space-y-1">
            <p>Understand engineering reality.</p>
            <p>Simulate every possibility.</p>
            <p className="text-[#e9eaec] font-medium">Recommend the best decision.</p>
          </div>

          <div className="flex justify-center">
            <Link to="/login" className="px-10 py-3.5 bg-[#e9eaec] text-[#08090b] rounded-full font-medium text-sm hover:bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(111,168,255,0.25)] active:scale-95 pointer-events-auto">
              Get Started &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="absolute bottom-6 font-mono text-[10px] tracking-widest text-[#8b8d94]/50 uppercase">
        Scroll to explore
      </div>

    </div>
  );
}
