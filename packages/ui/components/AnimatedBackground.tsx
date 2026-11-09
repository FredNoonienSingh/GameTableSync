'use client';

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#0f100c',
      }}
    >
      {/* Tactical Static Grid in Logo Blue */}
      <svg width="100%" height="100%" style={{ opacity: 0.14 }}>
        <defs>
          <pattern id="tactical-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1864ff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tactical-grid)" />
      </svg>

      {/* Sweeping Vertical Electric Blue Line */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '2px',
          height: '35vh',
          background: 'linear-gradient(to bottom, transparent, #1864ff, transparent)',
          opacity: 0.65,
        }}
        animate={{ y: ['-40vh', '110vh'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      {/* Sweeping Vertical Cyan Line */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: '78%',
          width: '2px',
          height: '45vh',
          background: 'linear-gradient(to bottom, transparent, #29d4ff, transparent)',
          opacity: 0.45,
        }}
        animate={{ y: ['-50vh', '110vh'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
      />

      {/* Sweeping Horizontal Electric Blue Line */}
      <motion.div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          height: '1px',
          width: '40vw',
          background: 'linear-gradient(to right, transparent, #1864ff, transparent)',
          opacity: 0.4,
        }}
        animate={{ x: ['-40vw', '110vw'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 1 }}
      />
    </div>
  );
}