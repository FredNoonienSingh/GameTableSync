'use client';

import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types'; // Or keep inline

export function OutpostGraphic({
  progress,
  primaryColor = '#1864ff',
  accentColor = '#29d4ff',
}: PricingTierGraphicProps) {
  const rotateScanner = useTransform(progress, [0, 1], [0, 120]);
  const scaleBeacon = useTransform(progress, [0, 0.5, 1], [0.92, 1.05, 0.92]);
  const radarOpacity = useTransform(progress, [0, 0.5, 1], [0.4, 0.9, 0.4]);

  return (
    <div
      style={{
        position: 'relative',
        width: 260,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer Recon Perimeter */}
      <motion.svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        style={{
          rotate: rotateScanner,
          position: 'absolute',
          inset: 0,
          filter: `drop-shadow(0 0 12px ${primaryColor}40)`,
        }}
      >
        <circle
          cx="130"
          cy="130"
          r="95"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeDasharray="12 16"
        />
        {/* Single Recon Pylon */}
        <line x1="130" y1="35" x2="130" y2="65" stroke={primaryColor} strokeWidth="2" />
        <circle cx="130" cy="35" r="6" fill="#0f100c" stroke={accentColor} strokeWidth="2.5" />
      </motion.svg>

      {/* Static Crosshair Grid */}
      <motion.svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        style={{ opacity: radarOpacity, position: 'absolute' }}
      >
        <line x1="90" y1="20" x2="90" y2="160" stroke={primaryColor} strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="90" x2="160" y2="90" stroke={primaryColor} strokeWidth="1" strokeDasharray="4 4" />
      </motion.svg>

      {/* Central Outpost Core */}
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ scale: scaleBeacon, position: 'absolute' }}
      >
        <polygon
          points="60,20 100,60 60,100 20,60"
          fill="#0f100c"
          stroke={accentColor}
          strokeWidth="2.5"
        />
        <rect
          x="52"
          y="52"
          width="16"
          height="16"
          fill={primaryColor}
          transform="rotate(45 60 60)"
        />
      </motion.svg>
    </div>
  );
}