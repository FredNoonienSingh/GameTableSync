'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function FallingD6Graphic({ progress }: { progress: MotionValue<number> }) {
  const y1 = useTransform(progress, [0, 1], [-140, 160]);
  const r1 = useTransform(progress, [0, 1], [0, 360]);

  const y2 = useTransform(progress, [0, 1], [-200, 190]);
  const r2 = useTransform(progress, [0, 1], [45, -270]);

  const y3 = useTransform(progress, [0, 1], [-90, 130]);
  const r3 = useTransform(progress, [0, 1], [-30, 190]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <motion.div style={{ y: y1, rotate: r1, position: 'absolute', left: '12%', top: '28%' }}>
        <D6Svg pips={6} color="#1864ff" size={86} />
      </motion.div>
      <motion.div style={{ y: y2, rotate: r2, position: 'absolute', left: '50%', top: '18%' }}>
        <D6Svg pips={1} color="#29d4ff" size={104} />
      </motion.div>
      <motion.div style={{ y: y3, rotate: r3, position: 'absolute', left: '32%', top: '54%' }}>
        <D6Svg pips={5} color="#4080ff" size={74} />
      </motion.div>
    </div>
  );
}

function D6Svg({ pips, color, size }: { pips: 1 | 5 | 6; color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ filter: 'drop-shadow(0px 10px 20px rgba(24, 100, 255, 0.25))' }}
    >
      <rect x="8" y="8" width="84" height="84" rx="16" fill="#0f100c" stroke={color} strokeWidth="3" />
      {pips === 1 && <circle cx="50" cy="50" r="9" fill={color} />}
      {pips === 5 && (
        <>
          <circle cx="28" cy="28" r="7" fill={color} />
          <circle cx="72" cy="28" r="7" fill={color} />
          <circle cx="50" cy="50" r="7" fill={color} />
          <circle cx="28" cy="72" r="7" fill={color} />
          <circle cx="72" cy="72" r="7" fill={color} />
        </>
      )}
      {pips === 6 && (
        <>
          <circle cx="28" cy="25" r="7" fill={color} />
          <circle cx="72" cy="25" r="7" fill={color} />
          <circle cx="28" cy="50" r="7" fill={color} />
          <circle cx="72" cy="50" r="7" fill={color} />
          <circle cx="28" cy="75" r="7" fill={color} />
          <circle cx="72" cy="75" r="7" fill={color} />
        </>
      )}
    </svg>
  );
}