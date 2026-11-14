'use client';

import { Paper, Title, Text, Group, ThemeIcon, Stack } from '@mantine/core';

interface SubSectionProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function SubSection({ title, description, icon }: SubSectionProps) {
  return (
    <Paper p="md" radius="sm" className="gts-subsection-paper">
      <Group align="flex-start" wrap="nowrap" gap="md">
        {icon && (
          <ThemeIcon
            variant="light"
            size="lg"
            radius="sm"
            mt={2}
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--gts-primary) 15%, transparent)',
              color: 'var(--gts-primary)' 
            }}
          >
            {icon}
          </ThemeIcon>
        )}
        <Stack gap={4}>
          <Title
            order={4}
            className="brand-logo gts-subsection-title"
            style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)' }}
          >
            {title}
          </Title>
          <Text size="sm" style={{ color: 'var(--gts-text-secondary)', lineHeight: 1.5 }}>
            {description}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}