'use client';

import type { CSSProperties } from 'react';
import { Box } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconCpu } from '@tabler/icons-react';

export interface CommandForgeGraphicProps {
  primaryColor?: string;
  accentColor?: string;
}

export function CommandForgeGraphic({ primaryColor, accentColor }: CommandForgeGraphicProps = {}) {
  const customVars = {
    ...(primaryColor ? { '--gfx-primary': primaryColor } : {}),
    ...(accentColor ? { '--gfx-accent': accentColor } : {}),
  } as CSSProperties;

  return (
    <Box className="gts-graphic-scope gts-forge-root" style={customVars}>
      <motion.div
        className="gts-forge-ring-outer"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="gts-forge-ring-inner"
        animate={{ rotate: -360 }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="gts-forge-core"
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <IconCpu size={34} />
      </motion.div>
    </Box>
  );
}