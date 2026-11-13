'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function CardDrawGraphic({ progress }: { progress: MotionValue<number> }) {
  // Card slides out from the deck, lifts upward, tilts, and hovers prominently like a summoned TCG card
  const x = useTransform(progress, [0, 0.4, 0.8, 1], [0, 0, -50, -50]);
  const y = useTransform(progress, [0, 0.3, 0.7, 1], [0, 15, -100, -100]);
  const rotate = useTransform(progress, [0, 0.3, 0.7, 1], [0, 0, -10, -10]);
  const scale = useTransform(progress, [0, 0.3, 0.7, 1], [0.92, 0.98, 1.08, 1.08]);

  return (
    <div style={{ position: 'relative', width: 220, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Deck Backing Stack (TCG Card Backs) */}
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 256,
          borderRadius: 12,
          backgroundColor: '#0f100c',
          border: '2px solid rgba(24, 100, 255, 0.25)',
          transform: 'translate(8px, 8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 256,
          borderRadius: 12,
          backgroundColor: '#0f100c',
          border: '2px solid rgba(24, 100, 255, 0.4)',
          transform: 'translate(4px, 4px)',
          boxShadow: '0 6px 15px rgba(0,0,0,0.6)',
        }}
      />

      {/* Static Deck Top Card Back */}
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 256,
          borderRadius: 12,
          backgroundColor: '#0f100c',
          border: '2px solid #1864ff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 8,
            border: '1px dashed rgba(24, 100, 255, 0.4)',
            background: 'radial-gradient(circle, rgba(24, 100, 255, 0.2) 0%, rgba(15, 16, 12, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1864ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 16, height: 16, backgroundColor: '#1864ff', transform: 'rotate(45deg)' }} />
          </div>
        </div>
      </div>

      {/* The Drawn TCG Card (Framed art, Mana cost/Stats, Holographic border feel) */}
      <motion.div
        style={{
          x,
          y,
          rotate,
          scale,
          position: 'absolute',
          width: 180,
          height: 256,
          borderRadius: 12,
          backgroundColor: '#0f100c',
          border: '2.5px solid #29d4ff',
          boxShadow: '0 15px 35px rgba(41, 212, 255, 0.3), inset 0 0 15px rgba(41, 212, 255, 0.15)',
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transformOrigin: 'bottom right',
        }}
      >
        {/* Card Header: Title & Mana/Energy Crystal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(41, 212, 255, 0.3)', paddingBottom: 6 }}>
          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.05em' }}>
            CHRONO TITAN
          </span>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#1864ff', border: '1.5px solid #29d4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>5</span>
          </div>
        </div>

        {/* Card Artwork Window */}
        <div
          style={{
            height: '110px',
            borderRadius: 6,
            border: '1px solid rgba(41, 212, 255, 0.4)',
            background: 'radial-gradient(circle, rgba(41, 212, 255, 0.3) 0%, rgba(15, 16, 12, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Abstract core icon inside card art */}
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #29d4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(41,212,255,0.5)' }}>
            <div style={{ width: 22, height: 22, backgroundColor: '#29d4ff', transform: 'rotate(45deg)' }} />
          </div>
        </div>

        {/* Card Text Box / Description */}
        <div style={{ backgroundColor: 'rgba(24, 100, 255, 0.1)', borderRadius: 6, padding: 6, border: '1px solid rgba(24, 100, 255, 0.2)' }}>
          <div style={{ height: 5, width: '90%', backgroundColor: '#29d4ff', borderRadius: 2, marginBottom: 4, opacity: 0.8 }} />
          <div style={{ height: 4, width: '100%', backgroundColor: '#26282d', borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 4, width: '70%', backgroundColor: '#26282d', borderRadius: 2 }} />
        </div>

        {/* Card Footer: Attack / Defense Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
          <div style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(24, 100, 255, 0.2)', border: '1px solid #1864ff' }}>
            <span style={{ color: '#29d4ff', fontSize: 10, fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold' }}>ATK 2400</span>
          </div>
          <div style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(24, 100, 255, 0.2)', border: '1px solid #1864ff' }}>
            <span style={{ color: '#29d4ff', fontSize: 10, fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold' }}>DEF 2000</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}