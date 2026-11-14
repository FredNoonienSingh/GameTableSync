'use client';

import { useState, type ReactNode, type CSSProperties } from 'react';
import { Container, Stack, Title, Text, Badge, UnstyledButton, Box } from '@mantine/core';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';

export interface TabbedShowcaseItem {
  value: string;
  label: string;
  icon?: ReactNode;
  badge?: string;
  color?: string;
  content: ReactNode | (() => ReactNode);
}

export interface TabbedShowcaseProps {
  tabs: TabbedShowcaseItem[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  badge?: string;
  title?: string;
  subtitle?: string;
  fullHeight?: boolean;
  stickyNav?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 90 : -90,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 90 : -90,
    opacity: 0,
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

export function TabbedShowcase({
  tabs,
  defaultValue,
  value,
  onChange,
  badge,
  title,
  subtitle,
  fullHeight = false,
  stickyNav = false,
  containerSize = 'xl',
}: TabbedShowcaseProps) {
  const initialIdx = defaultValue
    ? Math.max(0, tabs.findIndex((t) => t.value === defaultValue))
    : 0;
  const [[page, direction], setPage] = useState([initialIdx, 0]);

  const activeIndex = value ? tabs.findIndex((t) => t.value === value) : page;
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeTabObj = tabs[safeIndex];

  const paginate = (newDirection: number) => {
    let nextIndex = safeIndex + newDirection;
    if (nextIndex < 0) nextIndex = tabs.length - 1;
    if (nextIndex >= tabs.length) nextIndex = 0;

    setPage([nextIndex, newDirection]);
    onChange?.(tabs[nextIndex].value);
  };

  const handleSelect = (idx: number) => {
    if (idx === safeIndex) return;
    const newDirection = idx > safeIndex ? 1 : -1;
    setPage([idx, newDirection]);
    onChange?.(tabs[idx].value);
  };

  const renderContent = (content: TabbedShowcaseItem['content']) =>
    typeof content === 'function' ? content() : content;

  const activeColor = activeTabObj?.color || 'var(--gts-primary)';

  return (
    <Box
      component="section"
      py={{ base: 32, md: 64 }}
      className="gts-tabbed-showcase"
      data-full-height={fullHeight ? 'true' : undefined}
    >
      <Container
        size={containerSize}
        w="100%"
        px={{ base: 'xs', sm: 'md' }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {(badge || title || subtitle) && (
          <Stack align="center" ta="center" gap="sm" mb="xl">
            {badge && (
              <Badge variant="outline" size="lg" className="brand-logo gts-game-meta-tag">
                {badge}
              </Badge>
            )}
            {title && (
              <Title order={2} className="brand-logo gts-section-title">
                {title}
              </Title>
            )}
            {subtitle && (
              <Text size="md" maw={680} style={{ color: 'var(--gts-text-secondary)' }}>
                {subtitle}
              </Text>
            )}
          </Stack>
        )}

        <div className="gts-tabbed-nav-wrap" data-sticky={stickyNav ? 'true' : undefined}>
          <div className="gts-tabbed-bar" role="tablist">
            {tabs.map((tab, idx) => {
              const isActive = idx === safeIndex;
              const tabStyle = (tab.color ? { '--tab-color': tab.color } : {}) as CSSProperties;

              return (
                <UnstyledButton
                  key={tab.value}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  title={tab.label}
                  data-active={isActive ? 'true' : undefined}
                  className="brand-logo gts-tabbed-trigger"
                  style={tabStyle}
                  onClick={() => handleSelect(idx)}
                >
                  {tab.icon && <span className="gts-tabbed-trigger-icon">{tab.icon}</span>}
                  <span className="gts-tabbed-trigger-label">{tab.label}</span>
                  {tab.badge && (
                    <Badge
                      size="xs"
                      variant="outline"
                      className="brand-logo gts-tabbed-trigger-badge"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </UnstyledButton>
              );
            })}
          </div>
        </div>

        <Box
          className="gts-tabbed-arena"
          style={
            {
              '--tab-active-color': activeColor,
              '--gts-primary': activeColor,
              '--gts-accent': activeColor,
            } as CSSProperties
          }
        >

          <button
            type="button"
            className="gts-tab-edge-trigger gts-tab-edge-trigger-left"
            onClick={() => paginate(-1)}
            aria-label="Previous tab"
          />

          <div className="gts-tabbed-swipe-wrap">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={page}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(_e, { offset, velocity }: PanInfo) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                {renderContent(activeTabObj.content)}
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="gts-tab-edge-trigger gts-tab-edge-trigger-right"
            onClick={() => paginate(1)}
            aria-label="Next tab"
          />
        </Box>
      </Container>
    </Box>
  );
}