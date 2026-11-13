'use client';

import { Paper, Title, Text, Group, ThemeIcon, Stack } from '@mantine/core';

interface SubSectionProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function SubSection({ title, description, icon }: SubSectionProps) {
  return (
    <Paper
      p="md"
      radius="sm"
      style={{
        position: 'relative',
        zIndex: 3,
        backgroundColor: 'rgba(15, 16, 12, 0.92)',
        border: '1px solid rgba(24, 100, 255, 0.2)',
        borderLeft: '3px solid #1864ff',
      }}
    >
      <Group align="flex-start" wrap="nowrap" gap="md">
        {icon && (
          <ThemeIcon
            variant="light"
            color="brandBlue.6"
            size="lg"
            radius="sm"
            mt={2}
            style={{ backgroundColor: 'rgba(24, 100, 255, 0.15)' }}
          >
            {icon}
          </ThemeIcon>
        )}
        <Stack gap={4}>
          <Title
            order={4}
             
            className="brand-logo"
            style={{
              fontSize: 'clamp(0.95rem, 2.2vw, 1.15rem)',
            }}
          >
            {title}
          </Title>
          <Text size="sm" c="gray.4" lh={1.5}>
            {description}
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}