'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface RotatingD20GraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
}

export function RotatingD20Graphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
}: RotatingD20GraphicProps) {
  const rotate = useTransform(progress, [0, 1], [-120, 120]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.75, 1.1, 0.75]);

  const customVars = {
    rotate,
    scale,
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
    ...(textColor ? { '--gfx-text': textColor } : {}),
  } as unknown as CSSProperties;

  return (
    <motion.div className="gts-graphic-scope" style={customVars}>
      <svg width="250" height="250" viewBox="0 0 200 200" className="gts-d20-svg">
        <polygon
          points="100,10 178,55 178,145 100,190 22,145 22,55"
          fill="var(--gfx-surface)"
          stroke="var(--gfx-primary)"
          strokeWidth="3"
        />
        <polygon
          points="100,42 155,135 45,135"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="2.5"
        />
        <line x1="100" y1="10" x2="100" y2="42" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="178" y1="55" x2="100" y2="42" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="22" y1="55" x2="100" y2="42" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="178" y1="55" x2="155" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="178" y1="145" x2="155" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="100" y1="190" x2="155" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="100" y1="190" x2="45" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="22" y1="145" x2="45" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <line x1="22" y1="55" x2="45" y2="135" stroke="var(--gfx-primary)" strokeWidth="2" />
        <text
          x="100"
          y="116"
          textAnchor="middle"
          fill="var(--gfx-text)"
          fontSize="30"
          fontFamily="var(--gts-font-brand)"
          fontWeight="700"
          letterSpacing="2"
        >
          20
        </text>
      </svg>
    </motion.div>
  );
}