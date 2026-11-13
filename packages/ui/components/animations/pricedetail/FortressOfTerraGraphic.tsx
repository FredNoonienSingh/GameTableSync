'use client';

import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function FortressOfTerraGraphic({
  progress,
  primaryColor = '#d97706', // Defaults to Imperial Amber/Gold, overrideable via props
  accentColor = '#fde047',
}: PricingTierGraphicProps) {
  const rotateHalo = useTransform(progress, [0, 1], [0, 360]);
  const rotateMatrix = useTransform(progress, [0, 1], [180, -180]);
  const rotateInner = useTransform(progress, [0, 1], [-90, 270]);
  const scaleMaster = useTransform(progress, [0, 0.5, 1], [0.85, 1.16, 0.92]);
  const coreGlow = useTransform(progress, [0, 0.5, 1], [0.7, 1, 0.8]);

  const solarSpikes = Array.from({ length: 12 }, (_, i) => i * 30);

  return (
    <motion.div
      style={{
        scale: scaleMaster,
        position: 'relative',
        width: 280,
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient Radial Aura */}
      <motion.div
        style={{
          opacity: coreGlow,
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}35 0%, ${primaryColor}15 50%, transparent 75%)`,
          filter: 'blur(8px)',
        }}
      />

      {/* Outer Solar Armada Ring (12 Lance Vectors) */}
      <motion.svg
        width="280"
        height="280"
        viewBox="0 0 280 280"
        style={{
          rotate: rotateHalo,
          position: 'absolute',
          inset: 0,
          filter: `drop-shadow(0 0 28px ${primaryColor}90)`,
        }}
      >
        <circle
          cx="140"
          cy="140"
          r="128"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <circle
          cx="140"
          cy="140"
          r="116"
          fill="none"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeDasharray="32 10 8 10"
        />
        {solarSpikes.map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const isMajor = idx % 3 === 0;
          const rOuter = isMajor ? 134 : 124;
          const rInner = isMajor ? 88 : 102;
          const x1 = 140 + Math.cos(rad) * rOuter;
          const y1 = 140 + Math.sin(rad) * rOuter;
          const x2 = 140 + Math.cos(rad) * rInner;
          const y2 = 140 + Math.sin(rad) * rInner;

          return (
            <g key={angle}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? accentColor : primaryColor}
                strokeWidth={isMajor ? '3' : '1.5'}
              />
              {isMajor && (
                <circle
                  cx={x1}
                  cy={y1}
                  r="6"
                  fill="#0f100c"
                  stroke={accentColor}
                  strokeWidth="3"
                />
              )}
            </g>
          );
        })}
      </motion.svg>

      {/* Mid-Layer Imperial Octagon Matrix */}
      <motion.svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        style={{
          rotate: rotateMatrix,
          position: 'absolute',
          filter: `drop-shadow(0 0 20px ${accentColor}75)`,
        }}
      >
        {/* Double Interlocking Hexagons */}
        <polygon
          points="100,12 176,56 176,144 100,188 24,144 24,56"
          fill="#0f100c"
          stroke={accentColor}
          strokeWidth="2.5"
        />
        <polygon
          points="100,12 176,56 176,144 100,188 24,144 24,56"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          transform="rotate(30 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="64"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray="16 8"
        />
      </motion.svg>

      {/* Inner Sanctum Shield */}
      <motion.svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ rotate: rotateInner, position: 'absolute' }}
      >
        <polygon
          points="60,8 112,60 60,112 8,60"
          fill="#0f100c"
          stroke={accentColor}
          strokeWidth="2.5"
        />
        <polygon
          points="60,8 112,60 60,112 8,60"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          transform="rotate(45 60 60)"
        />
      </motion.svg>

      {/* The Golden Throne Core */}
      <motion.div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#0f100c',
          border: `3px solid ${accentColor}`,
          boxShadow: `0 0 40px ${accentColor}, 0 0 15px #ffffff, inset 0 0 20px ${primaryColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            backgroundColor: '#ffffff',
            transform: 'rotate(45deg)',
            boxShadow: `0 0 20px ${accentColor}, 0 0 8px #ffffff`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}