'use client';

import type { CSSProperties } from 'react';
import { Text } from '@mantine/core';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface CommandHubGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
}

export function CommandHubGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
}: CommandHubGraphicProps) {
  const rotateOuter = useTransform(progress, [0, 1], [0, 180]);
  const rotateInner = useTransform(progress, [0, 1], [120, -120]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.85, 1.08, 0.85]);

  const customVars = {
    scale,
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
    ...(textColor ? { '--gfx-text': textColor } : {}),
  } as unknown as CSSProperties;

  return (
    <motion.div className="gts-graphic-scope gts-gfx-container-260" style={customVars}>
      <motion.svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        className="gts-hub-svg-outer"
        style={{ rotate: rotateOuter }}
      >
        <circle
          cx="130"
          cy="130"
          r="110"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="2"
          strokeDasharray="18 10"
        />
        <line x1="130" y1="20" x2="130" y2="65" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="225" y1="185" x2="185" y2="162" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="35" y1="185" x2="75" y2="162" stroke="var(--gfx-primary)" strokeWidth="2" />
        <circle cx="130" cy="20" r="9" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="3" />
        <circle cx="225" cy="185" r="9" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="3" />
        <circle cx="35" cy="185" r="9" fill="var(--gfx-surface)" stroke="var(--gfx-accent)" strokeWidth="3" />
      </motion.svg>

      <motion.svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="gts-hub-svg-inner"
        style={{ rotate: rotateInner }}
      >
        <polygon
          points="80,12 138,46 138,114 80,148 22,114 22,46"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        <circle cx="80" cy="80" r="36" fill="none" stroke="var(--gfx-primary)" strokeWidth="2" />
      </motion.svg>

      <Text className="brand-logo gts-hub-label" size="sm">
        SYNC
      </Text>
    </motion.div>
  );
}