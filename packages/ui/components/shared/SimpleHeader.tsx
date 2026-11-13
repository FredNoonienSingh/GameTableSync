'use client';

import { Box, Group, Text, Anchor } from '@mantine/core';
import { gtsPureLogo } from '@gts/ui';

export function SimpleHeader({ href = '/' }: { href?: string }) {
  const logoSrc = typeof gtsPureLogo === 'string' ? gtsPureLogo : (gtsPureLogo as { src: string }).src;

  return (
    <Box className="gts-simple-header">
      <Anchor href={href} underline="never" className="gts-simple-header-anchor">
        <Group gap="sm" align="center">
          <img src={logoSrc} alt="GameTableSync Logo" className="gts-simple-header-logo" />
          <Text className="brand-logo gts-simple-header-text"  >
            GAMETABLESYNC
          </Text>
        </Group>
      </Anchor>
    </Box>
  );
}