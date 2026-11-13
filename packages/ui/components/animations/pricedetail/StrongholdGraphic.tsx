'use client';

import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function StrongholdGraphic({
  progress,
  primaryColor = '#1864ff',
  accentColor = '#29d4ff',
}: PricingTierGraphicProps) {
  const rotateOuter = useTransform(progress, [0, 1], [0, -150]);
  const rotateWall = useTransform(progress, [0, 1], [-60, 60]);
  const scaleShield = useTransform(progress, [0, 0.5, 1], [0.88, 1.06, 0.95]);
  const bastionSpread = useTransform(progress, [0, 0.5, 1], [0, 10, 4]);

  return (
    <motion.div
      style={{
        scale: scaleShield,
        position: 'relative',
        width: 260,
        height: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer Bastion Ring & 4 Turret Nodes */}
      <motion.svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        style={{
          rotate: rotateOuter,
          position: 'absolute',
          inset: 0,
          filter: `drop-shadow(0 0 18px ${primaryColor}55)`,
        }}
      >
        <circle
          cx="130"
          cy="130"
          r="105"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          strokeDasharray="28 12"
        />
        {/* 4 Corner Bastions */}
        {[45, 135, 225, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 130 + Math.cos(rad) * 105;
          const y = 130 + Math.sin(rad) * 105;
          return (
            <g key={angle}>
              <rect
                x={x - 7}
                y={y - 7}
                width="14"
                height="14"
                rx="3"
                fill="#0f100c"
                stroke={accentColor}
                strokeWidth="2.5"
                transform={`rotate(${angle} ${x} ${y})`}
              />
            </g>
          );
        })}
      </motion.svg>

      {/* Inner Fortified Hex Wall */}
      <motion.svg
        width="180"
        height="180"
        viewBox="0 0 180 180"
        style={{
          rotate: rotateWall,
          position: 'absolute',
          filter: `drop-shadow(0 0 14px ${accentColor}40)`,
        }}
      >
        <polygon
          points="90,15 155,52 155,128 90,165 25,128 25,52"
          fill="#0f100c"
          stroke={primaryColor}
          strokeWidth="3"
        />
        <polygon
          points="90,28 143,59 143,121 90,152 37,121 37,59"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="10 6"
        />
      </motion.svg>

      {/* Reinforced Core */}
      <motion.div
        style={{
          y: bastionSpread,
          width: 48,
          height: 48,
          borderRadius: 8,
          backgroundColor: '#0f100c',
          border: `2.5px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}55, inset 0 0 10px ${primaryColor}55`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            backgroundColor: accentColor,
            transform: 'rotate(45deg)',
            boxShadow: `0 0 10px ${accentColor}`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}