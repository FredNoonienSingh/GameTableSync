'use client';

import type { CSSProperties } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function OutpostGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: PricingTierGraphicProps) {
  const dishAngle = useTransform(progress, [0, 0.5, 1], [-22, 22, -22]);
  const pulseScale = useTransform(progress, [0, 0.5, 1], [0.85, 1.35, 0.85]);
  const pulseOpacity = useTransform(progress, [0, 0.5, 1], [0.85, 0.15, 0.85]);
  const shutterY = useTransform(progress, [0, 0.5, 1], [0, -3, 0]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-tier-fort-wrap" style={customVars}>
      <svg width="260" height="260" viewBox="0 0 260 260" className="gts-tier-fort-svg">
        {/* Tactical Radar Horizon Arc */}
        <path
          d="M 45 205 A 95 95 0 0 1 215 205"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          opacity="0.55"
        />

        {/* Expanding Sonar Recon Pulse */}
        <motion.circle
          cx="130"
          cy="64"
          r="26"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
          strokeDasharray="5 4"
          style={{ scale: pulseScale, opacity: pulseOpacity, transformOrigin: '130px 64px' }}
        />

        {/* Side Palisade Walls */}
        <polygon
          points="56,205 64,168 96,168 96,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2"
        />
        <polygon
          points="164,205 164,168 196,168 204,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2"
        />
        {/* Side Crenelations */}
        <rect x="66" y="160" width="8" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-primary)" strokeWidth="1.8" />
        <rect x="80" y="160" width="8" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-primary)" strokeWidth="1.8" />
        <rect x="172" y="160" width="8" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-primary)" strokeWidth="1.8" />
        <rect x="186" y="160" width="8" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-primary)" strokeWidth="1.8" />

        {/* Central Watchtower Shaft */}
        <polygon
          points="94,205 104,116 156,116 166,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />

        {/* Structural Armor Ribs */}
        <line x1="100" y1="158" x2="160" y2="158" stroke="var(--gfx-primary)" strokeWidth="1.5" opacity="0.6" />
        <line x1="112" y1="116" x2="106" y2="205" stroke="var(--gfx-primary)" strokeWidth="1.2" opacity="0.4" />
        <line x1="148" y1="116" x2="154" y2="205" stroke="var(--gfx-primary)" strokeWidth="1.2" opacity="0.4" />

        {/* Upper Observation Deck / Battlement */}
        <polygon
          points="94,116 166,116 172,96 88,96"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        {/* Tower Crenelations */}
        <rect x="92" y="88" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="114" y="88" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="134" y="88" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="156" y="88" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />

        {/* Illuminated Recon Visor Slit */}
        <motion.rect
          x="108"
          y="103"
          width="44"
          height="6"
          rx="2"
          fill="var(--gfx-accent)"
          style={{ y: shutterY }}
        />

        {/* Outpost Blast Door */}
        <path
          d="M 116 205 L 116 176 L 124 168 L 136 168 L 144 176 L 144 205 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 18%, var(--gfx-surface))"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
        />

        {/* Rotating Comms Array & Beacon Dish */}
        <motion.g style={{ rotate: dishAngle, transformOrigin: '130px 88px' }}>
          <line x1="130" y1="88" x2="130" y2="64" stroke="var(--gfx-primary)" strokeWidth="2.5" />
          <path
            d="M 114 68 Q 130 80 146 68"
            fill="none"
            stroke="var(--gfx-accent)"
            strokeWidth="2.5"
          />
          <line x1="130" y1="68" x2="130" y2="52" stroke="var(--gfx-accent)" strokeWidth="2" />
          <circle cx="130" cy="50" r="4.5" fill="var(--gfx-accent)" />
        </motion.g>

        {/* Ground Foundation Line */}
        <line x1="36" y1="205" x2="224" y2="205" stroke="var(--gfx-primary)" strokeWidth="3" />
        <line x1="56" y1="212" x2="204" y2="212" stroke="var(--gfx-accent)" strokeWidth="1.5" strokeDasharray="8 6" />
      </svg>
    </div>
  );
}