'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function RotatingD20Graphic({ progress }: { progress: MotionValue<number> }) {
  const rotate = useTransform(progress, [0, 1], [-120, 120]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.75, 1.1, 0.75]);

  return (
    <motion.div style={{ rotate, scale }}>
      <svg
        width="250"
        height="250"
        viewBox="0 0 200 200"
        style={{ filter: 'drop-shadow(0 0 25px rgba(24, 100, 255, 0.35))' }}
      >
        <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="#0f100c" stroke="#1864ff" strokeWidth="3" />
        <polygon points="100,42 155,135 45,135" fill="none" stroke="#29d4ff" strokeWidth="2.5" />
        <line x1="100" y1="10" x2="100" y2="42" stroke="#1864ff" strokeWidth="2" />
        <line x1="178" y1="55" x2="100" y2="42" stroke="#1864ff" strokeWidth="2" />
        <line x1="22" y1="55" x2="100" y2="42" stroke="#1864ff" strokeWidth="2" />
        <line x1="178" y1="55" x2="155" y2="135" stroke="#1864ff" strokeWidth="2" />
        <line x1="178" y1="145" x2="155" y2="135" stroke="#1864ff" strokeWidth="2" />
        <line x1="100" y1="190" x2="155" y2="135" stroke="#1864ff" strokeWidth="2" />
        <line x1="100" y1="190" x2="45" y2="135" stroke="#1864ff" strokeWidth="2" />
        <line x1="22" y1="145" x2="45" y2="135" stroke="#1864ff" strokeWidth="2" />
        <line x1="22" y1="55" x2="45" y2="135" stroke="#1864ff" strokeWidth="2" />
        <text
          x="100"
          y="116"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="30"
          fontFamily="Orbitron, sans-serif"
          fontWeight="700"
          letterSpacing="2"
        >
          20
        </text>
      </svg>
    </motion.div>
  );
}