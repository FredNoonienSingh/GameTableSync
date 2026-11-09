'use client';

import { useRef } from 'react';
import { Container, Title, Text, Badge, Stack, Paper, Grid, Box } from '@mantine/core';
import { useScroll } from 'framer-motion';
import { CommandHubGraphic } from './animations/CommandHubGraphic';
import { FallingD6Graphic } from './animations/FallingD6Graphic';
import { RotatingD20Graphic } from './animations/RotatingD20Graphic';
import { FanningCardsGraphic } from './animations/FanningCardsGraphic';

export type AnimationVariant = 'intro' | 'hub' | 'd6' | 'd20' | 'tcg';

interface SectionProps {
  id?: string;
  badge: string;
  title: string;
  description: string;
  variant: AnimationVariant;
  reverse?: boolean;
  headerSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export function Section({
  id,
  badge,
  title,
  description,
  variant,
  reverse = false,
  headerSlot,
  children,
}: SectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  return (
    <Box
      id={id}
      ref={sectionRef}
      component="section"
      py={{ base: 60, md: 100 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Container size="lg" w="100%">
        {variant === 'intro' ? (
          <Stack align="center" ta="center" gap="lg">
            {headerSlot}
            <Badge color="brandBlue.5" variant="outline" size="lg">
              {badge}
            </Badge>
            <Title
              order={1}
              c="white"
              className="brand-logo"
              style={{
                fontSize: 'clamp(1.4rem, 3.8vw, 2.6rem)',
                lineHeight: 1.15,
                textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)',
                wordBreak: 'break-word',
              }}
            >
              {title}
            </Title>
            <Text size="lg" c="gray.4" maw={650} px={{ base: 'xs', sm: 0 }}>
              {description}
            </Text>
            {children}
          </Stack>
        ) : (
          <Grid gap={{ base: 32, md: 60 }} align="center">
            <Grid.Col span={{ base: 12, md: 7 }} order={{ base: 1, md: reverse ? 2 : 1 }}>
              <Paper
                p={{ base: 'lg', sm: 'xl' }}
                radius="md"
                style={{
                  backgroundColor: 'rgba(20, 22, 27, 0.85)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Stack gap="md">
                  <Badge color="brandBlue.6" variant="filled" size="md" w="fit-content">
                    {badge}
                  </Badge>
                  <Title
                    order={2}
                    c="brandBlue.4"
                    className="brand-logo"
                    style={{
                      fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                      lineHeight: 1.15,
                      wordBreak: 'break-word',
                    }}
                  >
                    {title}
                  </Title>
                  <Text size="md" c="gray.3" lh={1.6}>
                    {description}
                  </Text>

                  {children && (
                    <Stack gap="sm" mt="sm">
                      {children}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }} order={{ base: 2, md: reverse ? 1 : 2 }}>
              <Box
                style={{
                  height: 360,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {variant === 'hub' && <CommandHubGraphic progress={scrollYProgress} />}
                {variant === 'd6' && <FallingD6Graphic progress={scrollYProgress} />}
                {variant === 'd20' && <RotatingD20Graphic progress={scrollYProgress} />}
                {variant === 'tcg' && <FanningCardsGraphic progress={scrollYProgress} />}
              </Box>
            </Grid.Col>
          </Grid>
        )}
      </Container>
    </Box>
  );
}