'use client';

import { Box, Container, Group, Text, Anchor } from '@mantine/core';
import { gtsPureLogo } from '@gts/ui';

export function SimpleHeader({ href = '/' }: { href?: string }) {
  const logoSrc = typeof gtsPureLogo === 'string' ? gtsPureLogo : (gtsPureLogo as { src: string }).src;

  return (
    <Box
      style={{
        paddingTop: 86, // 70px navbar height + 16px top spacing
        paddingBottom: 16,
        paddingLeft: 16,
        position: 'relative',
        zIndex: 10,
      }}
    >
        <Anchor href={href} underline="never" style={{ display: 'inline-block' }}>
          <Group gap="sm" align="center">
            <img
              src={logoSrc}
              alt="GameTableSync Logo"
              style={{
                width: 36,
                height: 36,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(24, 100, 255, 0.4))',
              }}
            />
            <Text
              className="brand-logo"
              c="white"
              style={{
                fontSize: '1.1rem',
                letterSpacing: '0.08em',
                textShadow: '0 2px 12px rgba(24, 100, 255, 0.35)',
              }}
            >
              GAMETABLESYNC
            </Text>
          </Group>
        </Anchor>
    </Box>
  );
}