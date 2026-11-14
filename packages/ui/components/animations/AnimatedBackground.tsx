'use client';

import { motion } from 'framer-motion';

export function AnimatedBackground() {
  return (
    <div className="gts-bg-root">
      <svg className="gts-bg-grid-svg">
        <defs>
          <pattern id="tactical-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" className="gts-bg-grid-path" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tactical-grid)" />
      </svg>

      <motion.div
        className="gts-bg-beam-v-primary"
        animate={{ y: ['-40vh', '110vh'] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="gts-bg-beam-v-accent"
        animate={{ y: ['-50vh', '110vh'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
      />

      <motion.div
        className="gts-bg-beam-h-primary"
        animate={{ x: ['-40vw', '110vw'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 1 }}
      />
    </div>
  );
}