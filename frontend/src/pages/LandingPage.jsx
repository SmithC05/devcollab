import React, { useEffect } from 'react';
import HeroScene from '../components/landing/HeroScene';
import HeroOverlay from '../components/landing/HeroOverlay';

export default function LandingPage() {
  useEffect(() => {
    const originalBackground = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;
    document.body.style.backgroundColor = '#08090b';
    document.body.style.color = '#e9eaec';

    return () => {
      document.body.style.backgroundColor = originalBackground;
      document.body.style.color = originalColor;
    };
  }, []);

  return (
    <div className="bg-[#08090b] text-[#e9eaec] h-screen w-full overflow-hidden font-sans relative selection:bg-white/20">
      <div className="hero-glow-top" />
      <div className="hero-glow-bottom" />
      
      <main className="w-full h-full relative flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <HeroScene />
        </div>
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
          <HeroOverlay />
        </div>
      </main>
    </div>
  );
}
