'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface HobbyEssentialsGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
}

export function HobbyEssentialsGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: HobbyEssentialsGraphicProps) {
  const diceRotate = useTransform(progress, [0, 1], [-45, 315]);
  const diceScale = useTransform(progress, [0, 0.5, 1], [0.9, 1.1, 0.9]);

  const tapeWidth = useTransform(progress, [0.1, 0.7], ['10%', '75%']);
  const tapeOpacity = useTransform(progress, [0, 0.15, 0.9, 1], [0, 1, 1, 0.8]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-gfx-container-col-260" style={customVars}>
      <motion.div
        className="gts-hobby-die-wrap"
        style={{ rotate: diceRotate, scale: diceScale }}
      >
        <svg width="84" height="84" viewBox="0 0 100 100">
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="18"
            fill="var(--gfx-surface)"
            stroke="var(--gfx-accent)"
            strokeWidth="3"
          />
          <circle cx="30" cy="28" r="7" fill="var(--gfx-accent)" />
          <circle cx="70" cy="28" r="7" fill="var(--gfx-accent)" />
          <circle cx="30" cy="50" r="7" fill="var(--gfx-accent)" />
          <circle cx="70" cy="50" r="7" fill="var(--gfx-accent)" />
          <circle cx="30" cy="72" r="7" fill="var(--gfx-accent)" />
          <circle cx="70" cy="72" r="7" fill="var(--gfx-accent)" />
        </svg>
      </motion.div>

      <motion.div className="gts-hobby-tape-track" style={{ opacity: tapeOpacity }}>
        <div className="gts-hobby-tape-housing">
          <div className="gts-hobby-tape-core" />
        </div>

        <motion.div className="gts-hobby-tape-blade" style={{ width: tapeWidth }}>
          <span className="gts-hobby-tape-label">12&quot;</span>
        </motion.div>
      </motion.div>
    </div>
  );
}