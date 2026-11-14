'use client';

import { useRef } from 'react';
import { useScroll, type MotionValue } from 'framer-motion';
import { Container, Title, Text, Badge, Stack, Paper, Grid, Box } from '@mantine/core';

interface SectionProps {
  id?: string;
  badge?: string;
  title: string;
  description?: string;
  reverse?: boolean;
  headerSlot?: React.ReactNode;
  children?: React.ReactNode;
  /** 
   * A render prop that receives the scroll progress (0 to 1).
   * Example: (progress) => <CardCycloneGraphic progress={progress} />
   */
  graphicSlot?: (progress: MotionValue<number>) => React.ReactNode;
}

export function Section({
  id,
  badge,
  title,
  description,
  reverse = false,
  headerSlot,
  children,
  graphicSlot,
}: SectionProps) {
  const graphicRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: graphicRef,
    offset: ['start end', 'end start'],
  });

  // 1. Intro Layout (No Graphic)
  if (!graphicSlot) {
    return (
      <Box id={id} component="section" py={{ base: 60, md: 100 }} className="gts-section">
        <Container size="lg" w="100%">
          <Stack align="center" ta="center" gap="lg">
            {headerSlot}
            
            {badge && (
              <Badge variant="outline" size="lg" className="brand-logo gts-game-meta-tag">
                {badge}
              </Badge>
            )}
            
            <Title order={1} className="brand-logo gts-section-intro-title">
              {title}
            </Title>
            
            {description && (
              <Text size="lg" c="gray.4" maw={650} px={{ base: 'xs', sm: 0 }}>
                {description}
              </Text>
            )}
            
            {children && (
              <Stack 
                w="100%" 
                maw={800} 
                align="stretch" 
                ta="left" 
                mt="xl" 
                gap="md"
              >
                {children}
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
    );
  }

  // 2. Split Layout (With Graphic)
  return (
    <Box id={id} component="section" py={{ base: 60, md: 100 }} className="gts-section">
      <Container size="lg" w="100%">
        <Grid gap={{ base: 32, md: 60 }} align="center">
          <Grid.Col
            span={{ base: 12, md: 7 }}
            order={{ base: 1, md: reverse ? 2 : 1 }}
          >
            <Paper p={{ base: 'lg', sm: 'xl' }} radius="md" className="gts-section-paper">
              <Stack gap="md">
                {badge && (
                  <Badge variant="filled" size="md" w="fit-content" style={{ backgroundColor: 'var(--gts-primary)', color: 'var(--gts-bg-canvas)' }}>
                    {badge}
                  </Badge>
                )}
                <Title order={2} className="brand-logo gts-section-title">
                  {title}
                </Title>
                {description && (
                  <Text size="md" style={{ color: 'var(--gts-text-secondary)', lineHeight: 1.6 }}>
                    {description}
                  </Text>
                )}

                {children && (
                  <Stack gap="sm" mt="sm">
                    {children}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col
            span={{ base: 12, md: 5 }}
            order={{ base: 2, md: reverse ? 1 : 2 }}
          >
            <Box ref={graphicRef} className="gts-section-graphic-box">
              {graphicSlot(scrollYProgress)}
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}