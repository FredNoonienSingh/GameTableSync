'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  TextInput,
  Textarea,
  PasswordInput,
  Button,
  Avatar,
  FileButton,
  SimpleGrid,
  Alert,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconUpload,
  IconBrandDiscord,
  IconDeviceFloppy,
  IconShieldLock,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconRefresh,
} from '@tabler/icons-react';

export interface AccountSettingsUser {
  id?: string | number;
  username: string;
  email: string;
  discord_id?: string | null;
  discord_account?: string | null;
  avatar_url?: string | null;
  real_name?: string | null;
  age?: number | null;
  city_or_zip?: string | null;
  bio?: string | null;
  has_password?: boolean;
}

export interface AccountSettingsProfilePayload {
  username: string;
  real_name: string;
  age: number | null;
  city_or_zip: string;
  bio: string;
}

export interface AccountSettingsPasswordPayload {
  current_password?: string;
  new_password: string;
}

export interface AccountSettingsLabels {
  badge: string;
  title: string;
  subtitle: string;

  avatarBadge: string;
  avatarTitle: string;
  avatarDescription: string;
  avatarUploadBtn: string;
  avatarHint: string;

  profileBadge: string;
  profileTitle: string;
  profileDescription: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  emailLabel: string;
  realNameLabel: string;
  realNamePlaceholder: string;
  ageLabel: string;
  agePlaceholder: string;
  cityLabel: string;
  cityPlaceholder: string;
  cityHint: string;
  bioLabel: string;
  bioPlaceholder: string;
  bioHint: string;
  saveProfileBtn: string;

  discordBadge: string;
  discordTitle: string;
  discordDescription: string;
  discordConnectedBadge: string;
  discordNotConnectedBadge: string;
  discordConnectedAs: string;
  discordConnectBtn: string;
  discordResyncBtn: string;

  securityBadge: string;
  securityTitle: string;
  securityDescription: string;
  securityMockBadge: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordMismatchError: string;
  savePasswordBtn: string;
}

export interface AccountSettingsPanelProps {
  user: AccountSettingsUser | null;
  labels: AccountSettingsLabels;
  onSaveProfile: (payload: AccountSettingsProfilePayload) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  onConnectDiscord: () => void;
  onSavePasswordMock: (payload: AccountSettingsPasswordPayload) => Promise<void>;
  isSavingProfile?: boolean;
  isUploadingAvatar?: boolean;
  isSavingPassword?: boolean;
  statusMessage?: { type: 'success' | 'error'; text: string } | null;
}

const inputClassNames = {
  input: 'gts-input-field',
  label: 'gts-input-label',
};

export function AccountSettingsPanel({
  user,
  labels,
  onSaveProfile,
  onUploadAvatar,
  onConnectDiscord,
  onSavePasswordMock,
  isSavingProfile = false,
  isUploadingAvatar = false,
  isSavingPassword = false,
  statusMessage,
}: AccountSettingsPanelProps) {
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [ageStr, setAgeStr] = useState('');
  const [cityOrZip, setCityOrZip] = useState('');
  const [bio, setBio] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setRealName(user.real_name || '');
      setAgeStr(user.age != null ? String(user.age) : '');
      setCityOrZip(user.city_or_zip || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAge = ageStr.trim() ? parseInt(ageStr.trim(), 10) : null;
    await onSaveProfile({
      username: username.trim(),
      real_name: realName.trim(),
      age: Number.isNaN(parsedAge as number) ? null : parsedAge,
      city_or_zip: cityOrZip.trim(),
      bio: bio.trim(),
    });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPassword !== confirmPassword) {
      setPwError(labels.passwordMismatchError);
      return;
    }
    await onSavePasswordMock({
      current_password: currentPassword,
      new_password: newPassword,
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const isDiscordLinked = Boolean(user?.discord_id);

  return (
    <Stack gap="lg" maw={1100}>
      <Paper
        p={{ base: 'lg', md: 'xl' }}
        radius="md"
        withBorder
        className="gts-panel-header"
      >
        <Stack gap="xs">
          <Group gap="xs">
            <Badge variant="outline" size="sm" className="brand-logo gts-game-meta-tag">
              {labels.badge}
            </Badge>
          </Group>
          <Title order={2} className="brand-logo gts-army-title">
            {labels.title}
          </Title>
          <Text size="sm" maw={700} className="gts-text-subtitle">
            {labels.subtitle}
          </Text>
        </Stack>
      </Paper>

      {statusMessage && (
        <Alert
          color={statusMessage.type === 'success' ? 'teal' : 'red'}
          variant="light"
          icon={
            statusMessage.type === 'success' ? (
              <IconCheck size={18} />
            ) : (
              <IconAlertCircle size={18} />
            )
          }
        >
          {statusMessage.text}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* 1. Profile Picture Card */}
        <Paper p="lg" radius="md" withBorder className="gts-panel-card">
          <Stack justify="space-between" h="100%" gap="md">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Text fw={700} size="sm" className="brand-logo" c="white">
                  {labels.avatarTitle}
                </Text>
                <Badge variant="outline" size="xs" className="brand-logo gts-game-meta-tag">
                  {labels.avatarBadge}
                </Badge>
              </Group>
              <Text size="xs" className="gts-text-description">
                {labels.avatarDescription}
              </Text>
            </Stack>

            <Group gap="lg" align="center" wrap="nowrap">
              <Avatar
                src={user?.avatar_url || null}
                alt={user?.username || 'Avatar'}
                size={84}
                radius="md"
                color="blue"
                className="gts-avatar-border"
              >
                <IconUser size={36} />
              </Avatar>

              <Stack gap={6} className="gts-flex-1">
                <FileButton
                  onChange={(file) => {
                    if (file) onUploadAvatar(file);
                  }}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                >
                  {(props) => (
                    <Button
                      {...props}
                      variant="light"
                      size="sm"
                      loading={isUploadingAvatar}
                      leftSection={<IconUpload size={16} />}
                    >
                      {labels.avatarUploadBtn}
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed">
                  {labels.avatarHint}
                </Text>
              </Stack>
            </Group>
          </Stack>
        </Paper>

        {/* 2. Discord Connection Card */}
        <Paper
          p="lg"
          radius="md"
          withBorder
          className={`gts-panel-discord ${isDiscordLinked ? 'gts-panel-discord-linked' : ''}`}
        >
          <Stack justify="space-between" h="100%" gap="md">
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconBrandDiscord size={20} color="#5865F2" />
                  <Text fw={700} size="sm" className="brand-logo" c="white">
                    {labels.discordTitle}
                  </Text>
                </Group>
                <Badge
                  variant="light"
                  color={isDiscordLinked ? 'indigo' : 'gray'}
                  size="xs"
                  className="brand-logo"
                >
                  {isDiscordLinked
                    ? labels.discordConnectedBadge
                    : labels.discordNotConnectedBadge}
                </Badge>
              </Group>
              <Text size="xs" className="gts-text-description">
                {labels.discordDescription}
              </Text>
            </Stack>

            {isDiscordLinked ? (
              <Stack gap="xs">
                <Paper p="sm" radius="sm" className="gts-panel-discord-subcard">
                  <Group justify="space-between" wrap="nowrap">
                    <Box>
                      <Text size="xs" c="indigo.2" fw={700}>
                        {labels.discordConnectedAs} @{user?.discord_account || user?.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Discord-ID: {user?.discord_id}
                      </Text>
                    </Box>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="indigo"
                      leftSection={<IconRefresh size={14} />}
                      onClick={onConnectDiscord}
                    >
                      {labels.discordResyncBtn}
                    </Button>
                  </Group>
                </Paper>
              </Stack>
            ) : (
              <Button
                fullWidth
                color="indigo"
                variant="filled"
                leftSection={<IconBrandDiscord size={18} />}
                onClick={onConnectDiscord}
              >
                {labels.discordConnectBtn}
              </Button>
            )}
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* 3. Profile, Bio & Location Form */}
      <Paper
        component="form"
        onSubmit={handleProfileSubmit}
        p={{ base: 'lg', md: 'xl' }}
        radius="md"
        withBorder
        className="gts-panel-card"
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Box>
              <Text fw={700} size="sm" className="brand-logo" c="white">
                {labels.profileTitle}
              </Text>
              <Text size="xs" mt={2} className="gts-text-subtitle">
                {labels.profileDescription}
              </Text>
            </Box>
            <Badge variant="outline" size="xs" className="brand-logo gts-game-meta-tag">
              {labels.profileBadge}
            </Badge>
          </Group>

          <Divider color="rgba(255, 255, 255, 0.08)" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label={labels.usernameLabel}
              placeholder={labels.usernamePlaceholder}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              classNames={inputClassNames}
            />
            <TextInput
              label={labels.emailLabel}
              value={user?.email || ''}
              disabled
              classNames={inputClassNames}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <TextInput
              label={labels.realNameLabel}
              placeholder={labels.realNamePlaceholder}
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              classNames={inputClassNames}
            />
            <TextInput
              label={labels.ageLabel}
              placeholder={labels.agePlaceholder}
              type="number"
              min={6}
              max={120}
              value={ageStr}
              onChange={(e) => setAgeStr(e.target.value)}
              classNames={inputClassNames}
            />
            <TextInput
              label={labels.cityLabel}
              placeholder={labels.cityPlaceholder}
              description={labels.cityHint}
              leftSection={<IconMapPin size={16} />}
              value={cityOrZip}
              onChange={(e) => setCityOrZip(e.target.value)}
              classNames={inputClassNames}
            />
          </SimpleGrid>

          <Textarea
            label={labels.bioLabel}
            placeholder={labels.bioPlaceholder}
            description={`${bio.length}/280 — ${labels.bioHint}`}
            maxLength={280}
            minRows={3}
            autosize
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            classNames={inputClassNames}
          />

          <Group justify="flex-end" mt="xs">
            <Button
              type="submit"
              variant="default"
              loading={isSavingProfile}
              leftSection={<IconDeviceFloppy size={18} />}
              className="brand-logo gts-modal-submit-btn"
            >
              {labels.saveProfileBtn}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* 4. Password Change Card (Mocked) */}
      <Paper
        component="form"
        onSubmit={handlePasswordSubmit}
        p={{ base: 'lg', md: 'xl' }}
        radius="md"
        withBorder
        className="gts-panel-card"
      >
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <Box>
              <Text fw={700} size="sm" className="brand-logo" c="white">
                {labels.securityTitle}
              </Text>
              <Text size="xs" mt={2} className="gts-text-subtitle">
                {labels.securityDescription}
              </Text>
            </Box>
            <Group gap="xs">
              <Badge variant="light" color="yellow" size="xs" className="brand-logo">
                {labels.securityMockBadge}
              </Badge>
              <Badge variant="outline" size="xs" className="brand-logo gts-game-meta-tag">
                {labels.securityBadge}
              </Badge>
            </Group>
          </Group>

          <Divider color="rgba(255, 255, 255, 0.08)" />

          {pwError && (
            <Text size="xs" c="red.4" fw={700}>
              {pwError}
            </Text>
          )}

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <PasswordInput
              label={labels.currentPasswordLabel}
              placeholder="********"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              classNames={inputClassNames}
            />
            <PasswordInput
              label={labels.newPasswordLabel}
              placeholder="********"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              classNames={inputClassNames}
            />
            <PasswordInput
              label={labels.confirmPasswordLabel}
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              classNames={inputClassNames}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="xs">
            <Button
              type="submit"
              variant="light"
              color="gray"
              loading={isSavingPassword}
              leftSection={<IconShieldLock size={18} />}
              className="brand-logo"
            >
              {labels.savePasswordBtn}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}