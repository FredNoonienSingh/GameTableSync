'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function HexTilePathGraphic({ progress }: { progress: MotionValue<number> }) {
  // Sequential tile activation progress
  const t1 = useTransform(progress, [0, 0.25, 0.35], [0, 1, 0]);
  const t2 = useTransform(progress, [0.25, 0.5, 0.65], [0, 1, 0]);
  const t3 = useTransform(progress, [0.5, 0.75, 0.9], [0, 1, 0]);
  const t4 = useTransform(progress, [0.75, 1], [0, 1]);

  // Swoosh / energy arc path progress between the nodes
  const swoosh1 = useTransform(progress, [0.15, 0.35], [0, 1]);
  const swoosh2 = useTransform(progress, [0.4, 0.6], [0, 1]);
  const swoosh3 = useTransform(progress, [0.65, 0.85], [0, 1]);

  return (
    <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="260" height="260" viewBox="0 0 200 200" style={{ filter: 'drop-shadow(0 0 15px rgba(24, 100, 255, 0.3))' }}>
        
        {/* Energy Swoosh Paths connecting the tiles */}
        <motion.path
          d="M 100 45 Q 82 75 65 105"
          fill="none"
          stroke="#29d4ff"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{ pathLength: swoosh1, opacity: useTransform(progress, [0.15, 0.2, 0.35, 0.4], [0, 1, 1, 0]) }}
        />
        <motion.path
          d="M 65 105 Q 100 105 135 105"
          fill="none"
          stroke="#29d4ff"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{ pathLength: swoosh2, opacity: useTransform(progress, [0.4, 0.45, 0.6, 0.65], [0, 1, 1, 0]) }}
        />
        <motion.path
          d="M 135 105 Q 118 135 100 165"
          fill="none"
          stroke="#29d4ff"
          strokeWidth="3"
          strokeDasharray="6 4"
          style={{ pathLength: swoosh3, opacity: useTransform(progress, [0.65, 0.7, 0.85, 0.9], [0, 1, 1, 0]) }}
        />

        {/* Hexagonal Tiles */}
        <HexTile x={100} y={45} activeProgress={t1} />
        <HexTile x={65} y={105} activeProgress={t2} />
        <HexTile x={135} y={105} activeProgress={t3} />
        <HexTile x={100} y={165} activeProgress={t4} />
      </svg>
    </div>
  );
}

function HexTile({ x, y, activeProgress }: { x: number; y: number; activeProgress: MotionValue<number> }) {
  const strokeColor = useTransform(activeProgress, [0, 1], ['#1864ff', '#29d4ff']);
  const fillColor = useTransform(activeProgress, [0, 1], ['rgba(15, 16, 12, 0.9)', 'rgba(41, 212, 255, 0.25)']);
  const scale = useTransform(activeProgress, [0, 0.5, 1], [1, 1.1, 1]);
  const coreGlowOpacity = useTransform(activeProgress, [0, 1], [0, 1]);

  // Pointy-topped hexagon path calculation around center (x, y), radius ~ 30
  const r = 30;
  const points = Array.from({ length: 6 }).map((_, i) => {
    const angleDeg = 60 * i - 30;
    const angleRad = (Math.PI / 180) * angleDeg;
    return `${x + r * Math.cos(angleRad)},${y + r * Math.sin(angleRad)}`;
  }).join(' ');

  return (
    <motion.g style={{ scale, transformOrigin: `${x}px ${y}px` }}>
      <motion.polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      {/* Inner geometric core accent that pulses when active */}
      <motion.circle
        cx={x}
        cy={y}
        r={8}
        fill="#29d4ff"
        style={{ opacity: coreGlowOpacity, filter: 'drop-shadow(0 0 6px #29d4ff)' }}
      />
    </motion.g>
  );
}