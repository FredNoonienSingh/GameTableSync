'use client';

import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function CitadelGraphic({
  progress,
  primaryColor = '#1864ff',
  accentColor = '#29d4ff',
}: PricingTierGraphicProps) {
  const rotateOuter = useTransform(progress, [0, 1], [0, 240]);
  const rotateStarA = useTransform(progress, [0, 1], [0, -180]);
  const rotateStarB = useTransform(progress, [0, 1], [45, 225]);
  const scalePulse = useTransform(progress, [0, 0.5, 1], [0.85, 1.12, 0.9]);

  return (
    <motion.div
      style={{
        scale: scalePulse,
        position: 'relative',
        width: 260,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Orbital Defense Ring */}
      <motion.svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        style={{
          rotate: rotateOuter,
          position: 'absolute',
          inset: 0,
          filter: `drop-shadow(0 0 24px ${primaryColor}70)`,
        }}
      >
        <circle
          cx="130"
          cy="130"
          r="116"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          strokeDasharray="8 8 24 8"
        />
        <circle
          cx="130"
          cy="130"
          r="102"
          fill="none"
          stroke={accentColor}
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 130 + Math.cos(rad) * 116;
          const y1 = 130 + Math.sin(rad) * 116;
          const x2 = 130 + Math.cos(rad) * 88;
          const y2 = 130 + Math.sin(rad) * 88;
          return (
            <g key={angle}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={primaryColor} strokeWidth="2" />
              <circle cx={x1} cy={y1} r="6" fill="#0f100c" stroke={accentColor} strokeWidth="2.5" />
            </g>
          );
        })}
      </motion.svg>

      {/* Star Fortress Layer A */}
      <motion.svg
        width="170"
        height="170"
        viewBox="0 0 170 170"
        style={{ rotate: rotateStarA, position: 'absolute' }}
      >
        <rect
          x="25"
          y="25"
          width="120"
          height="120"
          rx="8"
          fill="#0f100c"
          stroke={primaryColor}
          strokeWidth="2.5"
        />
      </motion.svg>

      {/* Star Fortress Layer B (Interlocking 8-Point Star) */}
      <motion.svg
        width="170"
        height="170"
        viewBox="0 0 170 170"
        style={{
          rotate: rotateStarB,
          position: 'absolute',
          filter: `drop-shadow(0 0 20px ${accentColor}55)`,
        }}
      >
        <rect
          x="25"
          y="25"
          width="120"
          height="120"
          rx="8"
          fill="#0f100c"
          fillOpacity="0.85"
          stroke={accentColor}
          strokeWidth="2.5"
        />
        <circle cx="85" cy="85" r="44" fill="none" stroke={primaryColor} strokeWidth="2" strokeDasharray="12 6" />
      </motion.svg>

      {/* Citadel Spire Reactor */}
      <div
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: '#0f100c',
          border: `3px solid ${accentColor}`,
          boxShadow: `0 0 30px ${accentColor}80, inset 0 0 15px ${accentColor}60`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: accentColor,
            boxShadow: `0 0 16px #ffffff`,
          }}
        />
      </div>
    </motion.div>
  );
}