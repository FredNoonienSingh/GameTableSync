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
          style={{
            position: 'relative',
            width: 'clamp(160px, 24vw, 250px)',
            aspectRatio: '1 / 1',
            rotateX: logoRotateX,
            scale: logoScale,
            filter: 'drop-shadow(0 8px 28px rgba(24, 100, 255, 0.45))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src={logoSrc}
            alt="GameTableSync Icon"
            fill
            priority
            sizes="(max-width: 768px) 160px, 250px"
            style={{ objectFit: 'contain' }}
            onError={() => setImgError(true)}
          />
          {maskUrl && (
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                backgroundImage:
                  'linear-gradient(135deg, transparent 42%, rgba(41, 212, 255, 0.85) 48%, rgba(255, 255, 255, 1) 50%, rgba(41, 212, 255, 0.85) 52%, transparent 58%)',
                backgroundSize: '250% 250%',
                backgroundPosition: logoShimmerPos,
                WebkitMaskImage: `url(${maskUrl})`,
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskImage: `url(${maskUrl})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                mixBlendMode: 'overlay',
              }}
            />
          )}
        </motion.div>
      )}

      <Box style={{ position: 'relative' }}>
        <motion.div
          style={{
            backgroundImage:
              'linear-gradient(90deg, #1864ff 0%, #1864ff 38%, #ffffff 50%, #29d4ff 56%, #1864ff 68%, #1864ff 100%)',
            backgroundSize: '220% auto',
            backgroundPosition: textShimmerPos,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 24px rgba(24, 100, 255, 0.35))',
          }}
        >
          <Text
            component="span"
            className="brand-logo"
            style={{
              fontSize: 'clamp(2.4rem, 8.5vw, 5.75rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '0.06em',
              display: 'block',
            }}
          >
            GameTableSync
          </Text>
        </motion.div>
      </Box>
    </Stack>
  );
}