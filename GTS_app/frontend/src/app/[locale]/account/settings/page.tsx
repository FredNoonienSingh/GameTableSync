'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  AccountSettingsPanel,
  type AccountSettingsUser,
  type AccountSettingsProfilePayload,
  type AccountSettingsPasswordPayload,
} from '@gts/ui';

export default function AccountSettingsPage() {
  const t = useTranslations('Account.settings');
  const locale = useLocale();

  const [user, setUser] = useState<AccountSettingsUser | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('gts_user');
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser));
      } catch {
        // Ignore parse error
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/account/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('gts_user', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    }
  }, []);

  const syncUserToStorageAndSidebar = (updatedUser: AccountSettingsUser) => {
    setUser(updatedUser);
    localStorage.setItem('gts_user', JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('gts-user-updated'));
  };

  const handleSaveProfile = async (payload: AccountSettingsProfilePayload) => {
    setIsSavingProfile(true);
    setStatusMessage(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.msg || 'Fehler beim Speichern des Profils.',
        });
        return;
      }
      if (data.user) {
        syncUserToStorageAndSidebar(data.user);
      }
      setStatusMessage({
        type: 'success',
        text: data.msg || 'Profil erfolgreich aktualisiert!',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Server nicht erreichbar. Bitte versuche es erneut.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    setIsUploadingAvatar(true);
    setStatusMessage(null);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.msg || 'Profilbild konnte nicht hochgeladen werden.',
        });
        return;
      }
      if (data.user) {
        syncUserToStorageAndSidebar(data.user);
      }
      setStatusMessage({
        type: 'success',
        text: data.msg || 'Profilbild erfolgreich aktualisiert!',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Upload fehlgeschlagen. Bitte überprüfe deine Verbindung.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleConnectDiscord = () => {
    window.location.href = `/api/auth/discord/login?locale=${encodeURIComponent(locale)}`;
  };

  const handleSavePasswordMock = async (payload: AccountSettingsPasswordPayload) => {
    setIsSavingPassword(true);
    setStatusMessage(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/account/password-mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.msg || 'Passwort-Änderung fehlgeschlagen.',
        });
        return;
      }
      setStatusMessage({
        type: 'success',
        text: data.msg,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Server nicht erreichbar.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <AccountSettingsPanel
      user={user}
      onSaveProfile={handleSaveProfile}
      onUploadAvatar={handleUploadAvatar}
      onConnectDiscord={handleConnectDiscord}
      onSavePasswordMock={handleSavePasswordMock}
      isSavingProfile={isSavingProfile}
      isUploadingAvatar={isUploadingAvatar}
      isSavingPassword={isSavingPassword}
      statusMessage={statusMessage}
      labels={{
        badge: t('badge'),
        title: t('title'),
        subtitle: t('subtitle'),
        avatarBadge: t('avatar.badge'),
        avatarTitle: t('avatar.title'),
        avatarDescription: t('avatar.description'),
        avatarUploadBtn: t('avatar.uploadBtn'),
        avatarHint: t('avatar.hint'),
        profileBadge: t('profile.badge'),
        profileTitle: t('profile.title'),
        profileDescription: t('profile.description'),
        usernameLabel: t('profile.usernameLabel'),
        usernamePlaceholder: t('profile.usernamePlaceholder'),
        emailLabel: t('profile.emailLabel'),
        realNameLabel: t('profile.realNameLabel'),
        realNamePlaceholder: t('profile.realNamePlaceholder'),
        ageLabel: t('profile.ageLabel'),
        agePlaceholder: t('profile.agePlaceholder'),
        cityLabel: t('profile.cityLabel'),
        cityPlaceholder: t('profile.cityPlaceholder'),
        cityHint: t('profile.cityHint'),
        bioLabel: t('profile.bioLabel'),
        bioPlaceholder: t('profile.bioPlaceholder'),
        bioHint: t('profile.bioHint'),
        saveProfileBtn: t('profile.saveBtn'),
        discordBadge: t('discord.badge'),
        discordTitle: t('discord.title'),
        discordDescription: t('discord.description'),
        discordConnectedBadge: t('discord.connectedBadge'),
        discordNotConnectedBadge: t('discord.notConnectedBadge'),
        discordConnectedAs: t('discord.connectedAs'),
        discordConnectBtn: t('discord.connectBtn'),
        discordResyncBtn: t('discord.resyncBtn'),
        securityBadge: t('security.badge'),
        securityTitle: t('security.title'),
        securityDescription: t('security.description'),
        securityMockBadge: t('security.mockBadge'),
        currentPasswordLabel: t('security.currentPasswordLabel'),
        newPasswordLabel: t('security.newPasswordLabel'),
        confirmPasswordLabel: t('security.confirmPasswordLabel'),
        passwordMismatchError: t('security.passwordMismatchError'),
        savePasswordBtn: t('security.saveBtn'),
      }}
    />
  );
}