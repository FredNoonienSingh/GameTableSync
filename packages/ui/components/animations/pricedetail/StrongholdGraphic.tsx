'use client';

import type { CSSProperties } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function StrongholdGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: PricingTierGraphicProps) {
  const shieldPulse = useTransform(progress, [0, 0.5, 1], [0.97, 1.04, 0.97]);
  const gateY = useTransform(progress, [0, 0.5, 1], [0, -8, 0]);
  const beaconScale = useTransform(progress, [0, 0.5, 1], [0.9, 1.2, 0.9]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-tier-fort-wrap" style={customVars}>
      <svg width="260" height="260" viewBox="0 0 260 260" className="gts-tier-fort-svg">
        {/* Overhead Tactical Void-Shield Dome */}
        <motion.path
          d="M 28 205 A 102 108 0 0 1 232 205"
          fill="color-mix(in srgb, var(--gfx-primary) 6%, transparent)"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
          strokeDasharray="14 8"
          style={{ scale: shieldPulse, transformOrigin: '130px 205px' }}
        />

        {/* Central Command Keep (Rear Tier) */}
        <polygon
          points="92,205 98,92 162,92 168,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        {/* Keep Pediment & Crown */}
        <polygon
          points="90,92 130,68 170,92"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        {/* Keep Tactical Emblem */}
        <motion.polygon
          points="130,98 144,112 130,126 116,112"
          fill="color-mix(in srgb, var(--gfx-accent) 25%, var(--gfx-surface))"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
          style={{ scale: beaconScale, transformOrigin: '130px 112px' }}
        />

        {/* Connecting Curtain Wall */}
        <rect
          x="76"
          y="142"
          width="108"
          height="63"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        {/* Curtain Wall Crenelations */}
        {[84, 102, 120, 138, 156, 170].map((x) => (
          <rect
            key={x}
            x={x}
            y="134"
            width="10"
            height="8"
            fill="var(--gfx-surface)"
            stroke="var(--gfx-primary)"
            strokeWidth="1.8"
          />
        ))}

        {/* Left Heavy Bastion Tower */}
        <polygon
          points="38,205 46,108 86,108 90,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        <polygon
          points="40,108 90,108 94,94 36,94"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <rect x="40" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="59" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="78" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        {/* Left Tower Firing Slits */}
        <rect x="62" y="124" width="6" height="18" rx="2" fill="var(--gfx-accent)" />
        <rect x="62" y="154" width="6" height="18" rx="2" fill="var(--gfx-primary)" />

        {/* Right Heavy Bastion Tower */}
        <polygon
          points="170,205 174,108 214,108 222,205"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        <polygon
          points="170,108 220,108 224,94 166,94"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <rect x="170" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="189" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        <rect x="208" y="86" width="12" height="8" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="2" />
        {/* Right Tower Firing Slits */}
        <rect x="192" y="124" width="6" height="18" rx="2" fill="var(--gfx-accent)" />
        <rect x="192" y="154" width="6" height="18" rx="2" fill="var(--gfx-primary)" />

        {/* Fortified Gatehouse & Portcullis */}
        <path
          d="M 106 205 L 106 168 L 118 154 L 142 154 L 154 168 L 154 205 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 18%, var(--gfx-surface))"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        <motion.g style={{ y: gateY }}>
          <line x1="118" y1="158" x2="118" y2="205" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="130" y1="154" x2="130" y2="205" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="142" y1="158" x2="142" y2="205" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="108" y1="176" x2="152" y2="176" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="108" y1="190" x2="152" y2="190" stroke="var(--gfx-accent)" strokeWidth="2" />
        </motion.g>

        {/* Ground Base */}
        <line x1="24" y1="205" x2="236" y2="205" stroke="var(--gfx-primary)" strokeWidth="3.5" />
        <line x1="44" y1="213" x2="216" y2="213" stroke="var(--gfx-accent)" strokeWidth="1.5" strokeDasharray="12 6" />
      </svg>
    </div>
  );
}