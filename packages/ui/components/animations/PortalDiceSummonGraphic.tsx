'use client';

import type { CSSProperties } from 'react';
import { motion, MotionValue, useTransform } from 'framer-motion';

export interface PortalDiceSummonGraphicProps {
  progress: MotionValue<number>;
  primaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  textColor?: string;
}

export function PortalDiceSummonGraphic({
  progress,
  primaryColor,
  accentColor,
  surfaceColor,
  textColor,
}: PortalDiceSummonGraphicProps) {
  const portalRotate = useTransform(progress, [0, 1], [0, 360]);
  const portalScale = useTransform(progress, [0, 0.3, 0.7, 1], [0.8, 1.1, 1.1, 0.8]);
  const portalOpacity = useTransform(progress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

  const dieY = useTransform(progress, [0.2, 0.7], [20, 0]);
  const dieRotate = useTransform(progress, [0.2, 0.7], [-90, 0]);
  const dieScale = useTransform(progress, [0.2, 0.5, 0.7], [0.3, 1.15, 1]);
  const dieOpacity = useTransform(progress, [0.15, 0.3, 0.8, 1], [0, 1, 1, 1]);

  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
    ...(surfaceColor ? { '--gfx-surface': surfaceColor } : {}),
    ...(textColor ? { '--gfx-text': textColor } : {}),
  } as CSSProperties;

  return (
    <div className="gts-graphic-scope gts-gfx-container-260" style={customVars}>
      <div className="gts-portal-glow" />

      <motion.svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        className="gts-portal-rings-svg"
        style={{
          rotate: portalRotate,
          scale: portalScale,
          opacity: portalOpacity,
        }}
      >
        <circle
          cx="120"
          cy="120"
          r="95"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="2.5"
          strokeDasharray="14 10"
        />
        <circle
          cx="120"
          cy="120"
          r="75"
          fill="none"
          stroke="var(--gfx-accent)"
          strokeWidth="1.5"
          strokeDasharray="8 12"
        />
        <circle
          cx="120"
          cy="120"
          r="55"
          fill="none"
          stroke="var(--gfx-primary)"
          strokeWidth="2"
          strokeDasharray="20 8"
        />
      </motion.svg>

      <motion.div
        className="gts-portal-die-wrap"
        style={{
          y: dieY,
          rotate: dieRotate,
          scale: dieScale,
          opacity: dieOpacity,
        }}
      >
        <svg width="150" height="150" viewBox="0 0 200 200">
          <polygon
            points="100,10 178,55 178,145 100,190 22,145 22,55"
            fill="var(--gfx-surface)"
            stroke="var(--gfx-accent)"
            strokeWidth="3"
          />
          <polygon
            points="100,42 155,135 45,135"
            fill="color-mix(in srgb, var(--gfx-accent) 15%, transparent)"
            stroke="var(--gfx-primary)"
            strokeWidth="2.5"
          />
          <line x1="100" y1="10" x2="100" y2="42" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="178" y1="55" x2="100" y2="42" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="22" y1="55" x2="100" y2="42" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="178" y1="55" x2="155" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="178" y1="145" x2="155" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="100" y1="190" x2="155" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="100" y1="190" x2="45" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="22" y1="145" x2="45" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <line x1="22" y1="55" x2="45" y2="135" stroke="var(--gfx-accent)" strokeWidth="2" />
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="var(--gfx-text)"
            fontSize="32"
            fontFamily="var(--gts-font-brand)"
            fontWeight="700"
            letterSpacing="2"
          >
            20
          </text>
        </svg>
      </motion.div>
    </div>
  );
}