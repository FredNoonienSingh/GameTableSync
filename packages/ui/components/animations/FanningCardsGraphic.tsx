'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface FanningCardsGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
}

export function FanningCardsGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: FanningCardsGraphicProps) {
  const cardIndices = [-2, -1, 0, 1, 2];

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-fan-root" style={customVars}>
      {cardIndices.map((idx) => (
        <FanningCard key={idx} index={idx} progress={progress} />
      ))}
    </div>
  );
}

function FanningCard({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const rotate = useTransform(progress, [0.1, 0.5], [0, index * 14]);
  const x = useTransform(progress, [0.1, 0.5], [0, index * 34]);
  const y = useTransform(progress, [0.1, 0.5], [0, Math.abs(index) * 10]);

  const isCenter = index === 0;

  return (
    <motion.div
      className="gts-fan-card"
      data-center={isCenter ? 'true' : undefined}
      style={{ rotate, x, y }}
    >
      <div className="gts-fan-art" />
      <div>
        <div className="gts-fan-bar-title" />
        <div className="gts-fan-bar-line" style={{ width: '100%', marginBottom: 5 }} />
        <div className="gts-fan-bar-line" style={{ width: '85%' }} />
      </div>
    </motion.div>
  );
}