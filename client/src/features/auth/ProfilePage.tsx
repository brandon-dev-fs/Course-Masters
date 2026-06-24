import { useState, useRef, FormEvent } from 'react';

import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { authClient } from '../../api/auth.js';
import { usersApi } from '../../api/users.js';
import type { ThemePreference } from '../../api/types.js';
import ProfileAvatar from './ProfileAvatar.js';
import ThemeSegmentedControl from './ThemeSegmentedControl.js';
import Input from '../../components/Input.js';
import Button from '../../components/Button.js';
import ErrorMessage from '../../components/ErrorMessage.js';
import LoadingSpinner from '../../components/LoadingSpinner.js';

const roleBadge: Record<string, string> = {
  admin: 'bg-success/10 text-success border border-success/20',
  teacher: 'bg-accent-subtle text-accent border border-accent/20',
  student: 'bg-surface-raised text-muted-foreground border border-border',
};

const readOnlyInputClass =
  'w-full rounded-lg px-3 py-2 text-sm bg-surface border border-border-subtle text-muted-foreground cursor-default';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { themePreference, setThemePreference } = useTheme();

  // Name
  const [nameValue, setNameValue] = useState(user?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Theme preference
  const [themeError, setThemeError] = useState<string | null>(null);

  // Ref to track the last pref sent so rapid toggles don't cause stale reverts
  const latestThemePrefRef = useRef<ThemePreference>(themePreference);

  if (!user) return <LoadingSpinner fullPage />;

  async function handleSaveName(e?: FormEvent) {
    e?.preventDefault();
    if (!nameValue.trim()) {
      setNameError('Name cannot be empty');
      return;
    }
    setNameError(null);
    setNameSaving(true);
    try {
      const { error } = await authClient.updateUser({ name: nameValue.trim() });
      if (error) throw new Error(error.message);
      await refreshUser();
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await authClient.changePassword({ currentPassword, newPassword });
      if (error) throw new Error(error.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleThemeChange(pref: ThemePreference) {
    const previousPref = themePreference;
    latestThemePrefRef.current = pref;
    setThemePreference(pref);
    setThemeError(null);

    usersApi.updatePreferences({ themePreference: pref }).catch(() => {
      // Only revert if the user hasn't changed again in the meantime
      if (latestThemePrefRef.current === pref) {
        setThemePreference(previousPref);
        latestThemePrefRef.current = previousPref;
        setThemeError('Failed to save theme preference. Please try again.');
        setTimeout(() => setThemeError(null), 3000);
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* Profile header */}
      <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-border-subtle md:flex-row md:text-left">
        <ProfileAvatar name={user.name} />
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-text-primary">{user.name}</span>
          <span className="text-sm text-text-secondary">{user.email}</span>
          <span
            className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadge[user.role] ?? roleBadge.student}`}
          >
            {user.role}
          </span>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account card */}
        <section
          aria-labelledby="account-heading"
          className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-4"
        >
          <h2 id="account-heading" className="text-lg font-semibold text-foreground">
            Account
          </h2>

          <form onSubmit={(e) => void handleSaveName(e)} className="flex flex-col gap-4">
            {/* Display name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className="text-xs text-muted-foreground uppercase tracking-wide">
                Display Name
              </label>
              <Input
                id="displayName"
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="Your display name"
                autoComplete="name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs text-muted-foreground uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user.email}
                readOnly
                aria-readonly="true"
                className={readOnlyInputClass}
              />
            </div>

            {/* Role (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-xs text-muted-foreground uppercase tracking-wide">
                Role
              </label>
              <input
                id="role"
                value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                readOnly
                aria-readonly="true"
                className={readOnlyInputClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={nameSaving}>
                {nameSaving ? 'Saving…' : 'Save changes'}
              </Button>
              {nameSuccess && (
                <span role="status" className="text-sm text-success">
                  Saved!
                </span>
              )}
            </div>

            {nameError && <ErrorMessage message={nameError} />}
          </form>
        </section>

        {/* Change Password card */}
        <section
          aria-labelledby="password-heading"
          className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-4"
        >
          <h2 id="password-heading" className="text-lg font-semibold text-foreground">
            Change Password
          </h2>

          <form onSubmit={(e) => void handlePasswordChange(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currentPassword" className="text-xs text-muted-foreground uppercase tracking-wide">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPassword" className="text-xs text-muted-foreground uppercase tracking-wide">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-xs text-muted-foreground uppercase tracking-wide">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <Button type="submit" variant="secondary" disabled={passwordSaving}>
                {passwordSaving ? 'Updating…' : 'Update password'}
              </Button>
            </div>

            {passwordError && <ErrorMessage message={passwordError} />}
            {passwordSuccess && (
              <div
                role="status"
                className="rounded-md bg-success/10 border border-success/20 px-4 py-3 text-success text-sm"
              >
                Password updated successfully.
              </div>
            )}
          </form>
        </section>
      </div>

      {/* Preferences card */}
      <section
        aria-labelledby="preferences-heading"
        className="bg-surface rounded-2xl shadow-warm-sm border border-border p-6 flex flex-col gap-4"
      >
        <h2 id="preferences-heading" className="text-lg font-semibold text-foreground">
          Preferences
        </h2>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">Theme</p>
            <p className="text-xs text-text-secondary">Choose your preferred color theme</p>
          </div>
          <ThemeSegmentedControl value={themePreference} onChange={handleThemeChange} />
        </div>

        {themeError && (
          <p className="text-xs text-destructive mt-2">{themeError}</p>
        )}
      </section>
    </div>
  );
}
