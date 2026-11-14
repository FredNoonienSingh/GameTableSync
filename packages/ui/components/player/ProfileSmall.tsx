'use client'

import {Box, Container, Group, Text, Anchor} from '@mantine/core';
import {Player} from '@gts/ui';


export function ProfileSmall(){
  
  return (
      <Box
          style={{
            backgroundColor: 'rgba(15, 16, 12, 0.88)',
            border: '1px solid rgba(41, 212, 255, 0.25)',
            borderTop: '3px solid #29d4ff',
            backdropFilter: 'blur(8px)',
          }}
          >
          <Text>Here i am </Text>
      </Box>
  )
}