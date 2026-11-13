'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface CardCycloneGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
}

export function CardCycloneGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: CardCycloneGraphicProps) {
  const cardIndices = [-3, -2, -1, 0, 1, 2, 3];

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-cyclone-root" style={customVars}>
      {cardIndices.map((idx) => (
        <CycloneCard key={idx} index={idx} progress={progress} />
      ))}
    </div>
  );
}

function CycloneCard({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const angleOffset = index * 18;

  const x = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [
      0,
      Math.sin((angleOffset * Math.PI) / 180) * 75,
      Math.sin((angleOffset * Math.PI) / 180) * 60,
      0,
    ]
  );

  const y = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [
      0,
      -Math.cos((angleOffset * Math.PI) / 180) * 45 - index * 6,
      -Math.cos((angleOffset * Math.PI) / 180) * 35,
      0,
    ]
  );

  const rotate = useTransform(progress, [0, 0.3, 0.7, 1], [0, index * 22, index * 12, 0]);
  const scale = useTransform(progress, [0, 0.3, 0.7, 1], [0.9, 1.05, 1.02, 0.95]);
  const opacity = useTransform(progress, [0, 0.1, 0.9, 1], [0.7, 1, 1, 0.85]);

  const isHighlighted = index === 0;

  return (
    <motion.div
      className="gts-cyclone-card"
      data-highlighted={isHighlighted ? 'true' : undefined}
      style={{ x, y, rotate, scale, opacity }}
    >
      <div className="gts-cyclone-art">
        <div className="gts-cyclone-ring">
          <div className="gts-cyclone-diamond" />
        </div>
      </div>
      <div>
        <div className="gts-cyclone-bar-title" />
        <div className="gts-cyclone-bar-line" style={{ width: '100%', marginBottom: 4 }} />
        <div className="gts-cyclone-bar-line" style={{ width: '60%' }} />
      </div>
    </motion.div>
  );
}