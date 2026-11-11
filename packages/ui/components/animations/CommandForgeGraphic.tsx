'use client';

import { Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconCpu } from '@tabler/icons-react';

export function CommandForgeGraphic() {
  return (
    <Box
      style={{
        position: 'relative',
        width: 150,
        height: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer Rotating Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px dashed rgba(41, 212, 255, 0.45)',
        }}
      />
      {/* Inner Counter-Rotating Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: 18,
          borderRadius: '50%',
          border: '2px solid rgba(24, 100, 255, 0.35)',
          borderTopColor: '#29d4ff',
        }}
      />
      {/* Pulsing Center Core */}
      <motion.div
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 68,
          height: 68,
          borderRadius: 16,
          backgroundColor: 'rgba(24, 100, 255, 0.18)',
          border: '1px solid #29d4ff',
          boxShadow: '0 0 25px rgba(41, 212, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#29d4ff',
        }}
      >
        <IconCpu size={34} />
      </motion.div>
    </Box>
  );
}