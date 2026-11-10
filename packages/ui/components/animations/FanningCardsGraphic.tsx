'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function FanningCardsGraphic({ progress }: { progress: MotionValue<number> }) {
  const cardIndices = [-2, -1, 0, 1, 2];

  return (
    <div style={{ position: 'relative', width: 200, height: 280 }}>
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
      style={{
        rotate,
        x,
        y,
        transformOrigin: 'bottom center',
        position: 'absolute',
        inset: 0,
        borderRadius: 14,
        backgroundColor: '#0f100c',
        border: `2px solid ${isCenter ? '#29d4ff' : '#1864ff'}`,
        boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          height: '55%',
          borderRadius: 6,
          border: '1px solid rgba(24, 100, 255, 0.35)',
          background: isCenter
            ? 'radial-gradient(circle, rgba(41, 212, 255, 0.3) 0%, rgba(15, 16, 12, 0.95) 100%)'
            : 'radial-gradient(circle, rgba(24, 100, 255, 0.25) 0%, rgba(15, 16, 12, 0.95) 100%)',
        }}
      />
      <div>
        <div
          style={{
            height: 8,
            width: '75%',
            backgroundColor: isCenter ? '#29d4ff' : '#1864ff',
            borderRadius: 4,
            marginBottom: 8,
          }}
        />
        <div style={{ height: 6, width: '100%', backgroundColor: '#26282d', borderRadius: 3, marginBottom: 5 }} />
        <div style={{ height: 6, width: '85%', backgroundColor: '#26282d', borderRadius: 3 }} />
      </div>
    </motion.div>
  );
}