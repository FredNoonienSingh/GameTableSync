import { useTranslations } from 'next-intl';
import { Container, Title, Text, Paper, Button, Stack } from '@mantine/core';
import { Link } from '@/i18n/routing';
import { IconArrowLeft } from '@tabler/icons-react';

export default function PrivacyPage() {
  const t = useTranslations('Terms');

  return (
    <Container size="md" py={100} style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <Stack gap="xl">
        <Link href="/" style={{ textDecoration: 'none', width: 'fit-content' }}>
          <Button 
            variant="subtle" 
            color="brandBlue.4" 
            leftSection={<IconArrowLeft size={16} />} 
            className="brand-logo"
            px={0}
          >
            {t('back')}
          </Button>
        </Link>
        
        <Title 
          order={1} 
          c="white" 
          className="brand-logo"
          style={{ textShadow: '0 4px 25px rgba(24, 100, 255, 0.35)' }}
        >
          {t('title')}
        </Title>
        
        <Paper 
          p={{ base: 'md', sm: 'xl' }} 
          radius="md" 
          style={{ 
            backgroundColor: 'rgba(20, 22, 27, 0.85)', 
            border: '1px solid rgba(24, 100, 255, 0.15)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Text c="gray.3" lh={1.7}>
            {t('placeholder')}
          </Text>
        </Paper>
      </Stack>
    </Container>
  );
}