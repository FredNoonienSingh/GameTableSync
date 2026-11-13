'use client';

import { useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Paper,
  Stack,
  Title,
  Text,
  Notification,
  Box,
  Container,
  Grid,
  Badge,
  Group,
  ThemeIcon,
  Anchor,
} from '@mantine/core';
import { IconSend, IconCheck, IconX, IconMail, IconBrandDiscord } from '@tabler/icons-react';

export interface ContactFormLabels {
  title?: string;
  subtitle?: string;
  emailLabel?: string;
  subjectLabel?: string;
  messageLabel?: string;
  success?: string;
  error?: string;
  submit?: string;
}

const defaultLabels: Required<ContactFormLabels> = {
  title: 'Join the Command Network',
  subtitle: 'Establish secure communications for early access and support inquiries.',
  emailLabel: 'Commander Email',
  subjectLabel: 'Subject',
  messageLabel: 'Transmission Message',
  success: 'Transmission sent successfully!',
  error: 'Transmission failed. Please try again.',
  submit: 'Send Transmission',
};

const inputClassNames = {
  input: 'gts-contact-input',
  label: 'gts-contact-label',
};

export function ContactForm({ labels }: { labels?: ContactFormLabels }) {
  const t = { ...defaultLabels, ...labels };

  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <Box component="section" py={{ base: 80, md: 140 }} className="gts-contact-section">
      <Container size="lg" w="100%">
        <Grid gap={{ base: 50, md: 80 }} align="center">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <Badge color="brandBlue.5" variant="outline" size="lg" className="gts-contact-badge">
                SECURE CHANNEL
              </Badge>
              <Title order={2} c="white" className="brand-logo gts-contact-title">
                {t.title}
              </Title>
              <Text size="lg" c="gray.4" lh={1.6}>
                {t.subtitle}
              </Text>

              <Stack gap="lg" mt="xl">
                <Anchor href="mailto:info@GameTableSync.com" underline="never">
                  <Group className="gts-contact-mail-group">
                    <ThemeIcon
                      size="xl"
                      variant="light"
                      color="brandBlue.5"
                      radius="md"
                      className="gts-contact-mail-icon"
                    >
                      <IconMail size={22} />
                    </ThemeIcon>
                    <Text c="gray.3" className="brand-logo gts-contact-mail-text" size="sm">
                      info@GameTableSync.com
                    </Text>
                  </Group>
                </Anchor>

                <Button
                  component={discordUrl ? 'a' : 'button'}
                  href={discordUrl || undefined}
                  target={discordUrl ? '_blank' : undefined}
                  disabled={!discordUrl}
                  size="lg"
                  radius="md"
                  leftSection={<IconBrandDiscord size={22} />}
                  className="brand-logo gts-contact-discord-btn"
                >
                  Official Community Server
                </Button>
              </Stack>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper
              p={{ base: 'xl', sm: 'clamp(2rem, 4vw, 3rem)' }}
              radius="md"
              className="gts-contact-card"
            >
              <form onSubmit={handleSubmit}>
                <Stack gap="lg">
                  <TextInput
                    required
                    type="email"
                    label={t.emailLabel}
                    placeholder="commander@club.com"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    classNames={inputClassNames}
                  />

                  <TextInput
                    required
                    label={t.subjectLabel}
                    placeholder="Early Access / Support"
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value)}
                    classNames={inputClassNames}
                  />

                  <Textarea
                    required
                    label={t.messageLabel}
                    placeholder="..."
                    minRows={5}
                    value={message}
                    onChange={(e) => setMessage(e.currentTarget.value)}
                    classNames={inputClassNames}
                  />

                  {status === 'success' && (
                    <Notification
                      icon={<IconCheck size={18} />}
                      color="teal"
                      onClose={() => setStatus('idle')}
                      withCloseButton={false}
                    >
                      {t.success}
                    </Notification>
                  )}

                  {status === 'error' && (
                    <Notification icon={<IconX size={18} />} color="red" onClose={() => setStatus('idle')}>
                      {t.error}
                    </Notification>
                  )}

                  <Button
                    type="submit"
                    size="xl"
                    color="brandBlue.6"
                    loading={status === 'loading'}
                    leftSection={<IconSend size={20} />}
                    className="brand-logo"
                    mt="md"
                    fullWidth
                    classNames={{
                      root: 'gts-contact-submit-root',
                      label: 'gts-contact-submit-label',
                    }}
                  >
                    {t.submit}
                  </Button>
                </Stack>
              </form>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}