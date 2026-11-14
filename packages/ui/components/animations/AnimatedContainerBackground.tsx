'use client';

import { motion } from 'framer-motion';

export function AnimatedContainerBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0, // Shorthand for top: 0, right: 0, bottom: 0, left: 0
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        borderRadius: 'inherit', // Inherits the 12px rounding from the Tab Arena
      }}
    >
      {/* Tactical Grid (Inherits the active tab color via color-mix) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="container-tactical-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="color-mix(in srgb, var(--gts-primary) 12%, transparent)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#container-tactical-grid)" />
      </svg>

      {/* Vertical Beam 1 (Primary) */}
      <motion.div
        style={{
          position: 'absolute',
          width: '1px',
          height: '50%',
          background: 'linear-gradient(to bottom, transparent, var(--gts-primary), transparent)',
          left: '25%',
          boxShadow: '0 0 12px 1px var(--gts-primary)',
          opacity: 0.6,
        }}
        animate={{ top: ['-50%', '150%'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      {/* Vertical Beam 2 (Accent) */}
      <motion.div
        style={{
          position: 'absolute',
          width: '1px',
          height: '40%',
          background: 'linear-gradient(to bottom, transparent, var(--gts-accent), transparent)',
          left: '75%',
          boxShadow: '0 0 12px 1px var(--gts-accent)',
          opacity: 0.4,
        }}
        animate={{ top: ['-40%', '150%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
      />

      {/* Horizontal Beam (Primary) */}
      <motion.div
        style={{
          position: 'absolute',
          height: '1px',
          width: '60%',
          background: 'linear-gradient(to right, transparent, var(--gts-primary), transparent)',
          top: '35%',
          boxShadow: '0 0 12px 1px var(--gts-primary)',
          opacity: 0.5,
        }}
        animate={{ left: ['-60%', '150%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 1 }}
      />
    </div>
  );
}