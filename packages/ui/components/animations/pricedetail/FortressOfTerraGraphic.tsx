'use client';

import type { CSSProperties } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function FortressOfTerraGraphic({
  progress,
  primaryColor = '#d97706',
  accentColor = '#fde047',
  surfaceColor,
}: PricingTierGraphicProps) {
  const rotateSolarHalo = useTransform(progress, [0, 1], [0, 360]);
  const thronePulse = useTransform(progress, [0, 0.5, 1], [0.92, 1.18, 0.92]);
  const solarRays = Array.from({ length: 12 }, (_, i) => i * 30);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-tier-fort-wrap" style={customVars}>
      <svg width="280" height="280" viewBox="0 0 280 280" className="gts-tier-fort-svg">
        {/* Rotating Imperial Solar Halo Behind the Palace */}
        <motion.g style={{ rotate: rotateSolarHalo, transformOrigin: '140px 115px' }}>
          <circle
            cx="140"
            cy="115"
            r="96"
            fill="none"
            stroke="var(--gfx-primary)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <circle
            cx="140"
            cy="115"
            r="84"
            fill="none"
            stroke="var(--gfx-accent)"
            strokeWidth="2"
            strokeDasharray="24 8 6 8"
          />
          {solarRays.map((angle, idx) => {
            const rad = (angle * Math.PI) / 180;
            const rIn = 84;
            const rOut = idx % 2 === 0 ? 108 : 96;
            const x1 = 140 + Math.cos(rad) * rIn;
            const y1 = 115 + Math.sin(rad) * rIn;
            const x2 = 140 + Math.cos(rad) * rOut;
            const y2 = 115 + Math.sin(rad) * rOut;
            return (
              <line
                key={angle}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={idx % 2 === 0 ? 'var(--gfx-accent)' : 'var(--gfx-primary)'}
                strokeWidth={idx % 2 === 0 ? '2.5' : '1.5'}
              />
            );
          })}
        </motion.g>

        {/* Outer Wing Bastion Spires (Far Left & Far Right) */}
        <polygon
          points="24,220 28,136 52,136 56,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.2"
        />
        <polygon
          points="24,136 40,94 56,136"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
        />
        <polygon
          points="224,220 228,136 252,136 256,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.2"
        />
        <polygon
          points="224,136 240,94 256,136"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
        />

        {/* Secondary Inner Spires */}
        <polygon
          points="58,220 62,108 92,108 96,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.4"
        />
        <polygon
          points="58,108 77,58 96,108"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <polygon
          points="184,220 188,108 218,108 222,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.4"
        />
        <polygon
          points="184,108 203,58 222,108"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />

        {/* Grand Imperial Palace Dome & Central Sanctum Spire */}
        <polygon
          points="94,220 100,88 180,88 186,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.8"
        />
        {/* Sovereign Palace Dome */}
        <path
          d="M 100 88 A 40 42 0 0 1 180 88 Z"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        {/* Apex Imperial Needle */}
        <polygon
          points="126,50 140,14 154,50"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />

        {/* Stepped Monumental Curtain Wall (Front Rampart) */}
        <polygon
          points="42,220 50,166 230,166 238,220"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        {/* Rampart Battlements */}
        {[56, 78, 100, 164, 186, 208].map((x) => (
          <rect
            key={x}
            x={x}
            y="158"
            width="14"
            height="8"
            fill="var(--gfx-surface)"
            stroke="var(--gfx-accent)"
            strokeWidth="1.8"
          />
        ))}

        {/* The Golden Throne Core & Eternity Gate */}
        <path
          d="M 114 220 L 114 162 L 140 140 L 166 162 L 166 220 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 22%, var(--gfx-surface))"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />

        <motion.g style={{ scale: thronePulse, transformOrigin: '140px 120px' }}>
          <polygon
            points="140,96 162,120 140,144 118,120"
            fill="var(--gfx-surface)"
            stroke="var(--gfx-accent)"
            strokeWidth="2.5"
          />
          <polygon
            points="140,106 152,120 140,134 128,120"
            fill="var(--gfx-accent)"
          />
        </motion.g>

        {/* Eternity Gate Pillars */}
        <line x1="128" y1="162" x2="128" y2="220" stroke="var(--gfx-accent)" strokeWidth="2" />
        <line x1="140" y1="152" x2="140" y2="220" stroke="var(--gfx-accent)" strokeWidth="2.5" />
        <line x1="152" y1="162" x2="152" y2="220" stroke="var(--gfx-accent)" strokeWidth="2" />

        {/* Monumental Plinth Base */}
        <line x1="14" y1="220" x2="266" y2="220" stroke="var(--gfx-accent)" strokeWidth="4" />
        <line x1="28" y1="228" x2="252" y2="228" stroke="var(--gfx-primary)" strokeWidth="2" strokeDasharray="20 8" />
      </svg>
    </div>
  );
}