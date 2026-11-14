'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface CardDrawGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
}

export function CardDrawGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
}: CardDrawGraphicProps) {
  const x = useTransform(progress, [0, 0.4, 0.8, 1], [0, 0, -50, -50]);
  const y = useTransform(progress, [0, 0.3, 0.7, 1], [0, 15, -100, -100]);
  const rotate = useTransform(progress, [0, 0.3, 0.7, 1], [0, 0, -10, -10]);
  const scale = useTransform(progress, [0, 0.3, 0.7, 1], [0.92, 0.98, 1.08, 1.08]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
    ...(textColor ? { '--gfx-text': textColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-draw-root" style={customVars}>
      <div className="gts-draw-deck-back-1" />
      <div className="gts-draw-deck-back-2" />

      <div className="gts-draw-deck-top">
        <div className="gts-draw-deck-pattern">
          <div className="gts-draw-deck-emblem-ring">
            <div className="gts-draw-deck-emblem-core" />
          </div>
        </div>
      </div>

      <motion.div className="gts-draw-active-card" style={{ x, y, rotate, scale }}>
        <div className="gts-draw-card-header">
          <span className="gts-draw-card-title">CHRONO TITAN</span>
          <div className="gts-draw-mana-orb">5</div>
        </div>

        <div className="gts-draw-art-box">
          <div className="gts-draw-art-ring">
            <div className="gts-draw-art-core" />
          </div>
        </div>

        <div className="gts-draw-lore-box">
          <div className="gts-draw-lore-lead" />
          <div className="gts-cyclone-bar-line" style={{ width: '100%', marginBottom: 3 }} />
          <div className="gts-cyclone-bar-line" style={{ width: '70%' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
          <div className="gts-draw-stat-pill">
            <span className="gts-draw-stat-text">ATK 2400</span>
          </div>
          <div className="gts-draw-stat-pill">
            <span className="gts-draw-stat-text">DEF 2000</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}