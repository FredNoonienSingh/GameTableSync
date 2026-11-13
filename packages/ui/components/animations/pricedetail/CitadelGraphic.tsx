'use client';

import type { CSSProperties } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { PricingTierGraphicProps } from './types';

export function CitadelGraphic({
  progress,
  primaryColor = '#7c3aed',
  accentColor = '#c084fc',
  surfaceColor,
}: PricingTierGraphicProps) {
  const haloRotate = useTransform(progress, [0, 1], [0, 180]);
  const spireGlow = useTransform(progress, [0, 0.5, 1], [0.85, 1.15, 0.85]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-tier-fort-wrap" style={customVars}>
      <svg width="260" height="260" viewBox="0 0 260 260" className="gts-tier-fort-svg">
        {/* Rotating Orbital Command Halo */}
        <motion.g style={{ rotate: haloRotate, transformOrigin: '130px 115px' }}>
          <circle
            cx="130"
            cy="115"
            r="92"
            fill="none"
            stroke="var(--gfx-primary)"
            strokeWidth="1.5"
            strokeDasharray="18 8 4 8"
            opacity="0.7"
          />
          <circle cx="130" cy="23" r="4" fill="var(--gfx-accent)" />
          <circle cx="222" cy="115" r="4" fill="var(--gfx-accent)" />
          <circle cx="38" cy="115" r="4" fill="var(--gfx-accent)" />
        </motion.g>

        {/* Flying Buttress Wings */}
        <path
          d="M 66 145 Q 88 145 96 112"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        <path
          d="M 194 145 Q 172 145 164 112"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        <path
          d="M 60 175 Q 84 175 94 142"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
        />
        <path
          d="M 200 175 Q 176 175 166 142"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="2"
        />

        {/* Outer Flanking Lance Towers */}
        <polygon
          points="36,210 40,126 66,126 70,210"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.2"
        />
        <polygon
          points="36,126 53,82 70,126"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <line x1="53" y1="82" x2="53" y2="66" stroke="var(--gfx-accent)" strokeWidth="2" />

        <polygon
          points="190,210 194,126 220,126 224,210"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.2"
        />
        <polygon
          points="190,126 207,82 224,126"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <line x1="207" y1="82" x2="207" y2="66" stroke="var(--gfx-accent)" strokeWidth="2" />

        {/* Mid-Tier Inner Bastions */}
        <rect
          x="70"
          y="138"
          width="120"
          height="72"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />

        {/* Central Grand Cathedral Spire */}
        <polygon
          points="92,210 98,92 162,92 168,210"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
        />
        {/* High Gothic Steeple */}
        <polygon
          points="94,92 130,26 166,92"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        <line x1="130" y1="26" x2="130" y2="12" stroke="var(--gfx-accent)" strokeWidth="2.5" />

        {/* Gothic Rose Window Reactor */}
        <motion.g style={{ scale: spireGlow, transformOrigin: '130px 124px' }}>
          <circle
            cx="130"
            cy="124"
            r="18"
            fill="color-mix(in srgb, var(--gfx-accent) 20%, var(--gfx-surface))"
            stroke="var(--gfx-accent)"
            strokeWidth="2.5"
          />
          <circle cx="130" cy="124" r="8" fill="var(--gfx-accent)" />
        </motion.g>

        {/* Triple Gothic Archways */}
        <path
          d="M 114 210 L 114 174 Q 130 156 146 174 L 146 210 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 24%, var(--gfx-surface))"
          stroke="var(--gfx-accent)"
          strokeWidth="2.2"
        />
        <path
          d="M 78 210 L 78 182 Q 86 172 94 182 L 94 210 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 18%, var(--gfx-surface))"
          stroke="var(--gfx-primary)"
          strokeWidth="1.8"
        />
        <path
          d="M 166 210 L 166 182 Q 174 172 182 182 L 182 210 Z"
          fill="color-mix(in srgb, var(--gfx-primary) 18%, var(--gfx-surface))"
          stroke="var(--gfx-primary)"
          strokeWidth="1.8"
        />

        {/* Citadel Foundation */}
        <line x1="20" y1="210" x2="240" y2="210" stroke="var(--gfx-primary)" strokeWidth="3.5" />
        <line x1="36" y1="218" x2="224" y2="218" stroke="var(--gfx-accent)" strokeWidth="1.5" strokeDasharray="16 6" />
      </svg>
    </div>
  );
}