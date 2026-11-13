'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface HexTilePathGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
}

export function HexTilePathGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
}: HexTilePathGraphicProps) {
  const t1 = useTransform(progress, [0, 0.25, 0.35], [0, 1, 0]);
  const t2 = useTransform(progress, [0.25, 0.5, 0.65], [0, 1, 0]);
  const t3 = useTransform(progress, [0.5, 0.75, 0.9], [0, 1, 0]);
  const t4 = useTransform(progress, [0.75, 1], [0, 1]);

  const swoosh1 = useTransform(progress, [0.15, 0.35], [0, 1]);
  const swoosh2 = useTransform(progress, [0.4, 0.6], [0, 1]);
  const swoosh3 = useTransform(progress, [0.65, 0.85], [0, 1]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-gfx-container-260" style={customVars}>
      <svg width="260" height="260" viewBox="0 0 200 200" className="gts-hex-svg">
        <motion.path
          d="M 100 45 Q 82 75 65 105"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{
            pathLength: swoosh1,
            opacity: useTransform(progress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]),
          }}
        />
        <motion.path
          d="M 65 105 Q 100 105 135 105"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{
            pathLength: swoosh2,
            opacity: useTransform(progress, [0.4, 0.45, 0.6, 0.65], [0, 1, 1, 0]),
          }}
        />
        <motion.path
          d="M 135 105 Q 118 135 100 165"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{
            pathLength: swoosh3,
            opacity: useTransform(progress, [0.65, 0.7, 0.85, 0.9], [0, 1, 1, 0]),
          }}
        />

        <HexTile x={100} y={45} activeProgress={t1} />
        <HexTile x={65} y={105} activeProgress={t2} />
        <HexTile x={135} y={105} activeProgress={t3} />
        <HexTile x={100} y={165} activeProgress={t4} />
      </svg>
    </div>
  );
}

function HexTile({
  x,
  y,
  activeProgress,
}: {
  x: number;
  y: number;
  activeProgress: MotionValue<number>;
}) {
  const scale = useTransform(activeProgress, [0, 0.5, 1], [1, 1.1, 1]);
  const activeOpacity = useTransform(activeProgress, [0, 1], [0, 1]);

  const r = 30;
  const points = Array.from({ length: 6 })
    .map((_, i) => {
      const angleDeg = 60 * i - 30;
      const angleRad = (Math.PI / 180) * angleDeg;
      return `${x + r * Math.cos(angleRad)},${y + r * Math.sin(angleRad)}`;
    })
    .join(' ');

  return (
    <motion.g style={{ scale, transformOrigin: `${x}px ${y}px` }}>
      {/* Base tile (Theme surface + Primary stroke) */}
      <polygon
        points={points}
        fill="var(--gfx-surface)"
        stroke="var(--gfx-primary)"
        strokeWidth="2.5"
      />
      {/* Active overlay tile (Accent glow + Accent stroke) */}
      <motion.polygon
        points={points}
        fill="color-mix(in srgb, var(--gfx-accent) 25%, transparent)"
        stroke="var(--gfx-accent)"
        strokeWidth="2.5"
        style={{ opacity: activeOpacity }}
      />
      <motion.circle
        cx={x}
        cy={y}
        r={8}
        fill="var(--gfx-accent)"
        style={{
          opacity: activeOpacity,
          filter: 'drop-shadow(0 0 6px var(--gfx-accent))',
        }}
      />
    </motion.g>
  );
}