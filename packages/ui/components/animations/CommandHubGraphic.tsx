'use client';

import { Text } from '@mantine/core';
import { motion, MotionValue, useTransform } from 'framer-motion';

export function CommandHubGraphic({ progress }: { progress: MotionValue<number> }) {
  const rotateOuter = useTransform(progress, [0, 1], [0, 180]);
  const rotateInner = useTransform(progress, [0, 1], [120, -120]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.85, 1.08, 0.85]);

  return (
    <motion.div
      style={{
        scale,
        position: 'relative',
        width: 260,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        style={{
          rotate: rotateOuter,
          position: 'absolute',
          inset: 0,
          filter: 'drop-shadow(0 0 20px rgba(24, 100, 255, 0.35))',
        }}
      >
        <circle
          cx="130"
          cy="130"
          r="110"
          fill="none"
          stroke="#1864ff"
          strokeWidth="2"
          strokeDasharray="18 10"
        />
        <line x1="130" y1="20" x2="130" y2="65" stroke="#1864ff" strokeWidth="2" />
        <line x1="225" y1="185" x2="185" y2="162" stroke="#1864ff" strokeWidth="2" />
        <line x1="35" y1="185" x2="75" y2="162" stroke="#1864ff" strokeWidth="2" />
        <circle cx="130" cy="20" r="9" fill="#0f100c" stroke="#29d4ff" strokeWidth="3" />
        <circle cx="225" cy="185" r="9" fill="#0f100c" stroke="#29d4ff" strokeWidth="3" />
        <circle cx="35" cy="185" r="9" fill="#0f100c" stroke="#29d4ff" strokeWidth="3" />
      </motion.svg>

      <motion.svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        style={{ rotate: rotateInner, position: 'absolute' }}
      >
        <polygon
          points="80,12 138,46 138,114 80,148 22,114 22,46"
          fill="#0f100c"
          stroke="#29d4ff"
          strokeWidth="2.5"
        />
        <circle cx="80" cy="80" r="36" fill="none" stroke="#1864ff" strokeWidth="2" />
      </motion.svg>

      <Text
        className="brand-logo"
        c="white"
        size="sm"
        style={{ position: 'relative', letterSpacing: '0.15em' }}
      >
        SYNC
      </Text>
    </motion.div>
  );
}