'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Stack, Text, Box } from '@mantine/core';
import { motion, useScroll, useTransform } from 'framer-motion';
import { gtsPureLogo } from '@gts/ui';

export interface BrandHeaderProps {
  logoSrc?: string | { src: string; height: number; width: number };
}

export function BrandHeader({ logoSrc = gtsPureLogo }: BrandHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const { scrollY } = useScroll();

  const logoShimmerPos = useTransform(scrollY, [0, 450], ['180% 180%', '-80% -80%']);
  const textShimmerPos = useTransform(scrollY, [0, 450], ['0% 50%', '100% 50%']);
  const logoRotateX = useTransform(scrollY, [0, 450], [0, 12]);
  const logoScale = useTransform(scrollY, [0, 450], [1, 1.05]);

  const maskUrl = typeof logoSrc === 'string' ? logoSrc : logoSrc?.src;

  return (
    <Stack align="center" gap="xs" mb="md">
      {logoSrc && !imgError && (
        <motion.div
          className="gts-brand-logo-wrap"
          style={{
            rotateX: logoRotateX,
            scale: logoScale,
          }}
        >
          <Image
            src={logoSrc}
            alt="GameTableSync Icon"
            fill
            priority
            sizes="(max-width: 768px) 160px, 250px"
            className="gts-brand-logo-img"
            onError={() => setImgError(true)}
          />
          {maskUrl && (
            <motion.div
              className="gts-brand-logo-shimmer"
              style={{
                backgroundPosition: logoShimmerPos,
                WebkitMaskImage: `url(${maskUrl})`,
                maskImage: `url(${maskUrl})`,
              }}
            />
          )}
        </motion.div>
      )}

      <Box className="gts-brand-text-box">
        <motion.div
          className="gts-brand-text-shimmer"
          style={{ backgroundPosition: textShimmerPos }}
        >
          <Text component="span" className="brand-logo gts-brand-title">
            GameTableSync
          </Text>
        </motion.div>
      </Box>
    </Stack>
  );
}