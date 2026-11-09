'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';

export function CardCycloneGraphic({ progress }: { progress: MotionValue<number> }) {
  // A deck splitting and swirling cards in a dynamic cyclone vortex before merging back
  const cardIndices = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div style={{ position: 'relative', width: 240, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {cardIndices.map((idx) => (
        <CycloneCard key={idx} index={idx} progress={progress} />
      ))}
    </div>
  );
}

function CycloneCard({ index, progress }: { index: number; progress: MotionValue<number> }) {
  // Staggering the motion paths based on index for a fluid swirling/shuffling effect
  const angleOffset = index * 18;
  
  // Transform progress for swirling translation and rotation
  const x = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [0, Math.sin((angleOffset * Math.PI) / 180) * 75, Math.sin((angleOffset * Math.PI) / 180) * 60, 0]
  );
  
  const y = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [0, -Math.cos((angleOffset * Math.PI) / 180) * 45 - (index * 6), -Math.cos((angleOffset * Math.PI) / 180) * 35, 0]
  );

  const rotate = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [0, index * 22, index * 12, 0]
  );

  const scale = useTransform(
    progress,
    [0, 0.3, 0.7, 1],
    [0.9, 1.05, 1.02, 0.95]
  );

  const opacity = useTransform(
    progress,
    [0, 0.1, 0.9, 1],
    [0.7, 1, 1, 0.85]
  );

  const isHighlighted = index === 0;

  return (
    <motion.div
      style={{
        x,
        y,
        rotate,
        scale,
        opacity,
        position: 'absolute',
        width: 140,
        height: 200,
        borderRadius: 12,
        backgroundColor: '#0f100c',
        border: `2px solid ${isHighlighted ? '#29d4ff' : '#1864ff'}`,
        boxShadow: isHighlighted 
          ? '0 10px 30px rgba(41, 212, 255, 0.35)' 
          : '0 8px 20px rgba(0, 0, 0, 0.7)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transformOrigin: 'center center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '60%',
          borderRadius: 6,
          border: '1px solid rgba(24, 100, 255, 0.35)',
          background: isHighlighted
            ? 'radial-gradient(circle, rgba(41, 212, 255, 0.3) 0%, rgba(15, 16, 12, 0.95) 100%)'
            : 'radial-gradient(circle, rgba(24, 100, 255, 0.2) 0%, rgba(15, 16, 12, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div 
          style={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            border: `2px solid ${isHighlighted ? '#29d4ff' : '#1864ff'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
        >
          <div style={{ width: 8, height: 8, backgroundColor: isHighlighted ? '#29d4ff' : '#1864ff', transform: 'rotate(45deg)' }} />
        </div>
      </div>
      <div>
        <div
          style={{
            height: 6,
            width: '80%',
            backgroundColor: isHighlighted ? '#29d4ff' : '#1864ff',
            borderRadius: 3,
            marginBottom: 6,
          }}
        />
        <div style={{ height: 4, width: '100%', backgroundColor: '#26282d', borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 4, width: '60%', backgroundColor: '#26282d', borderRadius: 2 }} />
      </div>
    </motion.div>
  );
}