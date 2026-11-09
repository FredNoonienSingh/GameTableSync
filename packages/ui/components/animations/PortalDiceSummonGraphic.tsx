'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function PortalDiceSummonGraphic({ progress }: { progress: MotionValue<number> }) {
  // Portal / vortex rotation and scale progression
  const portalRotate = useTransform(progress, [0, 1], [0, 360]);
  const portalScale = useTransform(progress, [0, 0.3, 0.7, 1], [0.8, 1.1, 1.1, 0.8]);
  const portalOpacity = useTransform(progress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);

  // Die summoning progression: starts deep inside the portal (small, hidden/faded) and thrusts forward
  const dieZ = useTransform(progress, [0.2, 0.7], [0.4, 1]);
  const dieY = useTransform(progress, [0.2, 0.7], [20, 0]);
  const dieRotate = useTransform(progress, [0.2, 0.7], [-90, 0]);
  const dieScale = useTransform(progress, [0.2, 0.5, 0.7], [0.3, 1.15, 1]);
  const dieOpacity = useTransform(progress, [0.15, 0.3, 0.8, 1], [0, 1, 1, 1]);

  return (
    <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background Glow Ring */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(41, 212, 255, 0.2) 0%, rgba(24, 100, 255, 0.05) 70%, transparent 100%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Swirling Dimensional Portal Rings */}
      <motion.svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        style={{
          rotate: portalRotate,
          scale: portalScale,
          opacity: portalOpacity,
          position: 'absolute',
          filter: 'drop-shadow(0 0 20px rgba(41, 212, 255, 0.4))',
        }}
      >
        <circle
          cx="120"
          cy="120"
          r="95"
          fill="none"
          stroke="#1864ff"
          strokeWidth="2.5"
          strokeDasharray="14 10"
        />
        <circle
          cx="120"
          cy="120"
          r="75"
          fill="none"
          stroke="#29d4ff"
          strokeWidth="1.5"
          strokeDasharray="8 12"
        />
        <circle
          cx="120"
          cy="120"
          r="55"
          fill="none"
          stroke="#1864ff"
          strokeWidth="2"
          strokeDasharray="20 8"
        />
      </motion.svg>

      {/* Summoned D20 Die thrusting forward from the portal */}
      <motion.div
        style={{
          y: dieY,
          rotate: dieRotate,
          scale: dieScale,
          opacity: dieOpacity,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 0 25px rgba(41, 212, 255, 0.6))',
        }}
      >
        <svg width="150" height="150" viewBox="0 0 200 200">
          <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="#0f100c" stroke="#29d4ff" strokeWidth="3" />
          <polygon points="100,42 155,135 45,135" fill="rgba(41, 212, 255, 0.15)" stroke="#1864ff" strokeWidth="2.5" />
          <line x1="100" y1="10" x2="100" y2="42" stroke="#29d4ff" strokeWidth="2" />
          <line x1="178" y1="55" x2="100" y2="42" stroke="#29d4ff" strokeWidth="2" />
          <line x1="22" y1="55" x2="100" y2="42" stroke="#29d4ff" strokeWidth="2" />
          <line x1="178" y1="55" x2="155" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <line x1="178" y1="145" x2="155" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <line x1="100" y1="190" x2="155" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <line x1="100" y1="190" x2="45" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <line x1="22" y1="145" x2="45" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <line x1="22" y1="55" x2="45" y2="135" stroke="#29d4ff" strokeWidth="2" />
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="32"
            fontFamily="Orbitron, sans-serif"
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