'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function HobbyEssentialsGraphic({ progress }: { progress: MotionValue<number> }) {
  // Dice rolling / tumbling movement
  const diceRotate = useTransform(progress, [0, 1], [-45, 315]);
  const diceScale = useTransform(progress, [0, 0.5, 1], [0.9, 1.1, 0.9]);

  // Measuring tape expanding / sliding out from a sleek casing
  const tapeWidth = useTransform(progress, [0.1, 0.7], ['10%', '75%']);
  const tapeOpacity = useTransform(progress, [0, 0.15, 0.9, 1], [0, 1, 1, 0.8]);

  return (
    <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      
      {/* Floating Die (D6) */}
      <motion.div
        style={{
          rotate: diceRotate,
          scale: diceScale,
          filter: 'drop-shadow(0 10px 20px rgba(41, 212, 255, 0.3))',
        }}
      >
        <svg width="84" height="84" viewBox="0 0 100 100">
          <rect x="8" y="8" width="84" height="84" rx="18" fill="#0f100c" stroke="#29d4ff" strokeWidth="3" />
          {/* Pips for a 6 */}
          <circle cx="30" cy="28" r="7" fill="#29d4ff" />
          <circle cx="70" cy="28" r="7" fill="#29d4ff" />
          <circle cx="30" cy="50" r="7" fill="#29d4ff" />
          <circle cx="70" cy="50" r="7" fill="#29d4ff" />
          <circle cx="30" cy="72" r="7" fill="#29d4ff" />
          <circle cx="70" cy="72" r="7" fill="#29d4ff" />
        </svg>
      </motion.div>

      {/* Measuring Tape Tool & Holographic Track */}
      <motion.div 
        style={{ 
          opacity: tapeOpacity,
          width: '220px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          height: 36,
          backgroundColor: 'rgba(15, 16, 12, 0.85)',
          borderRadius: 8,
          border: '1.5px solid #1864ff',
          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          padding: '0 6px',
        }}
      >
        {/* Tape Casing / Housing Unit */}
        <div 
          style={{ 
            width: 28, 
            height: 28, 
            borderRadius: 6, 
            backgroundColor: '#1864ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 2,
            boxShadow: '0 0 10px rgba(24,100,255,0.6)'
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0f100c', border: '1.5px solid #29d4ff' }} />
        </div>

        {/* Expanding Holographic Tape Line */}
        <motion.div
          style={{
            position: 'absolute',
            left: 36,
            height: 12,
            width: tapeWidth,
            backgroundColor: 'rgba(41, 212, 255, 0.2)',
            borderTop: '1.5px dashed #29d4ff',
            borderBottom: '1.5px dashed #29d4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 6,
          }}
        >
          <span style={{ color: '#29d4ff', fontSize: '9px', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold' }}>12&quot;</span>
        </motion.div>
      </motion.div>

    </div>
  );
}